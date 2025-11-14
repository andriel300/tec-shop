import { Controller, Post, Headers, Inject, BadRequestException, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import Stripe from 'stripe';
import type { Request } from 'express';

@ApiTags('Webhooks')
@Controller('webhooks')
export class StripeWebhookController {
  private stripe: Stripe;

  constructor(
    @Inject('SELLER_SERVICE') private readonly sellerService: ClientProxy,
    @Inject('ORDER_SERVICE') private readonly orderService: ClientProxy
  ) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
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
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.warn('⚠️  STRIPE_WEBHOOK_SECRET not configured - webhook processing disabled');
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
      console.error('Webhook signature verification failed:', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    try {
      // Route webhook events based on type
      const orderEvents = [
        'checkout.session.completed',
        'checkout.session.expired',
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
      ];

      if (orderEvents.includes(event.type)) {
        // Forward to order-service with verified event
        const result = await firstValueFrom(
          this.orderService.send('handle-stripe-webhook', event)
        );
        return result;
      } else {
        // Forward to seller-service for Connect events
        const result = await firstValueFrom(
          this.sellerService.send('stripe-webhook', event)
        );
        return result;
      }
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw new BadRequestException('Webhook processing failed');
    }
  }
}