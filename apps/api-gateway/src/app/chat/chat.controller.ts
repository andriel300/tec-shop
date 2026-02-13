import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Inject,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { ImageKitService } from '@tec-shop/shared/imagekit';
import type {
  CreateConversationDto,
  GetConversationsDto,
  ParticipantType,
} from '@tec-shop/dto';

const CHAT_IMAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const CHAT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

interface AuthenticatedRequest {
  user: {
    userId: string;
    username: string;
    role?: string;
    userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  };
}

interface ConversationResult {
  success: boolean;
  conversation?: {
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
  };
  error?: string;
}

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    @Inject('CHATTING_SERVICE') private readonly chattingService: ClientProxy,
    private readonly jwtService: JwtService,
    private readonly imagekitService: ImageKitService
  ) {}

  /**
   * Get a short-lived WebSocket token for real-time chat
   * This is needed because the app uses httpOnly cookies for auth
   */
  @Get('ws-token')
  @UseGuards(JwtAuthGuard)
  getWebSocketToken(@Req() req: AuthenticatedRequest) {
    const { userId, username, userType } = req.user;

    // Create a short-lived token (5 minutes) for WebSocket authentication
    const wsToken = this.jwtService.sign(
      {
        userId,
        username,
        userType: userType || 'CUSTOMER',
        purpose: 'websocket',
      },
      { expiresIn: '5m' }
    );

    return { token: wsToken, expiresIn: 300 };
  }

  /**
   * Create a new conversation or return existing one
   * Both CUSTOMER and SELLER can create conversations
   */
  @Post('conversations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER', 'SELLER')
  async createConversation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateConversationDto
  ) {
    const { userId, userType } = req.user;

    // Determine initiator type based on user role
    const initiatorType: ParticipantType =
      userType === 'SELLER' ? 'seller' : 'user';

    // Validate: users can only target sellers, sellers can only target users
    if (initiatorType === 'user' && dto.targetType !== 'seller') {
      throw new BadRequestException(
        'Users can only start conversations with sellers'
      );
    }
    if (initiatorType === 'seller' && dto.targetType !== 'user') {
      throw new BadRequestException(
        'Sellers can only start conversations with users'
      );
    }

    this.logger.log(
      `Creating conversation: ${initiatorType}(${userId}) -> ${dto.targetType}(${dto.targetId})`
    );

    const result = await firstValueFrom(
      this.chattingService.send<ConversationResult>(
        'chatting.createConversation',
        {
          initiatorId: userId,
          initiatorType,
          targetId: dto.targetId,
          targetType: dto.targetType,
          initialMessage: dto.initialMessage,
        }
      )
    );

    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to create conversation');
    }

    return result.conversation;
  }

  /**
   * Get list of conversations for the authenticated user
   */
  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  async getConversations(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetConversationsDto
  ) {
    const { userId, userType } = req.user;
    const participantType: ParticipantType =
      userType === 'SELLER' ? 'seller' : 'user';

    return firstValueFrom(
      this.chattingService.send('chatting.getConversations', {
        participantId: userId,
        participantType,
        page: query.page || 1,
        limit: query.limit || 20,
      })
    );
  }

  /**
   * Get a single conversation details
   */
  @Get('conversations/:id')
  @UseGuards(JwtAuthGuard)
  async getConversation(
    @Req() req: AuthenticatedRequest,
    @Param('id') conversationId: string
  ) {
    const { userId, userType } = req.user;
    const participantType: ParticipantType =
      userType === 'SELLER' ? 'seller' : 'user';

    const result = await firstValueFrom(
      this.chattingService.send('chatting.getConversation', {
        conversationId,
        participantId: userId,
        participantType,
      })
    );

    if (!result) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    return result;
  }

  /**
   * Get messages for a conversation with pagination
   */
  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  async getMessages(
    @Req() req: AuthenticatedRequest,
    @Param('id') conversationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const { userId, userType } = req.user;
    const participantType: ParticipantType =
      userType === 'SELLER' ? 'seller' : 'user';

    const result = await firstValueFrom(
      this.chattingService.send('chatting.getMessages', {
        conversationId,
        participantId: userId,
        participantType,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      })
    );

    if (result.error) {
      throw new NotFoundException(result.error);
    }

    return result;
  }

  /**
   * Mark a conversation as seen/read
   */
  @Post('conversations/:id/seen')
  @UseGuards(JwtAuthGuard)
  async markAsSeen(
    @Req() req: AuthenticatedRequest,
    @Param('id') conversationId: string
  ) {
    const { userId, userType } = req.user;
    const participantType: ParticipantType =
      userType === 'SELLER' ? 'seller' : 'user';

    const result = await firstValueFrom(
      this.chattingService.send('chatting.markAsSeen', {
        conversationId,
        participantId: userId,
        participantType,
      })
    );

    if (!result.success) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    return { status: 'seen' };
  }

  /**
   * Check if a user is online
   */
  @Get('online/:userId')
  @UseGuards(JwtAuthGuard)
  async checkOnline(@Param('userId') userId: string) {
    return firstValueFrom(
      this.chattingService.send('chatting.checkOnline', { userId })
    );
  }

  /**
   * Upload an image for chat attachment
   * Both CUSTOMER and SELLER can upload chat images
   */
  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER', 'SELLER')
  @UseInterceptors(FileInterceptor('image'))
  async uploadChatImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    if (!CHAT_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed'
      );
    }

    if (file.size > CHAT_IMAGE_SIZE_LIMIT) {
      throw new BadRequestException('File too large. Maximum size is 5MB');
    }

    const uploadResult = await this.imagekitService.uploadFile(
      file.buffer,
      file.originalname,
      'chat'
    );

    return {
      url: uploadResult.url,
      fileId: uploadResult.fileId,
      name: uploadResult.name,
      size: file.size,
    };
  }

  /**
   * Health check / ping endpoint
   */
  @Get('ping')
  async ping() {
    return firstValueFrom(this.chattingService.send('chatting.ping', {}));
  }
}
