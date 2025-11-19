import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('logs')
export class LoggerController {
  constructor(
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: ClientProxy
  ) {}

  @Post()
  async createLog(
    @Body()
    data: {
      level: 'debug' | 'info' | 'warn' | 'error';
      message: string;
      context?: string;
    }
  ) {
    return firstValueFrom(this.loggerService.send('logger-write', data));
  }
}
