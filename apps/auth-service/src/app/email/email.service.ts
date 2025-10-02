import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';

  constructor(private readonly mailerService: MailerService) {}

  async sendOtp(to: string, otp: string): Promise<void> {
    // Log OTP in development for easy testing
    if (this.isDevelopment) {
      this.logger.log(`
       OTP CODE FOR TESTING
  Email: ${to.padEnd(28)}
  Code:  ${otp.padEnd(28)}
      `);
    }

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

  async sendPasswordResetCode(to: string, resetCode: string): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Tec-Shop Password Reset Code',
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password for Tec-Shop.</p>
          <p>Your password reset code is:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 20px; padding: 15px; background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; color: #007bff;">
            ${resetCode}
          </p>
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>Enter this code on the password reset page to continue.</p>
          <p style="color: #666; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetLink(to: string, resetLink: string): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Tec-Shop Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #007bff; margin: 0; font-size: 28px;">TecShop</h1>
            </div>

            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              You have requested to reset your password for your TecShop account.
              Click the button below to create a new password.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}"
                 style="background-color: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                Reset Your Password
              </a>
            </div>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>🔒 Security Notice:</strong> This link will expire in 1 hour for your security.
              </p>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.5; margin-top: 20px;">
              If you didn't request this password reset, you can safely ignore this email.
              Your password will remain unchanged.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all;">${resetLink}</span>
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendPasswordChangedNotification(to: string): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Your Tec-Shop Password Has Been Changed',
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>Password Changed Successfully</h2>
          <p>This is to inform you that your Tec-Shop account password has been successfully changed.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
        </div>
      `,
    });
  }
}
