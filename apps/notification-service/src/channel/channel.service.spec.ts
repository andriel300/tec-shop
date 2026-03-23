import { Test, TestingModule } from '@nestjs/testing';
import { ChannelService } from './channel.service';
import { NotificationEmailService } from '../email/email.service';
import { DeliveryTrackingService } from '../tracking/delivery-tracking.service';
import type { NotificationEventDto, NotificationResponseDto } from '@tec-shop/dto';

const makeDto = (overrides: Partial<NotificationEventDto> = {}): NotificationEventDto => ({
  targetType: 'customer',
  targetId: 'user-1',
  templateId: 'auth.otp',
  title: '',
  message: '',
  type: 'AUTH',
  metadata: { email: 'user@example.com', otp: '123456', expiresInMinutes: 10 },
  ...overrides,
});

const makeSaved = (id = 'notif-1'): NotificationResponseDto => ({
  id,
  targetType: 'customer',
  targetId: 'user-1',
  templateId: 'order.paid',
  title: 'Order Confirmed',
  message: 'Your order has been placed.',
  type: 'ORDER',
  isRead: false,
  createdAt: new Date().toISOString(),
});

describe('ChannelService', () => {
  let service: ChannelService;
  let emailService: NotificationEmailService;
  let tracking: DeliveryTrackingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelService,
        {
          provide: NotificationEmailService,
          useValue: {
            dispatch: jest.fn().mockResolvedValue('SENT'),
          },
        },
        {
          provide: DeliveryTrackingService,
          useValue: {
            record: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ChannelService>(ChannelService);
    emailService = module.get<NotificationEmailService>(NotificationEmailService);
    tracking = module.get<DeliveryTrackingService>(DeliveryTrackingService);
  });

  describe('onReceived() — email-only transactional events (no DB record)', () => {
    it('skips when channels is undefined (not email-only)', async () => {
      await service.onReceived(makeDto({ channels: undefined }));
      expect(emailService.dispatch).not.toHaveBeenCalled();
    });

    it('skips when channels is push-only', async () => {
      await service.onReceived(makeDto({ channels: ['push'] }));
      expect(emailService.dispatch).not.toHaveBeenCalled();
    });

    it('skips when channels contains both push and email (not strictly email-only)', async () => {
      await service.onReceived(makeDto({ channels: ['email', 'push'] }));
      expect(emailService.dispatch).not.toHaveBeenCalled();
    });

    it('skips when templateId is not in the allowed EMAIL_TEMPLATES set', async () => {
      await service.onReceived(makeDto({ channels: ['email'], templateId: 'system.broadcast' }));
      expect(emailService.dispatch).not.toHaveBeenCalled();
    });

    it('dispatches email for email-only + known auth template', async () => {
      const dto = makeDto({ channels: ['email'], templateId: 'auth.otp' });
      await service.onReceived(dto);
      expect(emailService.dispatch).toHaveBeenCalledWith(dto);
    });

    it('does NOT call tracking.record (no notificationId available for email-only events)', async () => {
      await service.onReceived(makeDto({ channels: ['email'], templateId: 'auth.otp' }));
      expect(tracking.record).not.toHaveBeenCalled();
    });

    it('swallows emailService errors without rethrowing', async () => {
      (emailService.dispatch as jest.Mock).mockRejectedValueOnce(new Error('SMTP timeout'));
      await expect(
        service.onReceived(makeDto({ channels: ['email'], templateId: 'auth.otp' }))
      ).resolves.not.toThrow();
    });

    it('skips dispatch when metadata.email is absent (handled inside dispatchEmail)', async () => {
      await service.onReceived(makeDto({ channels: ['email'], templateId: 'auth.otp', metadata: undefined }));
      expect(emailService.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('onSaved() — push+email events after DB notification save', () => {
    it('dispatches email when channels is undefined (defaults to all channels)', async () => {
      const dto = makeDto({ templateId: 'order.paid', type: 'ORDER', channels: undefined });
      await service.onSaved({ saved: makeSaved(), dto });
      expect(emailService.dispatch).toHaveBeenCalledWith(dto);
    });

    it('dispatches email when channels includes email', async () => {
      const dto = makeDto({ templateId: 'order.paid', type: 'ORDER', channels: ['email', 'push'] });
      await service.onSaved({ saved: makeSaved(), dto });
      expect(emailService.dispatch).toHaveBeenCalledWith(dto);
    });

    it('skips email when channels is push-only', async () => {
      const dto = makeDto({ templateId: 'order.paid', type: 'ORDER', channels: ['push'] });
      await service.onSaved({ saved: makeSaved(), dto });
      expect(emailService.dispatch).not.toHaveBeenCalled();
    });

    it('skips email when templateId is not in EMAIL_TEMPLATES', async () => {
      const dto = makeDto({ templateId: 'product.review_request', type: 'PRODUCT', channels: undefined });
      await service.onSaved({ saved: makeSaved(), dto });
      expect(emailService.dispatch).not.toHaveBeenCalled();
    });

    it('records EMAIL SENT tracking after successful dispatch', async () => {
      (emailService.dispatch as jest.Mock).mockResolvedValueOnce('SENT');
      const saved = makeSaved('notif-99');
      await service.onSaved({ saved, dto: makeDto({ templateId: 'order.paid', type: 'ORDER' }) });
      expect(tracking.record).toHaveBeenCalledWith('notif-99', 'EMAIL', 'SENT');
    });

    it('does NOT record tracking when dispatch returns SKIPPED', async () => {
      (emailService.dispatch as jest.Mock).mockResolvedValueOnce('SKIPPED');
      await service.onSaved({ saved: makeSaved(), dto: makeDto({ templateId: 'order.paid', type: 'ORDER' }) });
      expect(tracking.record).not.toHaveBeenCalled();
    });

    it('records EMAIL FAILED tracking when emailService throws', async () => {
      const error = new Error('SMTP connection refused');
      (emailService.dispatch as jest.Mock).mockRejectedValueOnce(error);
      const saved = makeSaved('notif-77');
      await service.onSaved({ saved, dto: makeDto({ templateId: 'order.paid', type: 'ORDER' }) });
      expect(tracking.record).toHaveBeenCalledWith('notif-77', 'EMAIL', 'FAILED', 'SMTP connection refused');
    });

    it('swallows emailService errors without rethrowing', async () => {
      (emailService.dispatch as jest.Mock).mockRejectedValueOnce(new Error('network error'));
      await expect(
        service.onSaved({ saved: makeSaved(), dto: makeDto({ templateId: 'order.paid', type: 'ORDER' }) })
      ).resolves.not.toThrow();
    });
  });
});
