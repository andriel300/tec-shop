import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../strategies/jwt.strategy';
import { readFileSync } from 'fs';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AUTH_SERVICE_HOST'),
            port: configService.get<number>('AUTH_SERVICE_PORT'),
            tlsOptions: {
              key: readFileSync('./certs/client.key'),
              cert: readFileSync('./certs/client.crt'),
              ca: readFileSync('./certs/ca.crt'),
              rejectUnauthorized: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy],
  exports: [ClientsModule, PassportModule, JwtStrategy],
})
export class AuthModule {}
