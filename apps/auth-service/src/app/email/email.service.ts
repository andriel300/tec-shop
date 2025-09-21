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

  // Legacy method - keeping for backward compatibility during migration
  async sendPasswordResetLink(to: string, resetLink: string): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Tec-Shop Password Reset Request',
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password for Tec-Shop.</p>
          <p>Please click the link below to reset your password:</p>
          <p style="margin: 20px;">
            <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </p>
          <p>If you did not request a password reset, please ignore this email.</p>
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
