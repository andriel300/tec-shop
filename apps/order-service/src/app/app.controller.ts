import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order.service';
import { WebhookService } from '../services/webhook.service';
import { CreateCheckoutSessionDto, GetSellerOrdersDto } from '@tec-shop/dto';

@Controller()
export class AppController {
  constructor(
    private readonly orderService: OrderService,
    private readonly webhookService: WebhookService
  ) {}

  @MessagePattern('create-checkout-session')
  async createCheckoutSession(
    @Payload() payload: { userId: string; data: CreateCheckoutSessionDto }
  ) {
    return this.orderService.createCheckoutSession(
      payload.userId,
      payload.data
    );
  }

  @MessagePattern('handle-successful-payment')
  async handleSuccessfulPayment(@Payload() sessionId: string) {
    return this.orderService.handleSuccessfulPayment(sessionId);
  }

  @MessagePattern('get-user-orders')
  async getUserOrders(@Payload() userId: string) {
    return this.orderService.getUserOrders(userId);
  }

  @MessagePattern('get-order-by-id')
  async getOrderById(@Payload() payload: { userId: string; orderId: string }) {
    return this.orderService.getOrderById(payload.userId, payload.orderId);
  }

  @MessagePattern('get-order-by-number')
  async getOrderByNumber(
    @Payload() payload: { userId: string; orderNumber: string }
  ) {
    return this.orderService.getOrderByNumber(
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
    return this.orderService.getSellerOrders(query);
  }

  @MessagePattern('get-seller-order-details')
  async getSellerOrderDetails(
    @Payload() payload: { sellerId: string; orderId: string }
  ) {
    return this.orderService.getOrderDetailsForSeller(
      payload.sellerId,
      payload.orderId
    );
  }

  @MessagePattern('update-delivery-status')
  async updateDeliveryStatus(
    @Payload()
    payload: {
      sellerId: string;
      orderId: string;
      status: string;
      trackingNumber?: string;
    }
  ) {
    return this.orderService.updateDeliveryStatus(
      payload.sellerId,
      payload.orderId,
      payload.status as any,
      payload.trackingNumber
    );
  }
}
