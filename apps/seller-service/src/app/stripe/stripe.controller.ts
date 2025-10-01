import { Controller, BadRequestException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StripeService } from './stripe.service';
import Stripe from 'stripe';

@Controller()
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @MessagePattern('stripe-create-connect-account')
  async createConnectAccount(@Payload() authId: string) {
    if (!authId) {
      throw new BadRequestException('authId is required');
    }
    return this.stripeService.createConnectAccount(authId);
  }

  @MessagePattern('stripe-get-account-status')
  async getAccountStatus(@Payload() authId: string) {
    if (!authId) {
      throw new BadRequestException('authId is required');
    }
    return this.stripeService.getAccountStatus(authId);
  }

  @MessagePattern('stripe-handle-connect-return')
  async handleConnectReturn(@Payload() payload: { authId: string; state: string }) {
    if (!payload.authId || !payload.state) {
      throw new BadRequestException('authId and state are required');
    }
    return this.stripeService.handleConnectReturn(payload.authId, payload.state);
  }

  @MessagePattern('stripe-handle-connect-refresh')
  async handleConnectRefresh(@Payload() payload: { authId: string; state: string }) {
    if (!payload.authId || !payload.state) {
      throw new BadRequestException('authId and state are required');
    }
    return this.stripeService.handleConnectRefresh(payload.authId, payload.state);
  }

  @MessagePattern('stripe-webhook')
  async handleWebhook(@Payload() event: Stripe.Event) {
    if (!event) {
      throw new BadRequestException('Webhook event is required');
    }
    return this.stripeService.handleWebhook(event);
  }
}