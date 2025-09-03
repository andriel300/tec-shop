import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOtp(to: string, otp: string): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Your Tec-Shop One-Time Password',
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>Welcome to Tec-Shop!</h2>
          <p>Your one-time password (OTP) is:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
            ${otp}
          </p>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    });
  }
}
