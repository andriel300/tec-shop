import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import { readFileSync } from 'fs';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('USER_SERVICE_HOST'),
            port: configService.get<number>('USER_SERVICE_PORT'),
            tlsOptions: {
              key: readFileSync('./certs/client.key'),
              cert: readFileSync('./certs/client.crt'),
              ca: readFileSync('./certs/ca.crt'),
              rejectUnauthorized: true,
              requestCert: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [UserController],
  providers: [JwtAuthGuard],
})
export class UserModule {}
