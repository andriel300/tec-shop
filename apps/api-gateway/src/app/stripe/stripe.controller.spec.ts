import { Test, TestingModule } from '@nestjs/testing';
import { StripeController } from './stripe.controller';
import { ClientProxy } from '@nestjs/microservices';
import { BadRequestException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import type { Response } from 'express';

describe('StripeController', () => {
  let controller: StripeController;
  let sellerServiceClient: ClientProxy;

  const mockRequest = (userId: string, userType: string) => ({
    user: { userId, userType },
  });

  const mockResponse = () => {
    const res: Partial<Response> = {
      redirect: jest.fn(),
    };
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        {
          provide: 'SELLER_SERVICE',
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StripeController>(StripeController);
    sellerServiceClient = module.get<ClientProxy>('SELLER_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOnboardingLink', () => {
    it('should create Stripe onboarding link for seller', async () => {
      // Arrange
      const req = mockRequest('seller-auth-123', 'SELLER');
      const expectedResponse = {
        url: 'https://connect.stripe.com/setup/s/acct_123',
        expires_at: Date.now() + 3600000,
      };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.createOnboardingLink(req as never);

      // Assert
      expect(sellerServiceClient.send).toHaveBeenCalledWith('stripe-create-connect-account', 'seller-auth-123');
      expect(result).toEqual(expectedResponse);
    });

    it('should reject non-seller users', async () => {
      // Arrange
      const req = mockRequest('customer-auth-123', 'CUSTOMER');

      // Act & Assert
      await expect(controller.createOnboardingLink(req as never)).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.createOnboardingLink(req as never)).rejects.toThrow(
        'Only sellers can access Stripe onboarding'
      );
    });

    it('should propagate errors from seller-service', async () => {
      // Arrange
      const req = mockRequest('seller-auth-123', 'SELLER');

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Seller not found'))
      );

      // Act & Assert
      await expect(controller.createOnboardingLink(req as never)).rejects.toThrow('Seller not found');
    });
  });

  describe('getAccountStatus', () => {
    it('should retrieve Stripe account status for seller', async () => {
      // Arrange
      const req = mockRequest('seller-auth-123', 'SELLER');
      const expectedStatus = {
        status: 'COMPLETE',
        canAcceptPayments: true,
        requiresAction: false,
        requirements: [],
      };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedStatus));

      // Act
      const result = await controller.getAccountStatus(req as never);

      // Assert
      expect(sellerServiceClient.send).toHaveBeenCalledWith('stripe-get-account-status', 'seller-auth-123');
      expect(result).toEqual(expectedStatus);
    });

    it('should reject non-seller users', async () => {
      // Arrange
      const req = mockRequest('customer-auth-123', 'CUSTOMER');

      // Act & Assert
      await expect(controller.getAccountStatus(req as never)).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.getAccountStatus(req as never)).rejects.toThrow(
        'Only sellers can check Stripe status'
      );
    });

    it('should handle incomplete onboarding status', async () => {
      // Arrange
      const req = mockRequest('seller-auth-123', 'SELLER');
      const expectedStatus = {
        status: 'INCOMPLETE',
        canAcceptPayments: false,
        requiresAction: true,
        requirements: ['external_account', 'tos_acceptance'],
      };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedStatus));

      // Act
      const result = await controller.getAccountStatus(req as never);

      // Assert
      expect(result.status).toBe('INCOMPLETE');
      expect(result.requiresAction).toBe(true);
      expect(result.requirements).toHaveLength(2);
    });
  });

  describe('handleOnboardingReturn', () => {
    it('should redirect to success page on valid return', async () => {
      // Arrange
      const authId = 'seller-auth-123';
      const state = 'valid-state-token';
      const res = mockResponse();
      const expectedResult = { success: true };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedResult));

      // Act
      await controller.handleOnboardingReturn(authId, state, res);

      // Assert
      expect(sellerServiceClient.send).toHaveBeenCalledWith('stripe-handle-connect-return', {
        authId,
        state,
      });
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/signup?step=3&stripe=success')
      );
    });

    it('should redirect to error page on invalid state', async () => {
      // Arrange
      const authId = 'seller-auth-123';
      const state = 'invalid-state-token';
      const res = mockResponse();
      const expectedResult = { success: false };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedResult));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await controller.handleOnboardingReturn(authId, state, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/signup?step=3&stripe=error')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should throw error when authId is missing', async () => {
      // Arrange
      const authId = '';
      const state = 'valid-state-token';
      const res = mockResponse();

      // Act & Assert
      await expect(controller.handleOnboardingReturn(authId, state, res)).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.handleOnboardingReturn(authId, state, res)).rejects.toThrow(
        'authId and state query parameters are required'
      );
    });

    it('should redirect to error page on service failure', async () => {
      // Arrange
      const authId = 'seller-auth-123';
      const state = 'valid-state-token';
      const res = mockResponse();

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Database error'))
      );
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await controller.handleOnboardingReturn(authId, state, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/signup?step=3&stripe=error')
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleOnboardingRefresh', () => {
    it('should redirect to new onboarding link on valid refresh', async () => {
      // Arrange
      const authId = 'seller-auth-123';
      const state = 'valid-state-token';
      const res = mockResponse();
      const expectedResult = {
        success: true,
        url: 'https://connect.stripe.com/setup/s/acct_new_123',
      };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedResult));

      // Act
      await controller.handleOnboardingRefresh(authId, state, res);

      // Assert
      expect(sellerServiceClient.send).toHaveBeenCalledWith('stripe-handle-connect-refresh', {
        authId,
        state,
      });
      expect(res.redirect).toHaveBeenCalledWith(expectedResult.url);
    });

    it('should redirect to error page when URL is not returned', async () => {
      // Arrange
      const authId = 'seller-auth-123';
      const state = 'valid-state-token';
      const res = mockResponse();
      const expectedResult = { success: true, url: '' };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedResult));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await controller.handleOnboardingRefresh(authId, state, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/signup?step=3&stripe=error')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should throw error when query parameters are missing', async () => {
      // Arrange
      const authId = 'seller-auth-123';
      const state = '';
      const res = mockResponse();

      // Act & Assert
      await expect(controller.handleOnboardingRefresh(authId, state, res)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should redirect to error page on service failure', async () => {
      // Arrange
      const authId = 'seller-auth-123';
      const state = 'valid-state-token';
      const res = mockResponse();

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Service unavailable'))
      );
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await controller.handleOnboardingRefresh(authId, state, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/signup?step=3&stripe=error')
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
