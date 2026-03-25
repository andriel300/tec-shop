import { Controller, Post, Headers, Inject, BadRequestException, Logger, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { Request } from 'express';

@ApiTags('Webhooks')
@Controller('webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private stripe: Stripe;

  constructor(
    @Inject('SELLER_SERVICE') private readonly sellerService: ClientProxy,
    @Inject('ORDER_SERVICE') private readonly orderService: ClientProxy,
    private readonly configService: ConfigService
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is required for webhook verification');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  @Post('stripe')
  @ApiExcludeEndpoint() // Exclude from Swagger as this is for Stripe only
  async handleStripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    const endpointSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!endpointSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not configured - webhook processing disabled');
      return { received: false, message: 'Webhook secret not configured' };
    }

    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    let event: Stripe.Event;

    try {
      // Get the raw body - NestJS with rawBody: true provides it in rawBody property
      // If using express.raw() middleware, the body IS the raw buffer
      const rawBody = request.rawBody || request.body;

      if (!rawBody) {
        throw new Error('No body provided');
      }

      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret
      );
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    const orderEvents = [
      'checkout.session.completed',
      'checkout.session.expired',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
    ];

    // Fire-and-forget: return 200 to Stripe immediately so it does not
    // retry on slow downstream processing. Order/seller service must handle
    // idempotency (existing stripeSessionId unique guard covers this).
    if (orderEvents.includes(event.type)) {
      this.orderService.emit('handle-stripe-webhook', event).subscribe({
        error: (err: unknown) => this.logger.error('Stripe webhook emit failed', err),
      });
    } else {
      this.sellerService.emit('stripe-webhook', event).subscribe({
        error: (err: unknown) => this.logger.error('Stripe webhook emit failed', err),
      });
    }

    return { received: true };
  }
}
