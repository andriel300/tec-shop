import { Injectable, Logger } from '@nestjs/common';
import { OrderService } from '../app/order.service';
import Stripe from 'stripe';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly orderService: OrderService
  ) {}

  async handleWebhookEvent(
    event: unknown
  ): Promise<{ received: boolean }> {
    // Event is already verified by API Gateway, cast it to Stripe.Event
    const stripeEvent = event as Stripe.Event;

    this.logger.log(`Received webhook event: ${stripeEvent.type}`);

    try {
      switch (stripeEvent.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            stripeEvent.data.object as Stripe.Checkout.Session
          );
          break;

        case 'checkout.session.expired':
          await this.handleCheckoutSessionExpired(
            stripeEvent.data.object as Stripe.Checkout.Session
          );
          break;

        case 'payment_intent.succeeded':
          this.logger.log(`Payment intent succeeded: ${stripeEvent.data.object.id}`);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(
            stripeEvent.data.object as Stripe.PaymentIntent
          );
          break;

        default:
          this.logger.log(`Unhandled event type: ${stripeEvent.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Error processing webhook event ${stripeEvent.type}`, error);
      throw error;
    }
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    this.logger.log(`Checkout session completed: ${session.id}`);

    if (session.payment_status === 'paid') {
      try {
        await this.orderService.handleSuccessfulPayment(session.id);
        this.logger.log(`Order created successfully for session: ${session.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to create order for session ${session.id}`,
          error
        );
        throw error;
      }
    }
  }

  private async handleCheckoutSessionExpired(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    this.logger.log(`Checkout session expired: ${session.id}`);
    // Session data will be cleaned up by TTL in Redis
    // Database record will remain for audit purposes
  }

  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    this.logger.warn(
      `Payment failed: ${paymentIntent.id} - ${paymentIntent.last_payment_error?.message}`
    );
    // Could send notification to user about payment failure
  }
}
