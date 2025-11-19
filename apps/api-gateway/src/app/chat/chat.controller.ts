import { Controller, Get, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('chatting')
export class ChattingController {
  constructor(
    @Inject('CHATTING_SERVICE') private readonly chattingService: ClientProxy
  ) {}

  @Get()
  async getChats() {
    return firstValueFrom(this.chattingService.send('chatting-get-all', {}));
  }

  @Post()
  async sendMessage(@Body() data: { sender: string; message: string }) {
    return firstValueFrom(this.chattingService.send('chatting-send', data));
  }
}
