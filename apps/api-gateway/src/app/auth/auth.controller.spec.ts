import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import type { Response, Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceClient: ClientProxy;

  // Mock Response object
  const mockResponse = () => {
    const res: Partial<Response> = {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    return res as Response;
  };

  // Mock Request object
  const mockRequest = (cookies: Record<string, string> = {}, user?: { userId: string }) => {
    const req: Partial<Request & { user: { userId: string } }> = {
      cookies,
      user,
    };
    return req as Request & { user: { userId: string } };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: 'AUTH_SERVICE',
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authServiceClient = module.get<ClientProxy>('AUTH_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should forward signup request to auth-service', async () => {
      // Arrange
      const signupDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        name: 'Test User',
        termsAccepted: true,
      };
      const expectedResponse = { message: 'User registration initiated. Check email for OTP.' };

      jest.spyOn(authServiceClient, 'send').mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.signup(signupDto);

      // Assert
      expect(authServiceClient.send).toHaveBeenCalledWith('auth-signup', signupDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors from auth-service', async () => {
      // Arrange
      const signupDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        name: 'Test User',
        termsAccepted: true,
      };

      jest.spyOn(authServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('User already exists'))
      );

      // Act & Assert
      await expect(controller.signup(signupDto)).rejects.toThrow('User already exists');
    });
  });

  describe('verifyEmail', () => {
    it('should forward verify-email request to auth-service', async () => {
      // Arrange
      const verifyEmailDto = {
        email: 'test@example.com',
        otp: '123456',
      };
      const expectedResponse = { message: 'Email verified successfully' };

      jest.spyOn(authServiceClient, 'send').mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.verifyEmail(verifyEmailDto);

      // Assert
      expect(authServiceClient.send).toHaveBeenCalledWith('auth-verify-email', verifyEmailDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('login', () => {
    it('should set cookies with correct options for normal session', async () => {
      // Arrange
      const loginDto = { email: 'test@example.com', password: 'password', rememberMe: false };
      const authResult = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        rememberMe: false,
      };

      jest.spyOn(authServiceClient, 'send').mockReturnValue(of(authResult));
      const res = mockResponse();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Act
      const result = await controller.login(loginDto, res);

      // Assert
      expect(authServiceClient.send).toHaveBeenCalledWith('auth-login', loginDto);
      expect(res.cookie).toHaveBeenCalledWith('customer_access_token', 'access-token-123', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });
      expect(res.cookie).toHaveBeenCalledWith('customer_refresh_token', 'refresh-token-456', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
      expect(result).toEqual({ message: 'Login successful', userType: 'customer' });

      process.env.NODE_ENV = originalEnv;
    });

    it('should set cookies with extended duration for rememberMe', async () => {
      // Arrange
      const loginDto = { email: 'test@example.com', password: 'password', rememberMe: true };
      const authResult = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        rememberMe: true,
      };

      jest.spyOn(authServiceClient, 'send').mockReturnValue(of(authResult));
      const res = mockResponse();

      // Act
      await controller.login(loginDto, res);

      // Assert
      expect(res.cookie).toHaveBeenCalledWith('customer_access_token', 'access-token-123', expect.objectContaining({
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for remember me
      }));
      expect(res.cookie).toHaveBeenCalledWith('customer_refresh_token', 'refresh-token-456', expect.objectContaining({
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for remember me
      }));
    });

    it('should use secure cookies in production', async () => {
      // Arrange
      const loginDto = { email: 'test@example.com', password: 'password', rememberMe: false };
      const authResult = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        rememberMe: false,
      };

      jest.spyOn(authServiceClient, 'send').mockReturnValue(of(authResult));
      const res = mockResponse();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Act
      await controller.login(loginDto, res);

      // Assert
      expect(res.cookie).toHaveBeenCalledWith('__Host-customer_access_token', 'access-token-123', expect.objectContaining({
        secure: true,
      }));

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens and set new cookies', async () => {
      // Arrange
      const req = mockRequest({
        customer_refresh_token: 'old-refresh-token',
        customer_access_token: 'old-access-token',
      });
      const authResult = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        rememberMe: false,
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date('2024-01-01'),
      };

      jest.spyOn(authServiceClient, 'send').mockReturnValue(of(authResult));
      const res = mockResponse();

      // Act
      const result = await controller.refreshToken(req, res);

      // Assert
      expect(authServiceClient.send).toHaveBeenCalledWith('auth-refresh-token', {
        refreshToken: 'old-refresh-token',
        currentAccessToken: 'old-access-token',
      });
      expect(res.cookie).toHaveBeenCalledWith('customer_access_token', 'new-access-token', expect.any(Object));
      expect(res.cookie).toHaveBeenCalledWith('customer_refresh_token', 'new-refresh-token', expect.any(Object));
      expect(result).toEqual({
        message: 'Token refreshed successfully',
        userType: 'customer',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date('2024-01-01'),
        },
      });
    });

    it('should throw error when refresh token is missing', async () => {
      // Arrange
      const req = mockRequest({});
      const res = mockResponse();

      // Act & Assert
      await expect(controller.refreshToken(req, res)).rejects.toThrow('No refresh token found. Please log in again.');
    });
  });

  describe('logout', () => {
    it('should revoke tokens and clear cookies', async () => {
      // Arrange
      const req = mockRequest({ access_token: 'token-123' }, { userId: 'user-123' });
      const res = mockResponse();

      jest.spyOn(authServiceClient, 'send').mockReturnValue(of({ success: true }));

      // Act
      const result = await controller.logout(req, res);

      // Assert
      expect(authServiceClient.send).toHaveBeenCalledWith('auth-revoke-token', {
        token: 'token-123',
        reason: 'logout',
      });
      expect(authServiceClient.send).toHaveBeenCalledWith('auth-revoke-refresh-token', 'user-123');
      expect(res.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('should clear cookies even if revocation fails', async () => {
      // Arrange
      const req = mockRequest({ access_token: 'token-123' }, { userId: 'user-123' });
      const res = mockResponse();

      jest.spyOn(authServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Revocation failed'))
      );
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await controller.logout(req, res);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledTimes(6); // Clears customer, seller, and legacy cookies
      expect(result).toEqual({ message: 'Logout successful' });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('forgotPassword', () => {
    it('should forward forgot-password request to auth-service', async () => {
      // Arrange
      const forgotPasswordDto = { email: 'test@example.com' };
      const expectedResponse = { message: 'Password reset email sent if account exists' };

      jest.spyOn(authServiceClient, 'send').mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.forgotPassword(forgotPasswordDto);

      // Assert
      expect(authServiceClient.send).toHaveBeenCalledWith('auth-forgot-password', forgotPasswordDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('validateResetToken', () => {
    it('should validate reset token via auth-service', async () => {
      // Arrange
      const validateDto = { token: 'reset-token-123' };
      const expectedResponse = { valid: true, email: 'test@example.com' };

      jest.spyOn(authServiceClient, 'send').mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.validateResetToken(validateDto);

      // Assert
      expect(authServiceClient.send).toHaveBeenCalledWith('auth-validate-reset-token', validateDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('resetPassword', () => {
    it('should reset password via auth-service', async () => {
      // Arrange
      const resetPasswordDto = {
        token: 'reset-token-123',
        newPassword: 'NewSecurePass123!',
      };
      const expectedResponse = { message: 'Password successfully reset' };

      jest.spyOn(authServiceClient, 'send').mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.resetPassword(resetPasswordDto);

      // Assert
      expect(authServiceClient.send).toHaveBeenCalledWith('auth-reset-password', resetPasswordDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('sellerSignup', () => {
    it('should forward seller signup request to auth-service', async () => {
      // Arrange
      const sellerSignupDto = {
        email: 'seller@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        name: 'Test Seller',
        phoneNumber: '+1234567890',
        country: 'US',
        termsAccepted: true,
      };
      const expectedResponse = { message: 'Seller registration initiated' };

      jest.spyOn(authServiceClient, 'send').mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.sellerSignup(sellerSignupDto);

      // Assert
      expect(authServiceClient.send).toHaveBeenCalledWith('seller-auth-signup', sellerSignupDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('verifySellerEmail', () => {
    it('should forward seller email verification to auth-service', async () => {
      // Arrange
      const verifyEmailDto = {
        email: 'seller@example.com',
        otp: '123456',
      };
      const expectedResponse = { message: 'Seller email verified successfully' };

      jest.spyOn(authServiceClient, 'send').mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.verifySellerEmail(verifyEmailDto);

      // Assert
      expect(authServiceClient.send).toHaveBeenCalledWith('seller-auth-verify-email', verifyEmailDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('sellerLogin', () => {
    it('should set cookies for seller login', async () => {
      // Arrange
      const loginDto = { email: 'seller@example.com', password: 'password', rememberMe: false };
      const authResult = {
        access_token: 'seller-access-token',
        refresh_token: 'seller-refresh-token',
        rememberMe: false,
      };

      jest.spyOn(authServiceClient, 'send').mockReturnValue(of(authResult));
      const res = mockResponse();

      // Act
      const result = await controller.sellerLogin(loginDto, res);

      // Assert
      expect(authServiceClient.send).toHaveBeenCalledWith('seller-auth-login', loginDto);
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ message: 'Seller login successful', userType: 'seller' });
    });
  });
});
