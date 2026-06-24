import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MonoPrismaService } from '../prisma/prisma.service';

export interface ConversationResult {
  id: string;
  otherParticipant: {
    id: string;
    type: 'customer' | 'seller';
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

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: MonoPrismaService) {}

  /**
   * Create a new conversation or return existing one
   */
  async createConversation(params: {
    initiatorId: string;
    initiatorType: 'customer' | 'seller';
    targetId: string;
    targetType: 'customer' | 'seller';
    initialMessage?: string;
  }) {
    const { initiatorId, initiatorType, targetId, targetType, initialMessage } = params;

    // Validate: customers can only target sellers, sellers can only target customers
    if (initiatorType === 'customer' && targetType !== 'seller') {
      throw new ForbiddenException('Customers can only start conversations with sellers');
    }
    if (initiatorType === 'seller' && targetType !== 'customer') {
      throw new ForbiddenException('Sellers can only start conversations with customers');
    }

    // Check for existing conversation
    const existing = await this.findExistingConversation(initiatorId, initiatorType, targetId, targetType);
    if (existing) {
      if (initialMessage) {
        await this.prisma.chatMessage.create({
          data: {
            conversationId: existing.id,
            senderId: initiatorId,
            senderType: initiatorType.toUpperCase(),
            content: initialMessage,
            status: 'sent',
          },
        });
      }
      const conv = await this.getConversationResponse(existing.id, initiatorId, initiatorType);
      return { conversation: conv };
    }

    // Create new conversation
    const conversation = await this.prisma.chatConversation.create({
      data: {
        isGroup: false,
        creatorId: initiatorId,
        participants: {
          createMany: {
            data: [
              {
                userId: initiatorType === 'customer' ? initiatorId : null,
                sellerId: initiatorType === 'seller' ? initiatorId : null,
                lastSeenAt: new Date(),
              },
              {
                userId: targetType === 'customer' ? targetId : null,
                sellerId: targetType === 'seller' ? targetId : null,
              },
            ],
          },
        },
      },
    });

    this.logger.log(`Created conversation ${conversation.id}`);

    if (initialMessage) {
      await this.prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: initiatorId,
          senderType: initiatorType.toUpperCase(),
          content: initialMessage,
          status: 'sent',
        },
      });
    }

    const conv = await this.getConversationResponse(conversation.id, initiatorId, initiatorType);
    return { conversation: conv };
  }

  /**
   * Get all conversations for a participant
   */
  async getConversations(params: {
    participantId: string;
    participantType: 'customer' | 'seller';
    page?: number;
    limit?: number;
  }) {
    const { participantId, participantType, page = 1, limit = 20 } = params;
    const field = participantType === 'customer' ? 'userId' : 'sellerId';

    const participants = await this.prisma.chatParticipant.findMany({
      where: { [field]: participantId },
      include: { conversation: true },
    });

    const total = participants.length;
    const paginated = participants.slice((page - 1) * limit, page * limit);

    const conversations = (
      await Promise.all(
        paginated.map((p) =>
          this.getConversationResponse(p.conversationId, participantId, participantType)
        )
      )
    ).filter((c): c is ConversationResult => c !== null);

    conversations.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    return { conversations, total, page, limit };
  }

  /**
   * Get a single conversation
   */
  async getConversation(conversationId: string, participantId: string, participantType: 'customer' | 'seller') {
    const hasAccess = await this.verifyAccess(conversationId, participantId, participantType);
    if (!hasAccess) throw new ForbiddenException('Access denied');
    return this.getConversationResponse(conversationId, participantId, participantType);
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(params: {
    conversationId: string;
    participantId: string;
    participantType: 'customer' | 'seller';
    page?: number;
    limit?: number;
  }) {
    const { conversationId, participantId, participantType, page = 1, limit = 20 } = params;

    const hasAccess = await this.verifyAccess(conversationId, participantId, participantType);
    if (!hasAccess) throw new ForbiddenException('Access denied');

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.chatMessage.count({ where: { conversationId } }),
    ]);

    return { messages: messages.reverse(), total, page, limit };
  }

  /**
   * Mark conversation as seen
   */
  async markAsSeen(conversationId: string, participantId: string, participantType: 'customer' | 'seller') {
    const field = participantType === 'customer' ? 'userId' : 'sellerId';
    const participant = await this.prisma.chatParticipant.findFirst({
      where: { conversationId, [field]: participantId },
    });
    if (!participant) throw new NotFoundException('Participant not found');

    await this.prisma.chatParticipant.update({
      where: { id: participant.id },
      data: { lastSeenAt: new Date(), unreadCount: 0 },
    });

    return { success: true };
  }

  // ==================== Helpers ====================

  private async findExistingConversation(
    id1: string, type1: 'customer' | 'seller',
    id2: string, type2: 'customer' | 'seller',
  ) {
    const field1 = type1 === 'customer' ? 'userId' : 'sellerId';
    const myParticipants = await this.prisma.chatParticipant.findMany({
      where: { [field1]: id1 },
    });

    const field2 = type2 === 'customer' ? 'userId' : 'sellerId';
    for (const p of myParticipants) {
      const other = await this.prisma.chatParticipant.findFirst({
        where: { conversationId: p.conversationId, [field2]: id2 },
      });
      if (other) {
        const conv = await this.prisma.chatConversation.findUnique({ where: { id: p.conversationId } });
        return conv;
      }
    }
    return null;
  }

  private async verifyAccess(
    conversationId: string, participantId: string, participantType: 'customer' | 'seller',
  ): Promise<boolean> {
    const field = participantType === 'customer' ? 'userId' : 'sellerId';
    const p = await this.prisma.chatParticipant.findFirst({
      where: { conversationId, [field]: participantId },
    });
    return p !== null;
  }

  private async getConversationResponse(
    conversationId: string,
    participantId: string,
    participantType: 'customer' | 'seller',
  ): Promise<ConversationResult | null> {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) return null;

    const participants = await this.prisma.chatParticipant.findMany({
      where: { conversationId },
    });

    const currentField = participantType === 'customer' ? 'userId' : 'sellerId';
    const otherParticipant = participants.find((p) => p[currentField] !== participantId);
    if (!otherParticipant) return null;

    const otherType: 'customer' | 'seller' = otherParticipant.userId ? 'customer' : 'seller';
    const otherId = otherType === 'customer' ? otherParticipant.userId! : otherParticipant.sellerId!;

    // Get user/seller name from the auth user
    let otherName = otherType === 'seller' ? 'Seller' : 'Customer';
    let otherAvatar: string | undefined;
    if (otherParticipant.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: otherParticipant.userId } });
      if (user) otherName = user.email;
    } else if (otherParticipant.sellerId) {
      const seller = await this.prisma.seller.findUnique({ where: { id: otherParticipant.sellerId } });
      if (seller) otherName = seller.name;
    }

    const lastMessage = await this.prisma.chatMessage.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });

    const currentParticipant = participants.find((p) => p[currentField] === participantId);

    return {
      id: conversationId,
      otherParticipant: { id: otherId, type: otherType, name: otherName, avatar: otherAvatar },
      lastMessage: lastMessage ? {
        id: lastMessage.id,
        content: lastMessage.content || '',
        senderId: lastMessage.senderId,
        senderType: lastMessage.senderType,
        createdAt: lastMessage.createdAt.toISOString(),
      } : undefined,
      unreadCount: currentParticipant?.unreadCount ?? 0,
      createdAt: conversation.createdAt.toISOString(),
      lastSeenAt: currentParticipant?.lastSeenAt?.toISOString(),
    };
  }
}
