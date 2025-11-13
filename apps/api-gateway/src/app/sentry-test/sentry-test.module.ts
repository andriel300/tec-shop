import { Module } from '@nestjs/common';
import { SentryTestController } from './sentry-test.controller';

@Module({
  controllers: [SentryTestController],
})
export class SentryTestModule {}
