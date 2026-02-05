import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LoggerCoreService } from './logger-core.service';
import { LogEventConsumer } from './log-event.consumer';
import { LoggerGateway } from './logger.gateway';
import { LoggerTcpController } from './logger.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
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
    KafkaModule,
    RedisModule,
    PrismaModule,
  ],
  controllers: [LoggerTcpController],
  providers: [LoggerCoreService, LogEventConsumer, LoggerGateway],
  exports: [LoggerCoreService, LoggerGateway],
})
export class LoggerCoreModule {}
