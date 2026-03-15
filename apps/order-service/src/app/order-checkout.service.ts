import { randomBytes } from 'crypto';
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@tec-shop/order-client';
import { OrderPrismaService } from '../prisma/prisma.service';
import { RedisService } from '@tec-shop/redis-client';
import { EmailService } from './email/email.service';
import { PaymentService } from '../services/payment.service';
import { KafkaProducerService } from '../services/kafka-producer.service';
import { UserServiceClient } from '../clients/user.client';
import { SellerServiceClient } from '../clients/seller.client';
import { ProductServiceClient } from '../clients/product.client';
import { NotificationProducerService } from '@tec-shop/notification-producer';
import {
  CartItemDto,
  CreateCheckoutSessionDto,
  OrderStatus,
  PaymentStatus,
} from '@tec-shop/dto';

@Injectable()
export class OrderCheckoutService {
  private readonly logger = new Logger(OrderCheckoutService.name);
  private readonly SESSION_EXPIRE_SECONDS = 30 * 60; // 30 minutes

  constructor(
    private readonly prisma: OrderPrismaService,
    private readonly redis: RedisService,
    private readonly emailService: EmailService,
    private readonly paymentService: PaymentService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly userClient: UserServiceClient,
    private readonly sellerClient: SellerServiceClient,
    private readonly productClient: ProductServiceClient,
    private readonly notificationProducer: NotificationProducerService
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

    // Fetch authoritative prices from product-service (never trust client-supplied unitPrice)
    const productIds = [...new Set(data.items.map((item) => item.productId))];
    const products = await this.productClient.getProductsByIds(productIds);

    if (products.length === 0) {
      throw new BadRequestException('Could not verify product prices. Please try again.');
    }

    const productMap = new Map(
      products.map((p) => [p['id'] as string, p])
    );

    const resolvedItems = data.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found or unavailable`);
      }

      let authoritativePrice: number;

      if (item.variantId) {
        const variants = product['variants'] as Array<{
          id: string;
          price: number;
          salePrice: number | null;
          isActive: boolean;
        }>;
        const variant = variants?.find((v) => v.id === item.variantId && v.isActive);
        if (!variant) {
          throw new BadRequestException(`Product variant ${item.variantId} not found or unavailable`);
        }
        authoritativePrice = Math.round((variant.salePrice ?? variant.price) * 100);
      } else {
        const price = product['price'] as number;
        const salePrice = product['salePrice'] as number | null;
        authoritativePrice = Math.round((salePrice ?? price) * 100);
      }

      return { ...item, unitPrice: authoritativePrice };
    });

    // Calculate amounts using server-fetched prices
    const subtotalAmount = resolvedItems.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0
    );

    let discountAmount = 0;

    // Verify and apply coupon if provided
    if (data.couponCode) {
      const couponValidation = await this.verifyCoupon(
        data.couponCode,
        resolvedItems
      );
      if (couponValidation.isValid) {
        discountAmount = couponValidation.discountAmount;
      }
    }

    // Calculate shipping cost (simple flat rate for now)
    const shippingCost = 1000; // $10.00 in cents

    // Calculate platform fee (10% of subtotal)
    const platformFee =
      this.paymentService.calculatePlatformFee(subtotalAmount);

    // Calculate final amount
    const finalAmount = subtotalAmount - discountAmount + shippingCost;

    // Create Stripe checkout session
    const session = await this.paymentService.createCheckoutSession({
      userId,
      items: resolvedItems,
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
      cartData: resolvedItems,
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

    this.logger.log(
      `Checkout session created for user ${userId}: ${session.sessionId}`
    );

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
        cartData: data.cartData as unknown as Prisma.InputJsonValue,
        shippingAddressId: data.shippingAddressId,
        shippingAddress: data.shippingAddress as unknown as Prisma.InputJsonValue,
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
    try {
      // Transform cart items to format expected by seller-service
      const cartItems = items.map((item) => ({
        productId: item.productId,
        sellerId: item.sellerId,
        subtotal: item.unitPrice * item.quantity,
      }));

      // Call seller-service to verify coupon
      const result = (await this.sellerClient.verifyCouponCode(
        couponCode,
        cartItems
      )) as {
        valid: boolean;
        discountAmount?: number;
        message?: string;
      };

      if (result && result.valid) {
        this.logger.log(
          `Coupon ${couponCode} verified: Discount amount = ${result.discountAmount} cents`
        );
        return {
          isValid: true,
          discountAmount: result.discountAmount || 0, // Amount in cents
        };
      }

      this.logger.warn(
        `Coupon ${couponCode} verification failed: ${result?.message || 'Unknown error'}`
      );
      return { isValid: false, discountAmount: 0 };
    } catch (error) {
      this.logger.error(`Error verifying coupon ${couponCode}:`, error);
      return { isValid: false, discountAmount: 0 };
    }
  }

  async handleSuccessfulPayment(
    sessionId: string
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Processing successful payment for session: ${sessionId}`);

    const sessionData = await this.getPaymentSession(sessionId);
    if (!sessionData) {
      throw new NotFoundException('Payment session not found');
    }

    const stripeSession = await this.paymentService.getCheckoutSession(sessionId);
    if (stripeSession.payment_status !== 'paid') {
      throw new BadRequestException('Payment not completed');
    }

    const existingOrder = await this.prisma.order.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (existingOrder) {
      this.logger.warn(`Order already exists for session ${sessionId}`);
      return existingOrder;
    }

    const cartData = sessionData.cartData as unknown as CartItemDto[];
    const shippingAddress = sessionData.shippingAddress as unknown as Prisma.InputJsonValue;
    const sellerGroups = this.groupItemsBySeller(cartData);

