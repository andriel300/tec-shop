import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import type { NotificationEventDto } from '@tec-shop/dto';

@Injectable()
export class NotificationEmailService {
  private readonly logger = new Logger(NotificationEmailService.name);
  private readonly isDev = process.env.NODE_ENV !== 'production';

  constructor(private readonly mailer: MailerService) {}

  // ─── Dispatcher ──────────────────────────────────────────────────────────────

  async dispatch(dto: NotificationEventDto): Promise<'SENT' | 'SKIPPED'> {
    const m = (dto.metadata ?? {}) as Record<string, unknown>;
    const email = m.email as string | undefined;
    if (!email) return 'SKIPPED';

    switch (dto.templateId) {
      // Auth
      case 'auth.otp':
        await this.sendOtp(email, m.otp as string, Number(m.expiresInMinutes ?? 10));
        break;
      case 'auth.password_reset':
        await this.sendPasswordReset(email, m.resetLink as string);
        break;
      case 'auth.password_changed':
        await this.sendPasswordChanged(email);
        break;
      case 'auth.account_upgrade':
        await this.sendAccountUpgrade(email);
        break;
      case 'auth.google_linked':
        await this.sendGoogleLinked(email);
        break;
      // Order
      case 'order.paid':
        await this.sendOrderConfirmation(email, m);
        break;
      case 'order.placed_seller':
        await this.sendSellerNewOrder(email, m);
        break;
      case 'order.shipped':
        await this.sendOrderShipped(email, m);
        break;
      case 'order.delivered':
        await this.sendOrderDelivered(email, m);
        break;
      default:
        return 'SKIPPED';
    }

    return 'SENT';
  }

  // ─── Auth emails ─────────────────────────────────────────────────────────────

  async sendOtp(to: string, otp: string, expiresInMinutes: number): Promise<void> {
    if (this.isDev) {
      this.logger.log(`\n  OTP CODE FOR TESTING\n  Email: ${to}\n  Code:  ${otp}\n`);
    }
    await this.mailer.sendMail({
      to,
      subject: 'Your TecShop Verification Code',
      html: `
        <div style="font-family:sans-serif;text-align:center;padding:20px;">
          <h2>Verify your email</h2>
          <p>Your one-time verification code is:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:4px;margin:20px;padding:14px;background:#f0f0f0;border-radius:8px;">${otp}</p>
          <p>This code expires in <strong>${expiresInMinutes} minutes</strong>.</p>
          <p style="color:#999;font-size:12px;">If you didn't request this, ignore this email.</p>
        </div>`,
    });
  }

  async sendPasswordReset(to: string, resetLink: string): Promise<void> {
    await this.mailer.sendMail({
      to,
      subject: 'Reset your TecShop password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
          <div style="background:#fff;padding:30px;border-radius:8px;">
            <h1 style="color:#007bff;text-align:center;">TecShop</h1>
            <h2>Password Reset Request</h2>
            <p>Click the button below to create a new password. This link expires in <strong>1 hour</strong>.</p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${resetLink}" style="background:#007bff;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a>
            </div>
            <p style="color:#666;font-size:13px;">If you didn't request this, ignore this email — your password won't change.</p>
            <p style="color:#999;font-size:11px;word-break:break-all;">Or paste this link: ${resetLink}</p>
          </div>
        </div>`,
    });
  }

  async sendPasswordChanged(to: string): Promise<void> {
    await this.mailer.sendMail({
      to,
      subject: 'Your TecShop password was changed',
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2>Password Changed</h2>
          <p>Your TecShop account password was successfully changed.</p>
          <p style="color:#d9534f;">If you didn't make this change, contact support immediately.</p>
        </div>`,
    });
  }

  async sendAccountUpgrade(to: string): Promise<void> {
    await this.mailer.sendMail({
      to,
      subject: 'Your TecShop account has been upgraded to Seller',
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2>Account Upgraded to Seller</h2>
          <p>Your TecShop account has been successfully upgraded to a Seller account.</p>
          <p style="color:#d9534f;">If you did not initiate this, contact support immediately.</p>
        </div>`,
    });
  }

  async sendGoogleLinked(to: string): Promise<void> {
    await this.mailer.sendMail({
      to,
      subject: 'Google account linked to TecShop',
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2>Google Account Linked</h2>
          <p>Your TecShop account has been linked to a Google account.</p>
          <p style="color:#d9534f;">If you did not initiate this, contact support immediately.</p>
        </div>`,
    });
  }

