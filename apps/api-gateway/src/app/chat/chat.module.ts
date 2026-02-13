import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
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
          const apiGatewayCertPath = join(
            certsPath,
            'api-gateway/api-gateway-cert.pem'
          );
          const apiGatewayKeyPath = join(
            certsPath,
            'api-gateway/api-gateway-key.pem'
          );
          const caPath = join(certsPath, 'ca/ca-cert.pem');

          // Check if certificates exist - mTLS is optional
          const useTls =
            existsSync(apiGatewayCertPath) &&
            existsSync(apiGatewayKeyPath) &&
            existsSync(caPath);

          const options: {
            host: string;
            port: number;
            tlsOptions?: {
              key: Buffer;
              cert: Buffer;
              ca: Buffer;
              rejectUnauthorized: boolean;
            };
          } = {
            host: process.env['CHATTING_SERVICE_HOST'] || 'localhost',
            // Use TCP port for microservice communication (not HTTP/WebSocket port)
            port: parseInt(process.env['CHATTING_SERVICE_TCP_PORT'] || '6010', 10),
          };

          if (useTls) {
            options.tlsOptions = {
              key: readFileSync(apiGatewayKeyPath),
              cert: readFileSync(apiGatewayCertPath),
              ca: readFileSync(caPath),
              rejectUnauthorized: true,
            };
          }

          return {
            transport: Transport.TCP,
            options,
          };
        },
      },
    ]),
  ],
  controllers: [ChatController],
})
export class ChatModule {}
