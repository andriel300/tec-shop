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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtp', () => {
    it('should call mailerService.sendMail with correct parameters', async () => {
      const to = 'test@example.com';
      const otp = '123456';

      await service.sendOtp(to, otp);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject: 'Your Tec-Shop One-Time Password',
        html: expect.stringContaining(otp),
      });
    });
  });

  describe('sendPasswordResetLink', () => {
    it('should call mailerService.sendMail with correct parameters', async () => {
      const to = 'test@example.com';
      const resetLink = 'http://localhost:4200/reset-password?token=abc';

      await service.sendPasswordResetLink(to, resetLink);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject: 'Tec-Shop Password Reset Request',
        html: expect.stringContaining(resetLink),
      });
    });
  });

  describe('sendPasswordChangedNotification', () => {
    it('should call mailerService.sendMail with correct parameters', async () => {
      const to = 'test@example.com';

      await service.sendPasswordChangedNotification(to);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject: 'Your Tec-Shop Password Has Been Changed',
        html: expect.stringContaining('password has been successfully changed'),
      });
    });
  });
});
