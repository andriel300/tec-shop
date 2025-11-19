import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CartItemDto } from '@tec-shop/dto';

interface CheckoutSessionData {
  userId: string;
  items: CartItemDto[];
  shippingAddress: Record<string, unknown>;
  subtotalAmount: number;
  discountAmount: number;
  shippingCost: number;
  platformFee: number;
  finalAmount: number;
  couponCode?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly stripe: Stripe;
  private readonly platformFeePercentage = 0.1; // 10% platform fee

  constructor(private readonly configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable not set');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  async createCheckoutSession(data: CheckoutSessionData): Promise<{
    sessionId: string;
    sessionUrl: string;
    expiresAt: Date;
  }> {
    try {
      const lineItems = data.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.productName,
            images: item.productImage ? [item.productImage] : [],
          },
          unit_amount: item.unitPrice, // Already in cents
        },
        quantity: item.quantity,
      }));

      // Add shipping as a line item if there's a shipping cost
      if (data.shippingCost > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Shipping',
              images: [],
            },
            unit_amount: data.shippingCost,
          },
          quantity: 1,
        });
      }

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/cart?cancelled=true`,
        customer_email: undefined, // We'll get this from user profile
        metadata: {
          userId: data.userId,
          subtotalAmount: data.subtotalAmount.toString(),
          discountAmount: data.discountAmount.toString(),
          shippingCost: data.shippingCost.toString(),
          platformFee: data.platformFee.toString(),
          finalAmount: data.finalAmount.toString(),
          couponCode: data.couponCode || '',
        },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
      });

      if (!session.url) {
        throw new Error('Stripe session created but URL is missing');
      }

      const expiresAt = new Date(session.expires_at * 1000);

      this.logger.log(`Stripe checkout session created: ${session.id}`);

      return {
        sessionId: session.id,
        sessionUrl: session.url,
        expiresAt,
      };
    } catch (error) {
      this.logger.error('Failed to create Stripe checkout session', error);
      throw new BadRequestException('Failed to create payment session');
    }
  }

  async getCheckoutSession(
    sessionId: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      this.logger.error(`Failed to retrieve session ${sessionId}`, error);
      throw new BadRequestException('Failed to retrieve payment session');
    }
  }

  async createSellerPayout(
    stripeAccountId: string,
    amount: number,
    orderId: string
  ): Promise<string> {
    try {
      const transfer = await this.stripe.transfers.create({
        amount,
        currency: 'usd',
        destination: stripeAccountId,
        description: `Payout for order ${orderId}`,
        metadata: {
          orderId,
        },
      });

      this.logger.log(
        `Stripe transfer created: ${transfer.id} for ${
          amount / 100
        } USD to ${stripeAccountId}`
      );

      return transfer.id;
    } catch (error) {
      this.logger.error(`Failed to create payout for order ${orderId}`, error);
      throw error;
    }
  }

  calculatePlatformFee(amount: number): number {
    return Math.floor(amount * this.platformFeePercentage);
  }

  calculateSellerPayout(subtotal: number): {
    platformFee: number;
    sellerPayout: number;
  } {
    const platformFee = this.calculatePlatformFee(subtotal);
    const sellerPayout = subtotal - platformFee;
    return { platformFee, sellerPayout };
  }

  async constructWebhookEvent(
    payload: string | Buffer,
    signature: string
  ): Promise<Stripe.Event> {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET'
    );
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}
