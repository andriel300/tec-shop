import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationCoreService } from './notification-core.service';
import { NotificationEventConsumer } from './notification-event.consumer';
import { NotificationGateway } from './notification.gateway';
import { NotificationTcpController } from './notification.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WsJwtModule } from '@tec-shop/ws-auth';
import { ChannelModule } from '../channel/channel.module';

@Module({
  imports: [
    ConfigModule,
    WsJwtModule.register(),
    KafkaModule,
    RedisModule,
    PrismaModule,
    ChannelModule,
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
