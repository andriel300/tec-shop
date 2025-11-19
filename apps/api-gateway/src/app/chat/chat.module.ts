import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ChattingController } from './chat.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CHATTING_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.CHATTING_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.CHATTING_SERVICE_PORT || '6007', 10),
          tlsOptions: {
            key: readFileSync(
              join(process.cwd(), 'certs/api-gateway/api-gateway-key.pem')
            ),
            cert: readFileSync(
              join(process.cwd(), 'certs/api-gateway/api-gateway-cert.pem')
            ),
            ca: readFileSync(join(process.cwd(), 'certs/ca/ca-cert.pem')),
            rejectUnauthorized: true,
          },
        },
      },
    ]),
  ],
  controllers: [ChattingController],
})
export class ChattingModule {}
