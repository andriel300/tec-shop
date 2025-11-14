import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
  subtotalAmount: number;
  discountAmount: number;
  shippingCost: number;
  finalAmount: number;
  trackingNumber?: string;
}

interface SellerOrderNotificationData {
  sellerName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  totalPayout: number;
  platformFee: number;
  netPayout: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';

  constructor(private readonly mailerService: MailerService) {}

  async sendOrderConfirmation(to: string, data: OrderConfirmationData): Promise<void> {
    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.unitPrice / 100).toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.subtotal / 100).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const shippingAddressHtml = `
      <p style="margin: 0; color: #666; line-height: 1.6;">
        ${data.shippingAddress.name}<br>
        ${data.shippingAddress.street}<br>
        ${data.shippingAddress.city}${data.shippingAddress.state ? `, ${data.shippingAddress.state}` : ''} ${data.shippingAddress.zipCode}<br>
        ${data.shippingAddress.country}
      </p>
    `;

    await this.mailerService.sendMail({
      to,
      subject: `Your TecShop Order Confirmation - ${data.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #007bff; margin: 0; font-size: 28px;">TecShop</h1>
            </div>

            <h2 style="color: #28a745; margin-bottom: 20px; text-align: center;">Order Confirmed!</h2>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Hi ${data.customerName},
            </p>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Thank you for your order! Your order has been confirmed and will be shipped soon.
            </p>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #333; font-size: 14px;">
                <strong>Order Number:</strong> ${data.orderNumber}<br>
                <strong>Order Date:</strong> ${data.orderDate}
                ${data.trackingNumber ? `<br><strong>Tracking Number:</strong> ${data.trackingNumber}` : ''}
              </p>
            </div>

            <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="text-align: right; margin-bottom: 20px;">
              <p style="margin: 5px 0; color: #666;">Subtotal: $${(data.subtotalAmount / 100).toFixed(2)}</p>
              ${data.discountAmount > 0 ? `<p style="margin: 5px 0; color: #28a745;">Discount: -$${(data.discountAmount / 100).toFixed(2)}</p>` : ''}
              <p style="margin: 5px 0; color: #666;">Shipping: $${(data.shippingCost / 100).toFixed(2)}</p>
              <p style="margin: 10px 0 0 0; color: #333; font-size: 18px; font-weight: bold;">Total: $${(data.finalAmount / 100).toFixed(2)}</p>
            </div>

            <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">Shipping Address</h3>
            ${shippingAddressHtml}

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Thank you for shopping with TecShop!<br>
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `,
    });

    if (this.isDevelopment) {
      this.logger.log(`Order confirmation email sent to ${to} for order ${data.orderNumber}`);
    }
  }

  async sendSellerOrderNotification(to: string, data: SellerOrderNotificationData): Promise<void> {
    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.unitPrice / 100).toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.subtotal / 100).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const shippingAddressHtml = `
      <p style="margin: 0; color: #666; line-height: 1.6;">
        ${data.shippingAddress.name}<br>
        ${data.shippingAddress.street}<br>
        ${data.shippingAddress.city}${data.shippingAddress.state ? `, ${data.shippingAddress.state}` : ''} ${data.shippingAddress.zipCode}<br>
        ${data.shippingAddress.country}
      </p>
    `;

    await this.mailerService.sendMail({
      to,
      subject: `New Order Received - ${data.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #007bff; margin: 0; font-size: 28px;">TecShop Seller</h1>
            </div>

            <h2 style="color: #28a745; margin-bottom: 20px; text-align: center;">New Order Received!</h2>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Hi ${data.sellerName},
            </p>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Great news! You have received a new order. Please prepare the items for shipping.
            </p>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #333; font-size: 14px;">
                <strong>Order Number:</strong> ${data.orderNumber}<br>
                <strong>Order Date:</strong> ${data.orderDate}
              </p>
            </div>

            <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">Your Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #007bff;">
              <p style="margin: 5px 0; color: #333;"><strong>Total Sales:</strong> $${(data.totalPayout / 100).toFixed(2)}</p>
              <p style="margin: 5px 0; color: #666;">Platform Fee (10%):</p> -$${(data.platformFee / 100).toFixed(2)}</p>
              <p style="margin: 5px 0; color: #28a745; font-size: 16px; font-weight: bold;"><strong>Your Payout:</strong> $${(data.netPayout / 100).toFixed(2)}</p>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Funds will be transferred to your Stripe account within 2-3 business days.</p>
            </div>

            <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">Shipping Address</h3>
            ${shippingAddressHtml}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.SELLER_UI_URL || 'http://localhost:3001'}/orders"
                 style="background-color: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                View Order Details
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Thank you for selling on TecShop!
            </p>
          </div>
        </div>
      `,
    });

    if (this.isDevelopment) {
      this.logger.log(`Seller order notification sent to ${to} for order ${data.orderNumber}`);
    }
  }
}
