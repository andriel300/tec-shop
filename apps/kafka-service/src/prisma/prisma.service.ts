import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@tec-shop/analytics-client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.ANALYTICS_SERVICE_DB_URL,
        },
      },
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    // Log database events
    this.$on('warn' as never, (e: Record<string, unknown>) => {
      this.logger.warn(e);
    });

    this.$on('error' as never, (e: Record<string, unknown>) => {
      this.logger.error(e);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to Analytics MongoDB database');
    } catch (error) {
      this.logger.error('Failed to connect to Analytics database', error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from Analytics database');
    } catch (error) {
      this.logger.error('Error disconnecting from Analytics database', error instanceof Error ? error.stack : undefined);
    }
  }
}
