import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationCoreService } from './notification-core.service';
import { NotificationEventConsumer } from './notification-event.consumer';
import { NotificationGateway } from './notification.gateway';
import { NotificationTcpController } from './notification.controller';
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
  controllers: [NotificationTcpController],
  providers: [
    NotificationCoreService,
    NotificationEventConsumer,
    NotificationGateway,
  ],
  exports: [NotificationCoreService, NotificationGateway],
})
export class NotificationModule {}
