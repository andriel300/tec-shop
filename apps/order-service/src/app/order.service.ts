import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { OrderPrismaService } from '../prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { EmailService } from './email/email.service';
import { PaymentService } from '../services/payment.service';
import { KafkaProducerService } from '../services/kafka-producer.service';
import { UserServiceClient } from '../clients/user.client';
import { SellerServiceClient } from '../clients/seller.client';
import {
  CartItemDto,
  CreateCheckoutSessionDto,
  OrderStatus,
  PaymentStatus,
} from '@tec-shop/dto';
import Stripe from 'stripe';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly SESSION_EXPIRE_SECONDS = 30 * 60; // 30 minutes

  constructor(
    private readonly prisma: OrderPrismaService,
    private readonly redis: RedisService,
    private readonly emailService: EmailService,
    private readonly paymentService: PaymentService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly userClient: UserServiceClient,
    private readonly sellerClient: SellerServiceClient
  ) {}

  async createCheckoutSession(
    userId: string,
    data: CreateCheckoutSessionDto
  ): Promise<{ sessionId: string; sessionUrl: string; expiresAt: Date }> {
    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Cart cannot be empty');
    }

    // Get shipping address
    const shippingAddress = await this.userClient.getShippingAddress(
      userId,
      data.shippingAddressId
    );

    if (!shippingAddress) {
      throw new NotFoundException('Shipping address not found');
    }

    // Calculate amounts
    const subtotalAmount = data.items.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0
    );

    let discountAmount = 0;

    // Verify and apply coupon if provided
    if (data.couponCode) {
      const couponValidation = await this.verifyCoupon(
        data.couponCode,
        data.items
      );
      if (couponValidation.isValid) {
        discountAmount = couponValidation.discountAmount;
      }
    }

    // Calculate shipping cost (simple flat rate for now)
    const shippingCost = 1000; // $10.00 in cents

    // Calculate platform fee (10% of subtotal)
    const platformFee = this.paymentService.calculatePlatformFee(subtotalAmount);

    // Calculate final amount
    const finalAmount = subtotalAmount - discountAmount + shippingCost;

    // Create Stripe checkout session
    const session = await this.paymentService.createCheckoutSession({
      userId,
      items: data.items,
      shippingAddress,
      subtotalAmount,
      discountAmount,
      shippingCost,
      platformFee,
      finalAmount,
      couponCode: data.couponCode,
    });

    // Store payment session in Redis and Database
    await this.storePaymentSession({
      sessionId: session.sessionId,
      userId,
      cartData: data.items,
      shippingAddressId: data.shippingAddressId,
      shippingAddress,
      subtotalAmount,
      discountAmount,
      shippingCost,
      platformFee,
      finalAmount,
      couponCode: data.couponCode,
      expiresAt: session.expiresAt,
    });

    this.logger.log(`Checkout session created for user ${userId}: ${session.sessionId}`);

    return session;
  }

  private async storePaymentSession(data: {
    sessionId: string;
    userId: string;
    cartData: CartItemDto[];
    shippingAddressId: string;
    shippingAddress: Record<string, unknown>;
    subtotalAmount: number;
    discountAmount: number;
    shippingCost: number;
    platformFee: number;
    finalAmount: number;
    couponCode?: string;
    expiresAt: Date;
  }): Promise<void> {
    // Store in Redis for quick access
    const redisKey = `payment-session:${data.sessionId}`;
    await this.redis.set(
      redisKey,
      JSON.stringify(data),
      this.SESSION_EXPIRE_SECONDS
    );

    // Store in database as backup
    await this.prisma.paymentSession.create({
      data: {
        sessionId: data.sessionId,
        userId: data.userId,
        cartData: data.cartData,
        shippingAddressId: data.shippingAddressId,
        shippingAddress: data.shippingAddress,
        subtotalAmount: data.subtotalAmount,
        discountAmount: data.discountAmount,
        shippingCost: data.shippingCost,
        platformFee: data.platformFee,
        finalAmount: data.finalAmount,
        couponCode: data.couponCode,
        status: PaymentStatus.PENDING,
        expiresAt: data.expiresAt,
      },
    });
  }

  private async verifyCoupon(
    couponCode: string,
    items: CartItemDto[]
  ): Promise<{ isValid: boolean; discountAmount: number }> {
    // For now, return no discount
    // In a full implementation, this would call seller-service to validate coupons
    return { isValid: false, discountAmount: 0 };
  }

  async handleSuccessfulPayment(sessionId: string): Promise<Record<string, unknown>> {
    this.logger.log(`Processing successful payment for session: ${sessionId}`);

    // Get payment session from Redis or DB
    const sessionData = await this.getPaymentSession(sessionId);
    if (!sessionData) {
      throw new NotFoundException('Payment session not found');
    }

    // Get Stripe session to verify payment
    const stripeSession = await this.paymentService.getCheckoutSession(sessionId);
    if (stripeSession.payment_status !== 'paid') {
      throw new BadRequestException('Payment not completed');
    }

    // Check if order already exists for this session
    const existingOrder = await this.prisma.order.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (existingOrder) {
      this.logger.warn(`Order already exists for session ${sessionId}`);
      return existingOrder;
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: sessionData.userId,
        shippingAddressId: sessionData.shippingAddressId,
        shippingAddress: sessionData.shippingAddress,
        stripeSessionId: sessionId,
        stripePaymentId: stripeSession.payment_intent as string,
        paymentMethod: 'card',
        subtotalAmount: sessionData.subtotalAmount,
        discountAmount: sessionData.discountAmount,
        shippingCost: sessionData.shippingCost,
        platformFee: sessionData.platformFee,
        finalAmount: sessionData.finalAmount,
        couponCode: sessionData.couponCode,
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.COMPLETED,
        items: {
          create: sessionData.cartData.map((item: CartItemDto) => {
            const { platformFee, sellerPayout } =
              this.paymentService.calculateSellerPayout(
                item.unitPrice * item.quantity
              );

            return {
              sellerId: item.sellerId,
              shopId: item.shopId,
              shopName: '', // Will be fetched
              productId: item.productId,
              productName: item.productName,
              productSlug: item.productSlug,
              productImage: item.productImage,
              variantId: item.variantId,
              sku: item.sku,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.unitPrice * item.quantity,
              sellerPayout,
              platformFee,
            };
          }),
        },
      },
      include: {
        items: true,
      },
    });

    // Process seller payouts
    await this.processSellerPayouts(order.id, sessionData.cartData);

    // Send order confirmation email
    await this.sendOrderConfirmationEmail(order.id);

    // Send seller notifications
    await this.sendSellerNotifications(order.id);

    // Track purchase in analytics
    await this.trackPurchaseEvent(order.id, sessionData.userId, sessionData.cartData);

    // Clean up session data
    await this.cleanupPaymentSession(sessionId);

    this.logger.log(`Order created successfully: ${orderNumber}`);

    return order;
  }

  private async getPaymentSession(sessionId: string): Promise<Record<string, unknown> | null> {
    // Try Redis first
    const redisKey = `payment-session:${sessionId}`;
    const redisData = await this.redis.get(redisKey);

    if (redisData) {
      return JSON.parse(redisData);
    }

    // Fallback to database
    const dbSession = await this.prisma.paymentSession.findUnique({
      where: { sessionId },
    });

    if (!dbSession) {
      return null;
    }

    return {
      sessionId: dbSession.sessionId,
      userId: dbSession.userId,
      cartData: dbSession.cartData,
      shippingAddressId: dbSession.shippingAddressId,
      shippingAddress: dbSession.shippingAddress,
      subtotalAmount: dbSession.subtotalAmount,
      discountAmount: dbSession.discountAmount,
      shippingCost: dbSession.shippingCost,
      platformFee: dbSession.platformFee,
      finalAmount: dbSession.finalAmount,
      couponCode: dbSession.couponCode,
    };
  }

  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private async processSellerPayouts(
    orderId: string,
    items: CartItemDto[]
  ): Promise<void> {
    // Group items by seller
    const sellerGroups = items.reduce((acc, item) => {
      if (!acc[item.sellerId]) {
        acc[item.sellerId] = [];
      }
      acc[item.sellerId].push(item);
      return acc;
    }, {} as Record<string, CartItemDto[]>);

    // Create payout records for each seller
    for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
      const totalAmount = sellerItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );

      const { platformFee, sellerPayout } =
        this.paymentService.calculateSellerPayout(totalAmount);

      // Get seller's Stripe account
      const seller = await this.sellerClient.getSellerByAuthId(sellerId);
      if (!seller || !seller.stripeAccountId) {
        this.logger.error(`Seller ${sellerId} has no Stripe account configured`);
        continue;
      }

      // Create payout record
      await this.prisma.sellerPayout.create({
        data: {
          orderId,
          sellerId,
          shopId: sellerItems[0].shopId,
          stripeAccountId: seller.stripeAccountId as string,
          totalAmount,
          platformFee,
          payoutAmount: sellerPayout,
          status: 'PENDING',
        },
      });
    }

    // Process payouts asynchronously
    this.processPayoutsAsync(orderId);
  }

  private async processPayoutsAsync(orderId: string): Promise<void> {
    // This runs in the background
    setImmediate(async () => {
      try {
        const payouts = await this.prisma.sellerPayout.findMany({
          where: { orderId, status: 'PENDING' },
        });

        for (const payout of payouts) {
          try {
            const transferId = await this.paymentService.createSellerPayout(
              payout.stripeAccountId,
              payout.payoutAmount,
              orderId
            );

            await this.prisma.sellerPayout.update({
              where: { id: payout.id },
              data: {
                stripeTransferId: transferId,
                status: 'COMPLETED',
                processedAt: new Date(),
              },
            });

            this.logger.log(`Payout completed for seller ${payout.sellerId}: ${transferId}`);
          } catch (error) {
            this.logger.error(`Failed to process payout for seller ${payout.sellerId}`, error);

            await this.prisma.sellerPayout.update({
              where: { id: payout.id },
              data: {
                status: 'FAILED',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                retryCount: { increment: 1 },
              },
            });
          }
        }
      } catch (error) {
        this.logger.error(`Error processing payouts for order ${orderId}`, error);
      }
    });
  }

  private async sendOrderConfirmationEmail(orderId: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const userProfile = await this.userClient.getUserProfile(order.userId);
      if (!userProfile || !userProfile.email) {
        this.logger.warn(`No email found for user ${order.userId}`);
        return;
      }

      const shippingAddr = order.shippingAddress as Record<string, unknown>;

      await this.emailService.sendOrderConfirmation(
        userProfile.email as string,
        {
          customerName: shippingAddr.name as string,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt.toLocaleDateString(),
          items: order.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
          shippingAddress: {
            name: shippingAddr.name as string,
            street: shippingAddr.street as string,
            city: shippingAddr.city as string,
            state: shippingAddr.state as string | undefined,
            zipCode: shippingAddr.zipCode as string,
            country: shippingAddr.country as string,
          },
          subtotalAmount: order.subtotalAmount,
          discountAmount: order.discountAmount,
          shippingCost: order.shippingCost,
          finalAmount: order.finalAmount,
          trackingNumber: order.trackingNumber || undefined,
        }
      );

      this.logger.log(`Order confirmation email sent for order ${order.orderNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation email for order ${orderId}`, error);
    }
  }

  private async sendSellerNotifications(orderId: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        return;
      }

      // Group items by seller
      const sellerGroups = order.items.reduce((acc, item) => {
        if (!acc[item.sellerId]) {
          acc[item.sellerId] = [];
        }
        acc[item.sellerId].push(item);
        return acc;
      }, {} as Record<string, typeof order.items>);

      const shippingAddr = order.shippingAddress as Record<string, unknown>;

      // Send email to each seller
      for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
        const seller = await this.sellerClient.getSellerByAuthId(sellerId);
        if (!seller || !seller.email) {
          continue;
        }

        const totalPayout = sellerItems.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );
        const platformFee = sellerItems.reduce(
          (sum, item) => sum + item.platformFee,
          0
        );
        const netPayout = sellerItems.reduce(
          (sum, item) => sum + item.sellerPayout,
          0
        );

        await this.emailService.sendSellerOrderNotification(
          seller.email as string,
          {
            sellerName: seller.name as string,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt.toLocaleDateString(),
            items: sellerItems.map((item) => ({
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
            totalPayout,
            platformFee,
            netPayout,
            shippingAddress: {
              name: shippingAddr.name as string,
              street: shippingAddr.street as string,
              city: shippingAddr.city as string,
              state: shippingAddr.state as string | undefined,
              zipCode: shippingAddr.zipCode as string,
              country: shippingAddr.country as string,
            },
          }
        );
      }

      this.logger.log(`Seller notifications sent for order ${order.orderNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send seller notifications for order ${orderId}`, error);
    }
  }

  private async trackPurchaseEvent(
    orderId: string,
    userId: string,
    items: CartItemDto[]
  ): Promise<void> {
    try {
      const events = items.map((item) => ({
        userId,
        productId: item.productId,
        shopId: item.shopId,
        action: 'PURCHASE',
      }));

      await this.kafkaProducer.sendAnalyticsEventsBatch(events);
    } catch (error) {
      this.logger.error('Failed to track purchase events', error);
    }
  }

  private async cleanupPaymentSession(sessionId: string): Promise<void> {
    try {
      const redisKey = `payment-session:${sessionId}`;
      await this.redis.del(redisKey);

      await this.prisma.paymentSession.update({
        where: { sessionId },
        data: { status: PaymentStatus.COMPLETED },
      });
    } catch (error) {
      this.logger.error('Failed to cleanup payment session', error);
    }
  }

  async getUserOrders(userId: string): Promise<Record<string, unknown>[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  async getOrderById(
    userId: string,
    orderId: string
  ): Promise<Record<string, unknown>> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, payouts: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getOrderByNumber(
    userId: string,
    orderNumber: string
  ): Promise<Record<string, unknown>> {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, userId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
