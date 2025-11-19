import { Test, TestingModule } from '@nestjs/testing';
import { StripeWebhookController } from './stripe-webhook.controller';
import { ClientProxy } from '@nestjs/microservices';
import { BadRequestException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
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
            send: jest.fn(),
          },
        },
        {
          provide: 'ORDER_SERVICE',
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StripeWebhookController>(StripeWebhookController);
    sellerServiceClient = module.get<ClientProxy>('SELLER_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      const expectedResult = { received: true, processed: true };

      // Mock Stripe webhook verification
      const constructEventSpy = jest.spyOn(controller['stripe'].webhooks, 'constructEvent')
        .mockReturnValue(mockEvent);

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedResult));

      // Act
      const result = await controller.handleStripeWebhook(req, signature);

      // Assert
      expect(constructEventSpy).toHaveBeenCalledWith(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      expect(sellerServiceClient.send).toHaveBeenCalledWith('stripe-webhook', mockEvent);
      expect(result).toEqual(expectedResult);

      constructEventSpy.mockRestore();
    });

    it('should return warning when webhook secret is not configured', async () => {
      // Arrange
      const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const rawBody = Buffer.from('{}');
      const signature = 'test-signature';
      const req = mockRequest(rawBody, rawBody);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const result = await controller.handleStripeWebhook(req, signature);

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('STRIPE_WEBHOOK_SECRET not configured')
      );
      expect(result).toEqual({ received: false, message: 'Webhook secret not configured' });

      // Cleanup
      process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
      consoleWarnSpy.mockRestore();
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

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(controller.handleStripeWebhook(req, signature)).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.handleStripeWebhook(req, signature)).rejects.toThrow(
        'Invalid webhook signature'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Webhook signature verification failed:',
        expect.any(Error)
      );

      constructEventSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should throw error when webhook processing fails in seller-service', async () => {
      // Arrange
      const mockEvent = {
        id: 'evt_test_123',
        object: 'event',
        type: 'account.updated',
        data: { object: {} },
      } as Stripe.Event;

      const rawBody = Buffer.from(JSON.stringify(mockEvent));
      const signature = 'test-signature';
      const req = mockRequest(rawBody, rawBody);

      // Mock successful verification but failed processing
      const constructEventSpy = jest.spyOn(controller['stripe'].webhooks, 'constructEvent')
        .mockReturnValue(mockEvent);

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Processing failed'))
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(controller.handleStripeWebhook(req, signature)).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.handleStripeWebhook(req, signature)).rejects.toThrow(
        'Webhook processing failed'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Webhook processing failed:',
        expect.any(Error)
      );

      constructEventSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle different Stripe event types', async () => {
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

        jest.spyOn(sellerServiceClient, 'send').mockReturnValue(
          of({ received: true, type: eventType })
        );

        // Act
        const result = await controller.handleStripeWebhook(req, signature);

        // Assert
        expect(sellerServiceClient.send).toHaveBeenCalledWith('stripe-webhook', mockEvent);
        expect(result.type).toBe(eventType);

        constructEventSpy.mockRestore();
        jest.clearAllMocks();
      }
    });
  });
});
