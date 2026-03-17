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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { ImageKitService } from '@tec-shop/shared/imagekit';
import { ParticipantType } from '@tec-shop/dto';
import type {
  CreateConversationDto,
  GetConversationsDto,
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

@ApiTags('Chat')
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
  @Throttle({ short: { limit: 20, ttl: 60000 } }) // 20 token issuances per minute per IP
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get WebSocket authentication token',
    description:
      'Issues a short-lived (5-minute) JWT scoped to WebSocket use. ' +
      'Required because access tokens are stored in httpOnly cookies that ' +
      'cannot be read by client-side JavaScript for the Socket.IO handshake.',
  })
  @ApiResponse({ status: 200, description: 'Token issued', schema: { properties: { token: { type: 'string' }, expiresIn: { type: 'number', example: 300 } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create or retrieve a conversation',
    description:
      'Opens a conversation between a CUSTOMER and a SELLER. ' +
      'If a conversation between the two participants already exists, it is returned instead of creating a duplicate. ' +
      'CUSTOMER can only initiate with a SELLER, and vice versa.',
  })
  @ApiResponse({ status: 201, description: 'Conversation created or retrieved' })
  @ApiResponse({ status: 400, description: 'Invalid participant pairing' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Role not permitted (must be CUSTOMER or SELLER)' })
  async createConversation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateConversationDto
  ) {
    const { userId, userType } = req.user;
    const initiatorType = this.resolveInitiatorType(userType);
    this.validateConversationParticipants(initiatorType, dto.targetType);

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

  private validateChatImage(file: Express.Multer.File): void {
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
  }

  private resolveInitiatorType(userType?: string): ParticipantType {
    return userType === 'SELLER' ? ParticipantType.SELLER : ParticipantType.USER;
  }

  private validateConversationParticipants(
    initiatorType: ParticipantType,
    targetType: string
  ): void {
    if (initiatorType === ParticipantType.USER && targetType !== ParticipantType.SELLER) {
      throw new BadRequestException('Users can only start conversations with sellers');
    }
    if (initiatorType === ParticipantType.SELLER && targetType !== ParticipantType.USER) {
      throw new BadRequestException('Sellers can only start conversations with users');
    }
  }

  /**
   * Get list of conversations for the authenticated user
   */
  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List conversations', description: 'Returns all conversations for the authenticated user, ordered by most recent activity.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated conversation list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getConversations(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetConversationsDto
  ) {
    const { userId, userType } = req.user;
    const participantType: ParticipantType =
      userType === 'SELLER' ? ParticipantType.SELLER : ParticipantType.USER;

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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get conversation details', description: 'Returns a single conversation. Returns 404 if the conversation does not exist or the caller is not a participant.' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found or access denied' })
  async getConversation(
    @Req() req: AuthenticatedRequest,
    @Param('id') conversationId: string
  ) {
    const { userId, userType } = req.user;
    const participantType: ParticipantType =
      userType === 'SELLER' ? ParticipantType.SELLER : ParticipantType.USER;

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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get conversation messages', description: 'Returns paginated messages for a conversation. Caller must be a participant.' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated message list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found or access denied' })
  async getMessages(
    @Req() req: AuthenticatedRequest,
    @Param('id') conversationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const { userId, userType } = req.user;
    const participantType: ParticipantType =
      userType === 'SELLER' ? ParticipantType.SELLER : ParticipantType.USER;

    const result = await firstValueFrom(
      this.chattingService.send('chatting.getMessages', {
        conversationId,
        participantId: userId,
        participantType,
        page: page ?? 1,
        limit: limit ?? 20,
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark conversation as seen', description: 'Resets the unread count for the calling participant. Used to sync read state after the user opens a conversation.' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 201, description: 'Marked as seen', schema: { properties: { status: { type: 'string', example: 'seen' } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found or access denied' })
  async markAsSeen(
    @Req() req: AuthenticatedRequest,
    @Param('id') conversationId: string
  ) {
    const { userId, userType } = req.user;
    const participantType: ParticipantType =
      userType === 'SELLER' ? ParticipantType.SELLER : ParticipantType.USER;

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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check user online status', description: 'Returns whether the given user currently has an active Socket.IO connection to the chatting service.' })
  @ApiParam({ name: 'userId', description: 'ID of the user to check' })
  @ApiResponse({ status: 200, description: 'Online status', schema: { properties: { online: { type: 'boolean' }, lastSeen: { type: 'string', format: 'date-time', nullable: true } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 uploads per minute per IP
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: CHAT_IMAGE_SIZE_LIMIT } }))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload chat image', description: 'Uploads an image to ImageKit CDN and returns the URL. Accepted formats: JPEG, PNG, GIF, WebP. Maximum size: 5 MB. Rate-limited to 10 uploads per minute.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } }, required: ['image'] } })
  @ApiResponse({ status: 201, description: 'Image uploaded', schema: { properties: { url: { type: 'string' }, fileId: { type: 'string' }, name: { type: 'string' }, size: { type: 'number' } } } })
  @ApiResponse({ status: 400, description: 'Invalid file type or size exceeded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Role not permitted' })
  async uploadChatImage(@UploadedFile() file: Express.Multer.File) {
    this.validateChatImage(file);

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
  @ApiOperation({ summary: 'Ping chatting service', description: 'Liveness probe — verifies the chatting-service TCP microservice is reachable from the gateway.' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async ping() {
    return firstValueFrom(this.chattingService.send('chatting.ping', {}));
  }
}
