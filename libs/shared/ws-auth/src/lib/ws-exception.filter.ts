import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

@Catch(WsException, Error)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  override catch(exception: WsException | Error, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    const raw =
      exception instanceof WsException ? exception.getError() : exception.message;
    const message = typeof raw === 'string' ? raw : JSON.stringify(raw);

    this.logger.error(`WebSocket exception: ${message}`);
    client.emit('exception', { message });
  }
}