    // ─── Order emails ─────────────────────────────────────────────────────────────

  private isOrderItem(item: unknown): item is { productName: string; quantity: number; unitPrice: number; subtotal: number } {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).productName === 'string' &&
      typeof (item as Record<string, unknown>).quantity === 'number' &&
      typeof (item as Record<string, unknown>).unitPrice === 'number' &&
      typeof (item as Record<string, unknown>).subtotal === 'number'
    );
  }

  private async sendOrderConfirmation(email: string, m: Record<string, unknown>): Promise<void> {
    const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    const rawItems = Array.isArray(m.items) ? m.items : [];
    const items = rawItems.filter(this.isOrderItem);
    const addr = (m.shippingAddress ?? {}) as Record<string, string>;

    const itemsHtml = items.map((item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${item.productName}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${fmt(item.unitPrice)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${fmt(item.subtotal)}</td>
      </tr>`).join('');

    try {
      await this.mailer.sendMail({
        to: email,
        subject: `Your TecShop Order Confirmation — ${m.orderNumber}`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
          <div style="background:#fff;padding:30px;border-radius:8px;">
            <h1 style="color:#007bff;text-align:center;">TecShop</h1>
            <h2 style="color:#28a745;text-align:center;">Order Confirmed!</h2>
            <p>Hi ${m.customerName},</p>
            <p>Thank you for your order! It's been confirmed and will be shipped soon.</p>
            <div style="background:#f8f9fa;padding:15px;border-radius:6px;margin:20px 0;">
              <strong>Order Number:</strong> ${m.orderNumber}<br>
              <strong>Order Date:</strong> ${m.orderDate}
            </div>
            <h3>Order Items</h3>
            <table style="width:100%;border-collapse:collapse;">
              <thead><tr style="background:#f8f9fa;">
                <th style="padding:10px;text-align:left;border-bottom:2px solid #dee2e6;">Product</th>
                <th style="padding:10px;text-align:center;border-bottom:2px solid #dee2e6;">Qty</th>
                <th style="padding:10px;text-align:right;border-bottom:2px solid #dee2e6;">Price</th>
                <th style="padding:10px;text-align:right;border-bottom:2px solid #dee2e6;">Subtotal</th>
              </tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div style="text-align:right;margin:20px 0;">
              <p>Subtotal: ${fmt(m.subtotalAmount as number ?? 0)}</p>
              ${(m.discountAmount as number) > 0 ? `<p style="color:#28a745;">Discount: -${fmt(m.discountAmount as number)}</p>` : ''}
              <p>Shipping: ${fmt(m.shippingCost as number ?? 0)}</p>
              <p style="font-size:18px;font-weight:bold;">Total: ${fmt(m.finalAmount as number ?? 0)}</p>
            </div>
            <h3>Shipping Address</h3>
            <p>${addr.name}<br>${addr.street}<br>${addr.city}${addr.state ? `, ${addr.state}` : ''} ${addr.zipCode}<br>${addr.country}</p>
          </div>
        </div>`,
      });
    } catch (err) {
      this.logger.error(`Failed to send order confirmation to ${email}`, err);
      throw err;
    }
    if (this.isDev) this.logger.log(`Order confirmation → ${email} (${m.orderNumber})`);
  }

  private async sendSellerNewOrder(email: string, m: Record<string, unknown>): Promise<void> {
    const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    const rawItems = Array.isArray(m.items) ? m.items : [];
    const items = rawItems.filter(this.isOrderItem);
    const addr = (m.shippingAddress ?? {}) as Record<string, string>;

    const itemsHtml = items.map((item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${item.productName}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${fmt(item.unitPrice)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${fmt(item.subtotal)}</td>
      </tr>`).join('');

    try {
      await this.mailer.sendMail({
        to: email,
        subject: `New Order Received — ${m.orderNumber}`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
          <div style="background:#fff;padding:30px;border-radius:8px;">
            <h1 style="color:#007bff;text-align:center;">TecShop Seller</h1>
            <h2 style="color:#28a745;text-align:center;">New Order Received!</h2>
            <p>Hi ${m.sellerName},</p>
            <p>You have a new order. Please prepare the items for shipping.</p>
            <div style="background:#f8f9fa;padding:15px;border-radius:6px;margin:20px 0;">
              <strong>Order Number:</strong> ${m.orderNumber}<br>
              <strong>Order Date:</strong> ${m.orderDate}
            </div>
            <h3>Your Items</h3>
            <table style="width:100%;border-collapse:collapse;">
              <thead><tr style="background:#f8f9fa;">
                <th style="padding:10px;text-align:left;border-bottom:2px solid #dee2e6;">Product</th>
                <th style="padding:10px;text-align:center;border-bottom:2px solid #dee2e6;">Qty</th>
                <th style="padding:10px;text-align:right;border-bottom:2px solid #dee2e6;">Price</th>
                <th style="padding:10px;text-align:right;border-bottom:2px solid #dee2e6;">Subtotal</th>
              </tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div style="background:#e7f3ff;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #007bff;">
              <p><strong>Total Sales:</strong> ${fmt(m.totalPayout as number ?? 0)}</p>
              <p>Platform Fee (10%): -${fmt(m.platformFee as number ?? 0)}</p>
              <p style="color:#28a745;font-size:16px;font-weight:bold;"><strong>Your Payout:</strong> ${fmt(m.netPayout as number ?? 0)}</p>
            </div>
            <h3>Ship To</h3>
            <p>${addr.name}<br>${addr.street}<br>${addr.city}${addr.state ? `, ${addr.state}` : ''} ${addr.zipCode}<br>${addr.country}</p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${process.env.SELLER_UI_URL ?? 'http://localhost:3001'}/en/dashboard/orders"
                 style="background:#007bff;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">
                View Order Details
              </a>
            </div>
          </div>
        </div>`,
      });
    } catch (err) {
      this.logger.error(`Failed to send seller new-order email to ${email}`, err);
      throw err;
    }
    if (this.isDev) this.logger.log(`Seller new-order → ${email} (${m.orderNumber})`);
  }

  private async sendOrderShipped(email: string, m: Record<string, unknown>): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: email,
        subject: `Your TecShop Order Has Shipped — ${m.orderNumber}`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
          <div style="background:#fff;padding:30px;border-radius:8px;">
            <h1 style="color:#007bff;text-align:center;">TecShop</h1>
            <div style="text-align:center;font-size:48px;">📦</div>
            <h2 style="color:#007bff;text-align:center;">Your Order Is On Its Way!</h2>
            <p>Hi ${m.customerName},</p>
            <p>Your order <strong>${m.orderNumber}</strong> has been shipped!</p>
            ${m.trackingNumber ? `
            <div style="background:#e7f3ff;border-left:4px solid #007bff;padding:16px;border-radius:0 6px 6px 0;margin:20px 0;">
              <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;">Tracking Number</p>
              <p style="margin:0;font-size:18px;font-weight:bold;font-family:monospace;">${m.trackingNumber}</p>
              ${m.carrier ? `<p style="margin:4px 0 0;font-size:13px;color:#666;">Carrier: ${m.carrier}</p>` : ''}
              <a href="https://t.17track.net/en#nums=${m.trackingNumber}"
                 style="display:inline-block;margin-top:12px;background:#007bff;color:#fff;padding:8px 16px;text-decoration:none;border-radius:4px;font-size:13px;font-weight:bold;">
                Track Your Package →
              </a>
            </div>` : ''}
          </div>
        </div>`,
      });
    } catch (err) {
      this.logger.error(`Failed to send order shipped email to ${email}`, err);
      throw err;
    }
    if (this.isDev) this.logger.log(`Order shipped → ${email} (${m.orderNumber})`);
  }

  private async sendOrderDelivered(email: string, m: Record<string, unknown>): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: email,
        subject: `Your TecShop Order Has Been Delivered — ${m.orderNumber}`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
          <div style="background:#fff;padding:30px;border-radius:8px;">
            <h1 style="color:#007bff;text-align:center;">TecShop</h1>
            <div style="text-align:center;font-size:48px;">✅</div>
            <h2 style="color:#28a745;text-align:center;">Order Delivered!</h2>
            <p>Hi ${m.customerName},</p>
            <p>Your order <strong>${m.orderNumber}</strong> has been delivered. We hope you love your purchase!</p>
            <div style="background:#d4edda;border-left:4px solid #28a745;padding:16px;border-radius:0 6px 6px 0;">
              <p style="margin:0;color:#155724;font-weight:600;">Enjoying your purchase?</p>
              <p style="margin:6px 0 0;color:#155724;font-size:13px;">Leave a review to help other shoppers and reward the seller.</p>
            </div>
          </div>
        </div>`,
      });
    } catch (err) {
      this.logger.error(`Failed to send order delivered email to ${email}`, err);
      throw err;
    }
    if (this.isDev) this.logger.log(`Order delivered → ${email} (${m.orderNumber})`);
  }
}
