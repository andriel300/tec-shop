import { Injectable, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChattingPrismaService } from '../prisma/prisma.service';
import { GetMessagesDto } from '@tec-shop/dto';

@Injectable()
export class ChattingService {
  private readonly logger = new Logger(ChattingService.name);

  constructor(private readonly prisma: ChattingPrismaService) {}

  @MessagePattern('chatting.ping')
  handlePing(): string {
    this.logger.debug('Received ping');
    return 'pong';
  }

  @MessagePattern('chatting.sendMessage')
  handleSendMessage(@Payload() data: unknown) {
    this.logger.debug('Received sendMessage event', data);
    // TODO: implement sending logic
    return { status: 'ok' };
  }

  async handleGetMessages(@Payload() dto: GetMessagesDto) {
    this.logger.debug('Received getMessages query', dto);
    const { conversationId, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' }, // Get newest messages first
      skip,
      take: limit,
    });

    const total = await this.prisma.chatMessage.count({
      where: { conversationId },
    });

    return { messages, total, page, limit };
  }
}
