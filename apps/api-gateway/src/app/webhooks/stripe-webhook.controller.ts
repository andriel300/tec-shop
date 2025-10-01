import { Controller, Post, Body, Headers, Inject, BadRequestException, RawBodyRequest, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import Stripe from 'stripe';
import type { Request } from 'express';

@ApiTags('Webhooks')
@Controller('webhooks')
export class StripeWebhookController {
  private stripe: Stripe;

  constructor(
    @Inject('SELLER_SERVICE') private readonly sellerService: ClientProxy
  ) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is required for webhook verification');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
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
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        request.rawBody || request.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    try {
      // Forward event to seller-service for processing
      const result = await firstValueFrom(
        this.sellerService.send('stripe-webhook', event)
      );

      return result;
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw new BadRequestException('Webhook processing failed');
    }
  }
}