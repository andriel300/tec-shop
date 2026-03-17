import { IoAdapter } from '@nestjs/platform-socket.io';
import { createWsGatewayCors } from './ws-cors.factory';

export class WsIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: Record<string, unknown>) {
    return super.createIOServer(port, {
      ...options,
      cors: createWsGatewayCors(),
    });
  }
}
