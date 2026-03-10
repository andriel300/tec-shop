import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderPrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../services/payment.service';
import { EmailService } from './email/email.service';
import { KafkaProducerService } from '../services/kafka-producer.service';
import { UserServiceClient } from '../clients/user.client';
import { SellerServiceClient } from '../clients/seller.client';
import { ProductServiceClient } from '../clients/product.client';
import { NotificationProducerService } from '@tec-shop/notification-producer';
import type { CartItemDto } from '@tec-shop/dto';
import { RedisService } from '@tec-shop/redis-client';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeCartItem = (overrides: Partial<CartItemDto> = {}): CartItemDto => ({
  productId: 'prod-1',
  sellerId: 'seller-1',
  shopId: 'shop-1',
  productName: 'Test Product',
  productSlug: 'test-product',
  unitPrice: 1000, // $10.00 in cents
  quantity: 2,
  ...overrides,
});

const makeSessionData = (items: CartItemDto[] = [makeCartItem()]) => ({
  sessionId: 'cs_test_123',
  userId: 'user-1',
  cartData: items,
  shippingAddressId: 'addr-1',
  shippingAddress: { name: 'John Doe', street: '123 Main St', city: 'NYC', zipCode: '10001', country: 'US' },
  subtotalAmount: 2000,
  discountAmount: 0,
  shippingCost: 1000,
  platformFee: 200,
  finalAmount: 3000,
});

const makeStripeSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'cs_test_123',
  payment_status: 'paid',
  payment_intent: 'pi_test_abc',
  ...overrides,
});

