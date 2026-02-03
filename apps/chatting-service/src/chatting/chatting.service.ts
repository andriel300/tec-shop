import { Injectable, Logger } from '@nestjs/common';
import { ChattingPrismaService } from '../prisma/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { MessageRedisService } from '../redis/message.redis.service';
import { OnlineRedisService } from '../redis/online.redis.service';
import { RedisService } from '../redis/redis.service';
import { SellerServiceClient } from '../clients/seller-client.module';
import { UserServiceClient } from '../clients/user-client.module';
import type {
  CreateConversationInternalDto,
  GetConversationsInternalDto,
  GetConversationDto,
  MarkConversationSeenDto,
  GetMessagesInternalDto,
  ParticipantType,
  ChatMessageEventDto,
} from '@tec-shop/dto';

interface ConversationResult {
  id: string;
  otherParticipant: {
    id: string;
    type: ParticipantType;
    name: string;
    avatar?: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderType: string;
    createdAt: string;
  };
  unreadCount: number;
  createdAt: string;
  lastSeenAt?: string;
}

interface CreateConversationResult {
  success: boolean;
  conversation?: ConversationResult;
  error?: string;
}

@Injectable()
export class ChattingService {
  private readonly logger = new Logger(ChattingService.name);

  constructor(
    private readonly prisma: ChattingPrismaService,
    private readonly kafkaService: KafkaService,
    private readonly messageRedisService: MessageRedisService,
    private readonly onlineRedisService: OnlineRedisService,
    private readonly redisService: RedisService,
    private readonly sellerClient: SellerServiceClient,
    private readonly userClient: UserServiceClient
  ) {}

  /**
   * Create a new conversation or return existing one between two parties
   */
  async createConversation(
    dto: CreateConversationInternalDto
  ): Promise<CreateConversationResult> {
    const { initiatorId, initiatorType, targetId, targetType, initialMessage } =
      dto;

    this.logger.log(
      `Creating conversation: ${initiatorType}(${initiatorId}) -> ${targetType}(${targetId})`
    );

    // Validate: users can only target sellers, sellers can only target users
    if (initiatorType === 'user' && targetType !== 'seller') {
      return {
        success: false,
        error: 'Users can only start conversations with sellers',
      };
    }
    if (initiatorType === 'seller' && targetType !== 'user') {
      return {
        success: false,
        error: 'Sellers can only start conversations with users',
      };
    }

    // Verify target exists
    if (targetType === 'seller') {
      const sellerExists = await this.sellerClient.verifySellerExists(targetId);
      if (!sellerExists) {
        return { success: false, error: 'Seller not found' };
      }
    } else {
      const userExists = await this.userClient.verifyUserExists(targetId);
      if (!userExists) {
        return { success: false, error: 'User not found' };
      }
    }

    // Check for existing conversation between these two parties
    const existingConversation = await this.findExistingConversation(
      initiatorId,
      initiatorType,
      targetId,
      targetType
    );

    if (existingConversation) {
      this.logger.log(
        `Found existing conversation: ${existingConversation.id}`
      );

      // If initial message provided, send it
      if (initialMessage) {
        await this.queueMessage(
          existingConversation.id,
          initiatorId,
          initiatorType,
          initialMessage
        );
      }

      return {
        success: true,
        conversation: await this.getConversationResponse(
          existingConversation.id,
          initiatorId,
          initiatorType
        ),
      };
    }

    // Create new conversation (ChatGroup)
    const newConversation = await this.prisma.chatGroup.create({
      data: {
        isGroup: false,
        creatorId: initiatorId,
        participantId: [], // Will be updated after creating participants
      },
    });

    // Create Participant records
    const initiatorParticipant = await this.prisma.participant.create({
      data: {
        conversationId: newConversation.id,
        userId: initiatorType === 'user' ? initiatorId : null,
        sellerId: initiatorType === 'seller' ? initiatorId : null,
        lastSeenAt: new Date(),
      },
    });

    const targetParticipant = await this.prisma.participant.create({
      data: {
        conversationId: newConversation.id,
        userId: targetType === 'user' ? targetId : null,
        sellerId: targetType === 'seller' ? targetId : null,
      },
    });

    // Update ChatGroup with participant IDs
    await this.prisma.chatGroup.update({
      where: { id: newConversation.id },
      data: {
        participantId: [initiatorParticipant.id, targetParticipant.id],
      },
    });

    this.logger.log(`Created new conversation: ${newConversation.id}`);

    // If initial message provided, queue it to Kafka
    if (initialMessage) {
      await this.queueMessage(
        newConversation.id,
        initiatorId,
        initiatorType,
        initialMessage
      );
    }

    return {
      success: true,
      conversation: await this.getConversationResponse(
        newConversation.id,
        initiatorId,
        initiatorType
      ),
    };
  }

