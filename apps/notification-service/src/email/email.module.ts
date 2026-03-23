import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { NotificationEmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('SMTP_HOST'),
          port: parseInt(config.get<string>('SMTP_PORT', '587'), 10),
          secure: config.get<string>('SMTP_SECURE') === 'true',
          auth: {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASS'),
          },
          requireTLS: config.get<string>('SMTP_REQUIRE_TLS') === 'true',
        },
        defaults: {
          from: `"TecShop" <${config.get<string>('SMTP_FROM')}>`,
        },
      }),
    }),
  ],
  providers: [NotificationEmailService],
  exports: [NotificationEmailService],
})
export class EmailModule {}