const makeOrder = (id = 'order-1') => ({
  id,
  orderNumber: 'ORD-ABC123-DEF456',
  userId: 'user-1',
  status: 'PAID',
  items: [],
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = {
  order: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  paymentSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  sellerPayout: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  outboxEvent: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockPaymentService = {
  getCheckoutSession: jest.fn(),
  calculateSellerPayout: jest.fn().mockReturnValue({ platformFee: 200, sellerPayout: 1800 }),
  calculatePlatformFee: jest.fn().mockReturnValue(200),
  createSellerPayout: jest.fn(),
};

const mockEmailService = {
  sendOrderConfirmation: jest.fn(),
  sendSellerOrderNotification: jest.fn(),
};

const mockKafkaProducer = {
  sendAnalyticsEventsBatch: jest.fn(),
};

const mockUserClient = {
  getShippingAddress: jest.fn(),
  getUserProfile: jest.fn(),
};

const mockSellerClient = {
  getSellerByAuthId: jest.fn(),
  verifyCouponCode: jest.fn(),
};

const mockProductClient = {
  getProductsByIds: jest.fn(),
};

const mockNotificationProducer = {
  notifyCustomer: jest.fn(),
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: OrderPrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: KafkaProducerService, useValue: mockKafkaProducer },
        { provide: UserServiceClient, useValue: mockUserClient },
        { provide: SellerServiceClient, useValue: mockSellerClient },
        { provide: ProductServiceClient, useValue: mockProductClient },
        { provide: NotificationProducerService, useValue: mockNotificationProducer },
      ],
    }).compile();

    service = module.get(OrderService);
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // generateOrderNumber (private — accessed via bracket notation)
  // -------------------------------------------------------------------------

  describe('generateOrderNumber', () => {
    it('should return a string matching ORD-<timestamp>-<hex> format', () => {
      const orderNumber = service['generateOrderNumber']();

      expect(orderNumber).toMatch(/^ORD-[A-Z0-9]+-[A-F0-9]{6}$/);
    });

    it('should produce unique values on successive calls', () => {
      const numbers = new Set(
        Array.from({ length: 20 }, () => service['generateOrderNumber']())
      );

      expect(numbers.size).toBe(20);
    });
  });

  // -------------------------------------------------------------------------
  // groupItemsBySeller (private)
  // -------------------------------------------------------------------------

  describe('groupItemsBySeller', () => {
    it('should group items by their sellerId', () => {
      const items = [
        makeCartItem({ sellerId: 'seller-1', productId: 'p1' }),
        makeCartItem({ sellerId: 'seller-2', productId: 'p2' }),
        makeCartItem({ sellerId: 'seller-1', productId: 'p3' }),
      ];

      const groups = service['groupItemsBySeller'](items);

      expect(Object.keys(groups)).toHaveLength(2);
      expect(groups['seller-1']).toHaveLength(2);
      expect(groups['seller-2']).toHaveLength(1);
    });

    it('should return an empty object for an empty array', () => {
      expect(service['groupItemsBySeller']([])).toEqual({});
    });

    it('should return a single group when all items share one seller', () => {
      const items = [
        makeCartItem({ productId: 'p1' }),
        makeCartItem({ productId: 'p2' }),
      ];

      const groups = service['groupItemsBySeller'](items);

      expect(Object.keys(groups)).toHaveLength(1);
      expect(groups['seller-1']).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // createCheckoutSession
  // -------------------------------------------------------------------------

  describe('createCheckoutSession', () => {
    it('should throw BadRequestException when cart is empty', async () => {
      await expect(
        service.createCheckoutSession('user-1', { items: [], shippingAddressId: 'addr-1' } as never)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when shipping address is not found', async () => {
      mockUserClient.getShippingAddress.mockResolvedValueOnce(null);

      await expect(
        service.createCheckoutSession('user-1', {
          items: [makeCartItem()],
          shippingAddressId: 'addr-1',
        } as never)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when products cannot be verified', async () => {
      mockUserClient.getShippingAddress.mockResolvedValueOnce({ street: '123 Main' });
      mockProductClient.getProductsByIds.mockResolvedValueOnce([]);

      await expect(
        service.createCheckoutSession('user-1', {
          items: [makeCartItem()],
          shippingAddressId: 'addr-1',
        } as never)
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------------------------------------------------------------
  // handleSuccessfulPayment
  // -------------------------------------------------------------------------

  describe('handleSuccessfulPayment', () => {
    const sessionId = 'cs_test_123';
    const sessionData = makeSessionData();
    const stripeSession = makeStripeSession();
    const createdOrder = makeOrder();

    const txMock = {
      order: { create: jest.fn().mockResolvedValue(createdOrder) },
      sellerPayout: { create: jest.fn().mockResolvedValue({}) },
      outboxEvent: { create: jest.fn().mockResolvedValue({}) },
    };

    beforeEach(() => {
      // Session found in Redis
      mockRedis.get.mockResolvedValue(JSON.stringify(sessionData));
      // Stripe says payment is paid
      mockPaymentService.getCheckoutSession.mockResolvedValue(stripeSession);
      // No existing order (idempotency check)
      mockPrisma.order.findUnique.mockResolvedValue(null);
      // Seller has a Stripe account
      mockSellerClient.getSellerByAuthId.mockResolvedValue({ stripeAccountId: 'acct_seller1' });
      // Transaction executes the callback
      mockPrisma.$transaction.mockImplementation((fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock));
    });

    it('should create an order with items and outbox event in a single transaction', async () => {
      await service.handleSuccessfulPayment(sessionId);

      expect(txMock.order.create).toHaveBeenCalledTimes(1);
      expect(txMock.sellerPayout.create).toHaveBeenCalledTimes(1);
      expect(txMock.outboxEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'order.created',
            aggregateId: createdOrder.id,
          }),
        })
      );
    });

    it('should return the existing order without re-creating if one already exists (idempotency)', async () => {
      const existingOrder = makeOrder('existing-order-id');
      mockPrisma.order.findUnique.mockResolvedValueOnce(existingOrder);

      const result = await service.handleSuccessfulPayment(sessionId);

      expect(result).toEqual(existingOrder);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when payment session is not found', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.paymentSession.findUnique.mockResolvedValueOnce(null);

      await expect(service.handleSuccessfulPayment(sessionId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when Stripe payment_status is not paid', async () => {
      mockPaymentService.getCheckoutSession.mockResolvedValueOnce(
        makeStripeSession({ payment_status: 'unpaid' })
      );

      await expect(service.handleSuccessfulPayment(sessionId)).rejects.toThrow(BadRequestException);
    });

    it('should include a SellerPayout record for each seller in the transaction', async () => {
      const items = [
        makeCartItem({ sellerId: 'seller-1', productId: 'p1' }),
        makeCartItem({ sellerId: 'seller-2', productId: 'p2' }),
      ];
      const multiSellerSession = makeSessionData(items);
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(multiSellerSession));
      mockSellerClient.getSellerByAuthId
        .mockResolvedValueOnce({ stripeAccountId: 'acct_s1' })
        .mockResolvedValueOnce({ stripeAccountId: 'acct_s2' });

      await service.handleSuccessfulPayment(sessionId);

      expect(txMock.sellerPayout.create).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // processOutbox
  // -------------------------------------------------------------------------

  describe('processOutbox', () => {
    it('should mark each processed event with a processedAt timestamp', async () => {
      const events = [
        { id: 'evt-1', eventType: 'order.created', payload: { orderId: 'order-1', userId: 'user-1', cartData: [] } },
        { id: 'evt-2', eventType: 'order.created', payload: { orderId: 'order-2', userId: 'user-2', cartData: [] } },
      ];

      mockPrisma.outboxEvent.findMany.mockResolvedValue(events);
      // Side-effect mocks used inside processOutbox
      mockPrisma.order.findUnique.mockResolvedValue(null);
      mockPrisma.outboxEvent.update.mockResolvedValue({});

      await service.processOutbox();

      expect(mockPrisma.outboxEvent.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'evt-1' },
          data: expect.objectContaining({ processedAt: expect.any(Date) }),
        })
      );
    });

    it('should skip events where processedAt is already set (only fetches null)', async () => {
      mockPrisma.outboxEvent.findMany.mockResolvedValue([]);

      await service.processOutbox();

      expect(mockPrisma.outboxEvent.update).not.toHaveBeenCalled();
      expect(mockPrisma.outboxEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { processedAt: null },
        })
      );
    });

    it('should continue processing remaining events when one fails', async () => {
      const events = [
        { id: 'evt-fail', eventType: 'order.created', payload: { orderId: 'order-fail', userId: 'user-1', cartData: [] } },
        { id: 'evt-ok', eventType: 'order.created', payload: { orderId: 'order-ok', userId: 'user-2', cartData: [] } },
      ];

      mockPrisma.outboxEvent.findMany.mockResolvedValue(events);
      mockPrisma.order.findUnique.mockResolvedValue(null);
      // First update throws, second succeeds
      mockPrisma.outboxEvent.update
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({});

      await expect(service.processOutbox()).resolves.not.toThrow();

      // Second event still updated despite first failing
      expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'evt-ok' } })
      );
    });
  });
});