    // Pre-fetch seller Stripe accounts before the transaction (network calls
    // must not run inside a DB transaction)
    const sellerAccountMap = await this.fetchSellerAccounts(sellerGroups);

    // Atomically create the Order, its OrderItems, and all SellerPayout records.
    // Requires MongoDB replica set (Atlas or self-hosted RS) for multi-document transactions.
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          userId: sessionData.userId as string,
          shippingAddressId: sessionData.shippingAddressId as string,
          shippingAddress,
          stripeSessionId: sessionId,
          stripePaymentId: stripeSession.payment_intent as string,
          paymentMethod: 'card',
          subtotalAmount: sessionData.subtotalAmount as number,
          discountAmount: sessionData.discountAmount as number,
          shippingCost: sessionData.shippingCost as number,
          platformFee: sessionData.platformFee as number,
          finalAmount: sessionData.finalAmount as number,
          couponCode: sessionData.couponCode as string | undefined,
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.COMPLETED,
          items: {
            create: cartData.map((item: CartItemDto) => {
              const { platformFee, sellerPayout } =
                this.paymentService.calculateSellerPayout(item.unitPrice * item.quantity);
              return {
                sellerId: item.sellerId,
                shopId: item.shopId,
                shopName: '',
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
        include: { items: true },
      });

      for (const [sellerId, items] of Object.entries(sellerGroups)) {
        const account = sellerAccountMap.get(sellerId);
        if (!account) {
          this.logger.error(`Seller ${sellerId} has no Stripe account — skipping payout record`);
          continue;
        }
        const totalAmount = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
        const { platformFee, sellerPayout } = this.paymentService.calculateSellerPayout(totalAmount);
        await tx.sellerPayout.create({
          data: {
            orderId: created.id,
            sellerId,
            shopId: items[0].shopId,
            stripeAccountId: account,
            totalAmount,
            platformFee,
            payoutAmount: sellerPayout,
            status: 'PENDING',
          },
        });
      }

      // Write outbox event atomically with the order — ensures side-effects
      // are never lost even if the process crashes before they run.
      await tx.outboxEvent.create({
        data: {
          aggregateId: created.id,
          eventType: 'order.created',
          payload: {
            orderId: created.id,
            userId: sessionData.userId as string,
            cartData: cartData as unknown as Prisma.InputJsonValue,
          },
        },
      });

      return created;
    });

    void this.cleanupPaymentSession(sessionId);

    this.logger.log(`Order created: ${(order as Record<string, unknown>).orderNumber as string}`);
    return order;
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processOutbox(): Promise<void> {
    const events = await this.prisma.outboxEvent.findMany({
      where: { processedAt: null },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    for (const event of events) {
      try {
        if (event.eventType === 'order.created') {
          const payload = event.payload as unknown as { orderId: string; userId: string; cartData: CartItemDto[] };
          await this.sendOrderConfirmationEmail(payload.orderId);
          await this.sendSellerNotifications(payload.orderId);
          await this.trackPurchaseEvent(payload.orderId, payload.userId, payload.cartData);
          await this.sendOrderPaidNotification(payload.orderId, payload.userId);
        }
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date() },
        });
      } catch (error) {
        this.logger.error(`Outbox processing failed for event ${event.id}`, error);
      }
    }
  }

  private async getPaymentSession(
    sessionId: string
  ): Promise<Record<string, unknown> | null> {
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

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private groupItemsBySeller(items: CartItemDto[]): Record<string, CartItemDto[]> {
    return items.reduce((acc, item) => {
      if (!acc[item.sellerId]) acc[item.sellerId] = [];
      acc[item.sellerId].push(item);
      return acc;
    }, {} as Record<string, CartItemDto[]>);
  }

  private async fetchSellerAccounts(
    sellerGroups: Record<string, CartItemDto[]>
  ): Promise<Map<string, string>> {
    const accountMap = new Map<string, string>();
    for (const sellerId of Object.keys(sellerGroups)) {
      const seller = await this.sellerClient.getSellerByAuthId(sellerId);
      if (seller && seller.stripeAccountId) {
        accountMap.set(sellerId, seller.stripeAccountId as string);
      } else {
        this.logger.error(`Seller ${sellerId} has no Stripe account configured`);
      }
    }
    return accountMap;
  }

  private async executePayoutTransfer(payout: {
    id: string;
    sellerId: string;
    stripeAccountId: string;
    payoutAmount: number;
    orderId: string;
  }): Promise<void> {
    try {
      const transferId = await this.paymentService.createSellerPayout(
        payout.stripeAccountId,
        payout.payoutAmount,
        payout.orderId
      );
      await this.prisma.sellerPayout.update({
        where: { id: payout.id },
        data: { stripeTransferId: transferId, status: 'COMPLETED', processedAt: new Date() },
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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryPendingPayouts(): Promise<void> {
    const payouts = await this.prisma.sellerPayout.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        retryCount: { lt: 3 },
      },
    });

    if (payouts.length === 0) return;

    this.logger.log(`Retrying ${payouts.length} pending/failed payout(s)`);
    for (const payout of payouts) {
      await this.executePayoutTransfer(payout);
    }
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

      this.logger.log(
        `Order confirmation email sent for order ${order.orderNumber}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmation email for order ${orderId}`,
        error
      );
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

      this.logger.log(
        `Seller notifications sent for order ${order.orderNumber}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to send seller notifications for order ${orderId}`,
        error
      );
    }
  }

  private async sendOrderPaidNotification(orderId: string, userId: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return;
      await this.notificationProducer.notifyCustomer(
        userId,
        'order.paid',
        { orderNumber: order.orderNumber },
        { orderId }
      );
    } catch (error) {
      this.logger.warn(
        `Failed to send order paid notification for order ${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
}
