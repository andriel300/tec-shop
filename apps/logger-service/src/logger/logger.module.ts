import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerCoreService } from './logger-core.service';
import { LogEventConsumer } from './log-event.consumer';
import { LoggerGateway } from './logger.gateway';
import { LoggerTcpController } from './logger.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WsJwtModule } from '@tec-shop/ws-auth';

@Module({
  imports: [
    ConfigModule,
    WsJwtModule.register(),
    KafkaModule,
    RedisModule,
    PrismaModule,
  ],
  controllers: [LoggerTcpController],
  providers: [LoggerCoreService, LogEventConsumer, LoggerGateway],
  exports: [LoggerCoreService, LoggerGateway],
})
export class LoggerCoreModule {}
