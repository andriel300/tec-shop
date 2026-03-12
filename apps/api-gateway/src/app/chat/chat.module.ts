import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ImageKitModule } from '@tec-shop/shared/imagekit';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    ImageKitModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret || secret.length < 32) {
          throw new Error(
            'JWT_SECRET must be configured and at least 32 characters'
          );
        }
        return {
          secret,
          signOptions: { expiresIn: '24h' },
        };
      },
    }),
    ClientsModule.registerAsync([
      {
        name: 'CHATTING_SERVICE',
        useFactory: () => {
          const certsPath = join(process.cwd(), 'certs');
          let tlsOptions: { key: Buffer; cert: Buffer; ca: Buffer; rejectUnauthorized: boolean };
          try {
            tlsOptions = {
              key: readFileSync(join(certsPath, 'api-gateway/api-gateway-key.pem')),
              cert: readFileSync(join(certsPath, 'api-gateway/api-gateway-cert.pem')),
              ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
              rejectUnauthorized: true,
            };
          } catch (error) {
            throw new Error(
              `[mTLS] Failed to load API Gateway certificates for CHATTING_SERVICE: ${error instanceof Error ? error.message : String(error)}. Run ./generate-certs.sh --all`,
            );
          }
          return {
            transport: Transport.TCP,
            options: {
              host: process.env['CHATTING_SERVICE_HOST'] || 'localhost',
              port: parseInt(process.env['CHATTING_SERVICE_TCP_PORT'] || '6010', 10),
              tlsOptions,
            },
          };
        },
      },
    ]),
  ],
  controllers: [ChatController],
})
export class ChatModule {}
