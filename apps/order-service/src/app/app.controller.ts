import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderCheckoutService } from './order-checkout.service';
import { OrderQueryService } from './order-query.service';
import { WebhookService } from '../services/webhook.service';
import { CreateCheckoutSessionDto, GetSellerOrdersDto, OrderStatus } from '@tec-shop/dto';

@Controller()
export class AppController {
  constructor(
    private readonly orderCheckout: OrderCheckoutService,
    private readonly orderQuery: OrderQueryService,
    private readonly webhookService: WebhookService
  ) {}

  @MessagePattern('create-checkout-session')
  async createCheckoutSession(
    @Payload() payload: { userId: string; data: CreateCheckoutSessionDto }
  ) {
    return this.orderCheckout.createCheckoutSession(
      payload.userId,
      payload.data
    );
  }

  @MessagePattern('handle-successful-payment')
  async handleSuccessfulPayment(@Payload() sessionId: string) {
    return this.orderCheckout.handleSuccessfulPayment(sessionId);
  }

  @MessagePattern('get-user-orders')
  async getUserOrders(@Payload() userId: string) {
    return this.orderQuery.getUserOrders(userId);
  }

  @MessagePattern('get-order-by-id')
  async getOrderById(@Payload() payload: { userId: string; orderId: string }) {
    return this.orderQuery.getOrderById(payload.userId, payload.orderId);
  }

  @MessagePattern('get-order-by-number')
  async getOrderByNumber(
    @Payload() payload: { userId: string; orderNumber: string }
  ) {
    return this.orderQuery.getOrderByNumber(
      payload.userId,
      payload.orderNumber
    );
  }

  @MessagePattern('handle-stripe-webhook')
  async handleStripeWebhook(@Payload() event: unknown) {
    // Event is already verified by API Gateway
    return this.webhookService.handleWebhookEvent(event);
  }

  @MessagePattern('get-seller-orders')
  async getSellerOrders(@Payload() query: GetSellerOrdersDto) {
    return this.orderQuery.getSellerOrders(query);
  }

  @MessagePattern('get-seller-order-details')
  async getSellerOrderDetails(
    @Payload() payload: { sellerId: string | null; orderId: string }
  ) {
    return this.orderQuery.getOrderDetailsForSeller(
      payload.sellerId ?? null,
      payload.orderId
    );
  }

  @MessagePattern('order-get-seller-chart-data')
  async getSellerChartData(
    @Payload() payload: { shopId: string; sellerId: string }
  ) {
    return this.orderQuery.getSellerChartData(payload);
  }

  @MessagePattern('update-delivery-status')
  async updateDeliveryStatus(
    @Payload()
    payload: {
      sellerId: string | null;
      orderId: string;
      status: string;
      trackingNumber?: string;
    }
  ) {
    return this.orderQuery.updateDeliveryStatus(
      payload.sellerId ?? null,
      payload.orderId,
      payload.status as OrderStatus,
      payload.trackingNumber
    );
  }
}
