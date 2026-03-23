import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { NotificationEventDto, NotificationResponseDto } from '@tec-shop/dto';
import { NotificationEmailService } from '../email/email.service';
import { DeliveryTrackingService } from '../tracking/delivery-tracking.service';

/** templateIds that can trigger transactional emails */
const EMAIL_TEMPLATES = new Set([
  // Auth
  'auth.otp',
  'auth.password_reset',
  'auth.password_changed',
  'auth.account_upgrade',
  'auth.google_linked',
  // Order
  'order.paid',
  'order.placed_seller',
  'order.shipped',
  'order.delivered',
]);

export interface NotificationSavedEvent {
  saved: NotificationResponseDto;
  dto: NotificationEventDto;
}

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);

  constructor(
    private readonly emailService: NotificationEmailService,
    private readonly tracking: DeliveryTrackingService,
  ) {}

  /**
   * Handles email-only events (channels: ['email']).
   * These are purely transactional (OTP, auth) — no DB notification record.
   */
  @OnEvent('notification.received', { async: true })
  async onReceived(dto: NotificationEventDto): Promise<void> {
    const isEmailOnly = dto.channels?.length === 1 && dto.channels[0] === 'email';
    if (!isEmailOnly) return;

    if (!EMAIL_TEMPLATES.has(dto.templateId)) return;

    await this.dispatchEmail(dto, null);
  }

  /**
   * Handles email dispatch for push+email events after the notification
   * has been saved to DB (so we can link the delivery log to the notification).
   */
  @OnEvent('notification.saved', { async: true })
  async onSaved({ saved, dto }: NotificationSavedEvent): Promise<void> {
    const shouldEmail = !dto.channels || dto.channels.includes('email');
    if (!shouldEmail) return;

    if (!EMAIL_TEMPLATES.has(dto.templateId)) return;

    await this.dispatchEmail(dto, saved.id);
  }

  private async dispatchEmail(dto: NotificationEventDto, notificationId: string | null): Promise<void> {
    const hasEmail = !!(dto.metadata as Record<string, unknown> | undefined)?.email;
    if (!hasEmail) return;

    try {
      const result = await this.emailService.dispatch(dto);

      if (notificationId && result === 'SENT') {
        await this.tracking.record(notificationId, 'EMAIL', 'SENT');
      } else if (notificationId && result === 'SKIPPED') {
        this.logger.verbose(`Email skipped for templateId=${dto.templateId}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Email dispatch failed for ${dto.templateId}: ${errMsg}`);

      if (notificationId) {
        await this.tracking.record(notificationId, 'EMAIL', 'FAILED', errMsg);
      }
    }
  }
}
