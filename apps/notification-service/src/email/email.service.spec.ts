import { Test, TestingModule } from '@nestjs/testing';
import { NotificationEmailService } from './email.service';
import { MailerService } from '@nestjs-modules/mailer';
import type { NotificationEventDto } from '@tec-shop/dto';

const makeDto = (overrides: Partial<NotificationEventDto> = {}): NotificationEventDto => ({
  targetType: 'customer',
  targetId: 'user-1',
  templateId: 'auth.otp',
  title: '',
  message: '',
  type: 'AUTH',
  metadata: { email: 'user@example.com', otp: '123456', expiresInMinutes: 10 },
  channels: ['email'],
  ...overrides,
});

describe('NotificationEmailService', () => {
  let service: NotificationEmailService;
  let mailer: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationEmailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationEmailService>(NotificationEmailService);
    mailer = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dispatch()', () => {
    describe('guard clauses', () => {
      it('returns SKIPPED and never calls mailer when metadata.email is absent', async () => {
        const result = await service.dispatch(makeDto({ metadata: undefined }));
        expect(result).toBe('SKIPPED');
        expect(mailer.sendMail).not.toHaveBeenCalled();
      });

      it('returns SKIPPED for an unknown templateId', async () => {
        const result = await service.dispatch(
          makeDto({ templateId: 'system.internal_broadcast', metadata: { email: 'user@example.com' } })
        );
        expect(result).toBe('SKIPPED');
        expect(mailer.sendMail).not.toHaveBeenCalled();
      });
    });

    describe('auth.otp', () => {
      it('returns SENT and calls mailer once', async () => {
        const result = await service.dispatch(makeDto());
        expect(result).toBe('SENT');
        expect(mailer.sendMail).toHaveBeenCalledTimes(1);
      });

      it('sends to the correct recipient', async () => {
        await service.dispatch(makeDto({ metadata: { email: 'alice@example.com', otp: '111222', expiresInMinutes: 10 } }));
        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({ to: 'alice@example.com' })
        );
      });

      it('includes the OTP code in the email body', async () => {
        await service.dispatch(makeDto({ metadata: { email: 'alice@example.com', otp: '999888', expiresInMinutes: 5 } }));
        const { html } = (mailer.sendMail as jest.Mock).mock.calls[0][0];
        expect(html).toContain('999888');
        expect(html).toContain('5');
      });
    });

    describe('auth.password_reset', () => {
      it('returns SENT', async () => {
        const result = await service.dispatch(
          makeDto({ templateId: 'auth.password_reset', metadata: { email: 'user@example.com', resetLink: 'https://app/reset?token=abc' } })
        );
        expect(result).toBe('SENT');
      });

      it('includes the reset link in the email body', async () => {
        const resetLink = 'https://app.example.com/reset-password?token=tok-xyz';
        await service.dispatch(
          makeDto({ templateId: 'auth.password_reset', metadata: { email: 'user@example.com', resetLink } })
        );
        const { html } = (mailer.sendMail as jest.Mock).mock.calls[0][0];
        expect(html).toContain(resetLink);
      });
    });

    describe('auth.password_changed', () => {
      it('returns SENT and sends to correct address', async () => {
        const result = await service.dispatch(
          makeDto({ templateId: 'auth.password_changed', metadata: { email: 'bob@example.com' } })
        );
        expect(result).toBe('SENT');
        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({ to: 'bob@example.com' })
        );
      });
    });

    describe('auth.account_upgrade', () => {
      it('returns SENT', async () => {
        const result = await service.dispatch(
          makeDto({ templateId: 'auth.account_upgrade', metadata: { email: 'seller@example.com' } })
        );
        expect(result).toBe('SENT');
        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({ to: 'seller@example.com' })
        );
      });
    });

    describe('auth.google_linked', () => {
      it('returns SENT', async () => {
        const result = await service.dispatch(
          makeDto({ templateId: 'auth.google_linked', metadata: { email: 'user@example.com' } })
        );
        expect(result).toBe('SENT');
        expect(mailer.sendMail).toHaveBeenCalledTimes(1);
      });
    });

    describe('order templates', () => {
      const baseOrderMeta = {
        email: 'customer@example.com',
        orderNumber: 'ORD-2026-001',
        orderDate: '2026-03-23',
        customerName: 'John Doe',
        items: [
          { productName: 'Widget Pro', quantity: 2, unitPrice: 1500, subtotal: 3000 },
        ],
        subtotalAmount: 3000,
        discountAmount: 0,
        shippingCost: 500,
        finalAmount: 3500,
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
          country: 'US',
        },
      };

      it('order.paid — sends buyer confirmation with order number in subject', async () => {
        const result = await service.dispatch(
          makeDto({ templateId: 'order.paid', type: 'ORDER', metadata: baseOrderMeta })
        );
        expect(result).toBe('SENT');
        const { subject } = (mailer.sendMail as jest.Mock).mock.calls[0][0];
        expect(subject).toContain('ORD-2026-001');
      });

      it('order.paid — includes customer name in body', async () => {
        await service.dispatch(
          makeDto({ templateId: 'order.paid', type: 'ORDER', metadata: baseOrderMeta })
        );
        const { html } = (mailer.sendMail as jest.Mock).mock.calls[0][0];
        expect(html).toContain('John Doe');
      });

      it('order.placed_seller — sends to seller email', async () => {
        const result = await service.dispatch(
          makeDto({
            targetType: 'seller',
            templateId: 'order.placed_seller',
            type: 'ORDER',
            metadata: {
              ...baseOrderMeta,
              email: 'seller@example.com',
              sellerName: 'Alice Shop',
              totalPayout: 3000,
              platformFee: 300,
              netPayout: 2700,
            },
          })
        );
        expect(result).toBe('SENT');
        expect(mailer.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({ to: 'seller@example.com' })
        );
      });

      it('order.shipped — includes tracking number in body', async () => {
        await service.dispatch(
          makeDto({
            templateId: 'order.shipped',
            type: 'ORDER',
            metadata: { ...baseOrderMeta, trackingNumber: 'TRK-ABC-999', carrier: 'FedEx' },
          })
        );
        const { html } = (mailer.sendMail as jest.Mock).mock.calls[0][0];
        expect(html).toContain('TRK-ABC-999');
      });

      it('order.delivered — returns SENT', async () => {
        const result = await service.dispatch(
          makeDto({ templateId: 'order.delivered', type: 'ORDER', metadata: baseOrderMeta })
        );
        expect(result).toBe('SENT');
        expect(mailer.sendMail).toHaveBeenCalledTimes(1);
      });
    });
  });
});