  /**
   * Get list of conversations for a participant
   */
  async getConversations(dto: GetConversationsInternalDto): Promise<{
    conversations: ConversationResult[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { participantId, participantType, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    // Find all participants for this user/seller
    const participantField =
      participantType === 'user' ? 'userId' : 'sellerId';
    const participants = await this.prisma.participant.findMany({
      where: { [participantField]: participantId },
    });

    const conversationIds = participants.map((p) => p.conversationId);

    // Get total count
    const total = conversationIds.length;

    // Get paginated conversations
    const paginatedIds = conversationIds.slice(skip, skip + limit);

    // Get conversation details with enriched data
    const conversations: ConversationResult[] = [];

    for (const conversationId of paginatedIds) {
      const conversation = await this.getConversationResponse(
        conversationId,
        participantId,
        participantType
      );
      if (conversation) {
        conversations.push(conversation);
      }
    }

    // Sort by last message time (most recent first)
    conversations.sort((a, b) => {
      const aTime = a.lastMessage
        ? new Date(a.lastMessage.createdAt).getTime()
        : new Date(a.createdAt).getTime();
      const bTime = b.lastMessage
        ? new Date(b.lastMessage.createdAt).getTime()
        : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    return { conversations, total, page, limit };
  }

  /**
   * Get a single conversation details
   */
  async getConversation(
    dto: GetConversationDto
  ): Promise<ConversationResult | null> {
    const { conversationId, participantId, participantType } = dto;

    // Verify participant has access
    const hasAccess = await this.verifyParticipantAccess(
      conversationId,
      participantId,
      participantType
    );

    if (!hasAccess) {
      return null;
    }

    return this.getConversationResponse(
      conversationId,
      participantId,
      participantType
    );
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(dto: GetMessagesInternalDto) {
    const {
      conversationId,
      participantId,
      participantType,
      page = 1,
      limit = 20,
    } = dto;

    // Verify participant has access
    const hasAccess = await this.verifyParticipantAccess(
      conversationId,
      participantId,
      participantType
    );

    if (!hasAccess) {
      return { messages: [], total: 0, page, limit, error: 'Access denied' };
    }

    const skip = (page - 1) * limit;

    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await this.prisma.chatMessage.count({
      where: { conversationId },
    });

    return { messages: messages.reverse(), total, page, limit };
  }

  /**
   * Mark conversation as seen
   */
  async markConversationSeen(
    dto: MarkConversationSeenDto
  ): Promise<{ success: boolean }> {
    const { conversationId, participantId, participantType } = dto;

    // Find the participant record
    const participantField =
      participantType === 'user' ? 'userId' : 'sellerId';
    const participant = await this.prisma.participant.findFirst({
      where: {
        conversationId,
        [participantField]: participantId,
      },
    });

    if (!participant) {
      return { success: false };
    }

    // Update lastSeenAt
    await this.prisma.participant.update({
      where: { id: participant.id },
      data: { lastSeenAt: new Date(), unreadCount: 0 },
    });

    // Clear Redis unseen count
    await this.messageRedisService.clearUnseenCount(
      participantId,
      conversationId
    );

    this.logger.log(
      `Marked conversation ${conversationId} as seen for ${participantId}`
    );

    return { success: true };
  }

  /**
   * Check if a user is online
   */
  async checkOnline(userId: string): Promise<{ isOnline: boolean }> {
    const isOnline = await this.onlineRedisService.isUserOnline(userId);
    return { isOnline };
  }

  // ==================== Helper Methods ====================

  /**
   * Find existing conversation between two parties
   */
  private async findExistingConversation(
    initiatorId: string,
    initiatorType: ParticipantType,
    targetId: string,
    targetType: ParticipantType
  ): Promise<{ id: string } | null> {
    // Find all conversations where initiator is a participant
    const initiatorField =
      initiatorType === 'user' ? 'userId' : 'sellerId';
    const initiatorParticipants = await this.prisma.participant.findMany({
      where: { [initiatorField]: initiatorId },
    });

    // For each conversation, check if target is also a participant
    const targetField = targetType === 'user' ? 'userId' : 'sellerId';
    for (const participant of initiatorParticipants) {
      const targetParticipant = await this.prisma.participant.findFirst({
        where: {
          conversationId: participant.conversationId,
          [targetField]: targetId,
        },
      });

      if (targetParticipant) {
        return { id: participant.conversationId };
      }
    }

    return null;
  }

  /**
   * Verify participant has access to a conversation
   */
  private async verifyParticipantAccess(
    conversationId: string,
    participantId: string,
    participantType: ParticipantType
  ): Promise<boolean> {
    const participantField =
      participantType === 'user' ? 'userId' : 'sellerId';
    const participant = await this.prisma.participant.findFirst({
      where: {
        conversationId,
        [participantField]: participantId,
      },
    });

    return participant !== null;
  }

  /**
   * Get conversation response with enriched data
   */
  private async getConversationResponse(
    conversationId: string,
    participantId: string,
    participantType: ParticipantType
  ): Promise<ConversationResult | null> {
    const conversation = await this.prisma.chatGroup.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) return null;

    // Get all participants
    const participants = await this.prisma.participant.findMany({
      where: { conversationId },
    });

    // Find the other participant
    const currentParticipantField =
      participantType === 'user' ? 'userId' : 'sellerId';
    const otherParticipant = participants.find(
      (p) => p[currentParticipantField] !== participantId
    );

    if (!otherParticipant) return null;

    // Determine other participant type and ID
    const otherType: ParticipantType = otherParticipant.userId
      ? 'user'
      : 'seller';
    const otherId =
      otherType === 'user'
        ? otherParticipant.userId!
        : otherParticipant.sellerId!;

    // Get other participant info
    let otherInfo: { name: string; avatar?: string } | null = null;
    if (otherType === 'seller') {
      otherInfo = await this.sellerClient.getSellerChatInfo(otherId);
    } else {
      otherInfo = await this.userClient.getUserChatInfo(otherId);
    }

    // Get last message from Redis cache first, then DB
    let lastMessage = await this.redisService.getJson<{
      id: string;
      content: string;
      senderId: string;
      senderType: string;
      createdAt: string;
    }>(`chat:room:${conversationId}:last`);

    if (!lastMessage) {
      const dbLastMessage = await this.prisma.chatMessage.findFirst({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
      });

      if (dbLastMessage) {
        lastMessage = {
          id: dbLastMessage.id,
          content: dbLastMessage.content || '',
          senderId: dbLastMessage.senderId,
          senderType: dbLastMessage.senderType,
          createdAt: dbLastMessage.createdAt.toISOString(),
        };
      }
    }

    // Get unread count
    const unreadCount = await this.messageRedisService.getUnseenCount(
      participantId,
      conversationId
    );

    // Get current participant's lastSeenAt
    const currentParticipant = participants.find(
      (p) => p[currentParticipantField] === participantId
    );

    return {
      id: conversationId,
      otherParticipant: {
        id: otherId,
        type: otherType,
        name: otherInfo?.name || (otherType === 'seller' ? 'Seller' : 'User'),
        avatar: otherInfo?.avatar,
      },
      lastMessage: lastMessage || undefined,
      unreadCount,
      createdAt: conversation.createdAt.toISOString(),
      lastSeenAt: currentParticipant?.lastSeenAt?.toISOString(),
    };
  }

  /**
   * Queue a message to Kafka for processing
   */
  private async queueMessage(
    conversationId: string,
    senderId: string,
    senderType: ParticipantType,
    content: string
  ): Promise<void> {
    const payload: ChatMessageEventDto = {
      conversationId,
      senderId,
      senderType: senderType as 'user' | 'seller',
      content,
      createdAt: new Date().toISOString(),
    };

    await this.kafkaService.sendMessage(
      'chat.new_message',
      conversationId,
      payload
    );

    this.logger.log(`Queued initial message to Kafka for ${conversationId}`);
  }
}
