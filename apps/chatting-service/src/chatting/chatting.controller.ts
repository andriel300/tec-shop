import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChattingService } from './chatting.service';
import { GetMessagesDto } from '@tec-shop/dto';

@Controller()
export class ChattingController {
  constructor(private readonly service: ChattingService) {}

  @MessagePattern('chatting.sendMessage')
  handleSend(@Payload() data: unknown) {
    return this.service.handleSendMessage(data);
  }

  @MessagePattern('chatting.getMessages')
  handleGetMessages(@Payload() data: GetMessagesDto) {
    return this.service.handleGetMessages(data);
  }
}
