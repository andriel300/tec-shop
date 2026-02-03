import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChattingService } from './chatting.service';
import type {
  CreateConversationInternalDto,
  GetConversationsInternalDto,
  GetConversationDto,
  MarkConversationSeenDto,
  GetMessagesInternalDto,
  CheckOnlineDto,
} from '@tec-shop/dto';

@Controller()
export class ChattingController {
  constructor(private readonly service: ChattingService) {}

  @MessagePattern('chatting.ping')
  handlePing() {
    return 'pong';
  }

  @MessagePattern('chatting.createConversation')
  handleCreateConversation(@Payload() dto: CreateConversationInternalDto) {
    return this.service.createConversation(dto);
  }

  @MessagePattern('chatting.getConversations')
  handleGetConversations(@Payload() dto: GetConversationsInternalDto) {
    return this.service.getConversations(dto);
  }

  @MessagePattern('chatting.getConversation')
  handleGetConversation(@Payload() dto: GetConversationDto) {
    return this.service.getConversation(dto);
  }

  @MessagePattern('chatting.getMessages')
  handleGetMessages(@Payload() dto: GetMessagesInternalDto) {
    return this.service.getMessages(dto);
  }

  @MessagePattern('chatting.markAsSeen')
  handleMarkAsSeen(@Payload() dto: MarkConversationSeenDto) {
    return this.service.markConversationSeen(dto);
  }

  @MessagePattern('chatting.checkOnline')
  handleCheckOnline(@Payload() dto: CheckOnlineDto) {
    return this.service.checkOnline(dto.userId);
  }
}
