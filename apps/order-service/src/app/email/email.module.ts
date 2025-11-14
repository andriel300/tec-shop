import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('SMTP_HOST');
        const port = parseInt(
          configService.get<string>('SMTP_PORT', '587'),
          10
        );
        return {
          transport: {
            host: host,
            port: port,
            secure: configService.get<string>('SMTP_SECURE') === 'true',
            auth: {
              user: configService.get<string>('SMTP_USER'),
              pass: configService.get<string>('SMTP_PASS'),
            },
          },
          defaults: {
            from: `"TecShop" <${configService.get<string>('SMTP_FROM')}>`,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
