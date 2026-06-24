import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

interface AuthUser {
  userId: string;
  userType: string;
  username: string;
  role: string;
}

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('conversations')
  async createConversation(
    @Req() req: Request,
    @Body() body: { targetId: string; targetType: 'customer' | 'seller'; initialMessage?: string },
  ) {
    const user = req.user as AuthUser;
    const userType = user.userType === 'SELLER' ? 'seller' : 'customer';
    return this.chatService.createConversation({
      initiatorId: user.userId,
      initiatorType: userType,
      targetId: body.targetId,
      targetType: body.targetType,
      initialMessage: body.initialMessage,
    });
  }

  @Get('conversations')
  async getConversations(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as AuthUser;
    const userType = user.userType === 'SELLER' ? 'seller' : 'customer';
    return this.chatService.getConversations({
      participantId: user.userId,
      participantType: userType,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('conversations/:id')
  async getConversation(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as AuthUser;
    const userType = user.userType === 'SELLER' ? 'seller' : 'customer';
    return this.chatService.getConversation(id, user.userId, userType);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as AuthUser;
    const userType = user.userType === 'SELLER' ? 'seller' : 'customer';
    return this.chatService.getMessages({
      conversationId: id,
      participantId: user.userId,
      participantType: userType,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Post('conversations/:id/seen')
  async markAsSeen(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as AuthUser;
    const userType = user.userType === 'SELLER' ? 'seller' : 'customer';
    return this.chatService.markAsSeen(id, user.userId, userType);
  }

  @Get('ws-token')
  getWsToken(@Req() req: Request) {
    const user = req.user as AuthUser;
    // Generate a short-lived JWT for WebSocket authentication
    const token = this.jwtService.sign({
      sub: user.userId,
      username: user.username,
      role: user.role,
      userType: user.userType,
    }, { expiresIn: '1h' });
    return { token, expiresIn: 3600 };
  }
}
