import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('sendOtp', () => {
    it('calls sendMail with the OTP embedded in html', async () => {
      await service.sendOtp('test@example.com', '123456');

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Your Tec-Shop One-Time Password',
        html: expect.stringContaining('123456'),
      });
    });

    it('propagates errors when the mailer fails', async () => {
      jest.spyOn(mailerService, 'sendMail').mockRejectedValue(new Error('SMTP unavailable'));

      await expect(service.sendOtp('test@example.com', '123456')).rejects.toThrow('SMTP unavailable');
    });
  });

  describe('sendPasswordResetLink', () => {
    it('calls sendMail with the reset link embedded in html', async () => {
      const resetLink = 'http://localhost:3000/reset-password?token=abc';
      await service.sendPasswordResetLink('test@example.com', resetLink);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Tec-Shop Password Reset Request',
        html: expect.stringContaining(resetLink),
      });
    });

    it('propagates errors when the mailer fails', async () => {
      jest.spyOn(mailerService, 'sendMail').mockRejectedValue(new Error('SMTP unavailable'));

      await expect(
        service.sendPasswordResetLink('test@example.com', 'http://reset')
      ).rejects.toThrow('SMTP unavailable');
    });
  });

  describe('sendPasswordChangedNotification', () => {
    it('calls sendMail with a confirmation message in html', async () => {
      await service.sendPasswordChangedNotification('test@example.com');

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Your Tec-Shop Password Has Been Changed',
        html: expect.stringContaining('password has been successfully changed'),
      });
    });

    it('propagates errors when the mailer fails', async () => {
      jest.spyOn(mailerService, 'sendMail').mockRejectedValue(new Error('SMTP unavailable'));

      await expect(
        service.sendPasswordChangedNotification('test@example.com')
      ).rejects.toThrow('SMTP unavailable');
    });
  });
});
