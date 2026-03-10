import { Test, TestingModule } from '@nestjs/testing';
import { StripeWebhookController } from './stripe-webhook.controller';
import { ClientProxy } from '@nestjs/microservices';
import { BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';

describe('StripeWebhookController', () => {
  let controller: StripeWebhookController;
  let sellerServiceClient: ClientProxy;

  const mockRequest = (body: string | Buffer, rawBody?: Buffer): RawBodyRequest<Request> => ({
    body,
    rawBody,
  } as RawBodyRequest<Request>);

  const originalEnv = process.env;

  beforeAll(() => {
    // Set required environment variables for controller initialization
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeWebhookController],
      providers: [
        {
          provide: 'SELLER_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: 'ORDER_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StripeWebhookController>(StripeWebhookController);
    sellerServiceClient = module.get<ClientProxy>('SELLER_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Restore webhook secret after each test in case a test deleted it
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  describe('initialization', () => {
    it('should throw error when STRIPE_SECRET_KEY is missing', () => {
      // Arrange
      const originalKey = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      // Act & Assert
      expect(() => {
        new StripeWebhookController({} as ClientProxy, {} as ClientProxy);
      }).toThrow('STRIPE_SECRET_KEY is required for webhook verification');

      // Cleanup
      process.env.STRIPE_SECRET_KEY = originalKey;
    });
  });

  describe('handleStripeWebhook', () => {
    it('should process valid webhook event', async () => {
      // Arrange
      const mockEvent = {
        id: 'evt_test_123',
        object: 'event',
        type: 'account.updated',
        data: {
          object: {
            id: 'acct_123',
            charges_enabled: true,
            payouts_enabled: true,
          },
        },
      } as Stripe.Event;

      const rawBody = Buffer.from(JSON.stringify(mockEvent));
      const signature = 'test-signature';
      const req = mockRequest(rawBody, rawBody);

      const constructEventSpy = jest.spyOn(controller['stripe'].webhooks, 'constructEvent')
        .mockReturnValue(mockEvent);

      // Act
      const result = await controller.handleStripeWebhook(req, signature);

      // Assert
      expect(constructEventSpy).toHaveBeenCalledWith(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      // Fire-and-forget: sellerService.emit called, not send
      expect(sellerServiceClient.emit).toHaveBeenCalledWith('stripe-webhook', mockEvent);
      // Always returns immediately without waiting for downstream
      expect(result).toEqual({ received: true });

      constructEventSpy.mockRestore();
    });

    it('should return warning when webhook secret is not configured', async () => {
      // Arrange
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const rawBody = Buffer.from('{}');
      const signature = 'test-signature';
      const req = mockRequest(rawBody, rawBody);

      // Act
      const result = await controller.handleStripeWebhook(req, signature);

      // Assert
      expect(result).toEqual({ received: false, message: 'Webhook secret not configured' });
    });

    it('should throw error when stripe signature is missing', async () => {
      // Arrange
      const rawBody = Buffer.from('{}');
      const req = mockRequest(rawBody, rawBody);

      // Act & Assert
      await expect(controller.handleStripeWebhook(req, '')).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.handleStripeWebhook(req, '')).rejects.toThrow(
        'Missing Stripe signature'
      );
    });

    it('should throw error when webhook signature verification fails', async () => {
      // Arrange
      const rawBody = Buffer.from('{}');
      const signature = 'invalid-signature';
      const req = mockRequest(rawBody, rawBody);

      // Mock Stripe webhook verification to throw error
      const constructEventSpy = jest.spyOn(controller['stripe'].webhooks, 'constructEvent')
        .mockImplementation(() => {
          throw new Error('Signature verification failed');
        });

      // Act & Assert
      await expect(controller.handleStripeWebhook(req, signature)).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.handleStripeWebhook(req, signature)).rejects.toThrow(
        'Invalid webhook signature'
      );

      constructEventSpy.mockRestore();
    });

    it('should return received:true immediately regardless of downstream availability', async () => {
      // Arrange — webhook uses fire-and-forget (emit), so downstream errors do not propagate
      const mockEvent = {
        id: 'evt_test_123',
        object: 'event',
        type: 'account.updated',
        data: { object: {} },
      } as Stripe.Event;

      const rawBody = Buffer.from(JSON.stringify(mockEvent));
      const signature = 'test-signature';
      const req = mockRequest(rawBody, rawBody);

      const constructEventSpy = jest.spyOn(controller['stripe'].webhooks, 'constructEvent')
        .mockReturnValue(mockEvent);

      // Act
      const result = await controller.handleStripeWebhook(req, signature);

      // Assert — always returns 200 to Stripe; downstream processes event asynchronously
      expect(sellerServiceClient.emit).toHaveBeenCalledWith('stripe-webhook', mockEvent);
      expect(result).toEqual({ received: true });

      constructEventSpy.mockRestore();
    });

    it('should route seller Connect events to sellerService via emit', async () => {
      // Arrange
      const eventTypes = [
        'account.updated',
        'account.application.deauthorized',
        'capability.updated',
        'person.created',
      ];

      for (const eventType of eventTypes) {
        const mockEvent = {
          id: `evt_${eventType}`,
          object: 'event',
          type: eventType,
          data: { object: {} },
        } as Stripe.Event;

        const rawBody = Buffer.from(JSON.stringify(mockEvent));
        const signature = 'test-signature';
        const req = mockRequest(rawBody, rawBody);

        const constructEventSpy = jest.spyOn(controller['stripe'].webhooks, 'constructEvent')
          .mockReturnValue(mockEvent);

        // Act
        const result = await controller.handleStripeWebhook(req, signature);

        // Assert — fire-and-forget: emit called, always returns { received: true }
        expect(sellerServiceClient.emit).toHaveBeenCalledWith('stripe-webhook', mockEvent);
        expect(result).toEqual({ received: true });

        constructEventSpy.mockRestore();
        jest.clearAllMocks();
      }
    });
  });
});
