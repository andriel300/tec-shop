import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn(),
            sellerSignup: jest.fn(),
            verifyEmail: jest.fn(),
            verifySellerEmail: jest.fn(),
            login: jest.fn(),
            sellerLogin: jest.fn(),
            adminLogin: jest.fn(),
            googleLogin: jest.fn(),
            validateToken: jest.fn(),
            refreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
            forgotPassword: jest.fn(),
            validateResetToken: jest.fn(),
            resetPassword: jest.fn(),
            resetPasswordWithCode: jest.fn(),
            revokeToken: jest.fn(),
            revokeAllUserTokens: jest.fn(),
            changePassword: jest.fn(),
            upgradeToSeller: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------------------------------------------------------------------
  // Customer auth
  // ---------------------------------------------------------------------------

  describe('signup (auth-signup)', () => {
    it('delegates to authService.signup with the payload', async () => {
      const dto = { email: 'a@a.com', password: 'pass', name: 'A', confirmPassword: 'pass', termsAccepted: true };
      const expected = { message: 'ok' };
      jest.spyOn(authService, 'signup').mockResolvedValue(expected);
      expect(await authController.signup(dto as never)).toEqual(expected);
      expect(authService.signup).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifyEmail (auth-verify-email)', () => {
    it('delegates to authService.verifyEmail with the payload', async () => {
      const dto = { email: 'a@a.com', otp: '123456' };
      const expected = { message: 'Email verified successfully.' };
      jest.spyOn(authService, 'verifyEmail').mockResolvedValue(expected);
      expect(await authController.verifyEmail(dto as never)).toEqual(expected);
      expect(authService.verifyEmail).toHaveBeenCalledWith(dto);
    });
  });

  describe('login (auth-login)', () => {
    it('delegates to authService.login with the payload', async () => {
      const dto = { email: 'a@a.com', password: 'pass' };
      const expected = { access_token: 'tok', refresh_token: 'rtok', rememberMe: false };
      jest.spyOn(authService, 'login').mockResolvedValue(expected);
      expect(await authController.login(dto as never)).toEqual(expected);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });

  // ---------------------------------------------------------------------------
  // Seller auth
  // ---------------------------------------------------------------------------

  describe('sellerSignup (seller-auth-signup)', () => {
    it('delegates to authService.sellerSignup with the payload', async () => {
      const dto = { email: 's@s.com', password: 'pass', name: 'S', confirmPassword: 'pass', phoneNumber: '+1', country: 'US', termsAccepted: true };
      const expected = { message: 'ok' };
      jest.spyOn(authService, 'sellerSignup').mockResolvedValue(expected);
      expect(await authController.sellerSignup(dto as never)).toEqual(expected);
      expect(authService.sellerSignup).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifySellerEmail (seller-auth-verify-email)', () => {
    it('delegates to authService.verifySellerEmail with the payload', async () => {
      const dto = { email: 's@s.com', otp: '654321' };
      const expected = { message: 'Seller email verified successfully.' };
      jest.spyOn(authService, 'verifySellerEmail').mockResolvedValue(expected);
      expect(await authController.verifySellerEmail(dto as never)).toEqual(expected);
      expect(authService.verifySellerEmail).toHaveBeenCalledWith(dto);
    });
  });

  describe('sellerLogin (seller-auth-login)', () => {
    it('delegates to authService.sellerLogin with the payload', async () => {
      const dto = { email: 's@s.com', password: 'pass' };
      const expected = { access_token: 'tok', refresh_token: 'rtok', rememberMe: false };
      jest.spyOn(authService, 'sellerLogin').mockResolvedValue(expected);
      expect(await authController.sellerLogin(dto as never)).toEqual(expected);
      expect(authService.sellerLogin).toHaveBeenCalledWith(dto);
    });
  });

  // ---------------------------------------------------------------------------
  // Admin auth
  // ---------------------------------------------------------------------------

  describe('adminLogin (admin-auth-login)', () => {
    it('delegates to authService.adminLogin with the payload', async () => {
      const dto = { email: 'admin@a.com', password: 'pass' };
      const expected = { access_token: 'tok', refresh_token: 'rtok', rememberMe: false };
      jest.spyOn(authService, 'adminLogin').mockResolvedValue(expected);
      expect(await authController.adminLogin(dto as never)).toEqual(expected);
      expect(authService.adminLogin).toHaveBeenCalledWith(dto);
    });
  });

  // ---------------------------------------------------------------------------
  // OAuth
  // ---------------------------------------------------------------------------

  describe('googleLogin (auth-google-login)', () => {
    it('delegates to authService.googleLogin with the payload', async () => {
      const dto = { googleId: 'gid', email: 'g@g.com', name: 'G' };
      const expected = { access_token: 'tok', refresh_token: 'rtok', userId: '1', email: 'g@g.com', createdAt: '' };
      jest.spyOn(authService, 'googleLogin').mockResolvedValue(expected as never);
      expect(await authController.googleLogin(dto as never)).toEqual(expected);
      expect(authService.googleLogin).toHaveBeenCalledWith(dto);
    });
  });

  // ---------------------------------------------------------------------------
  // Token management
  // ---------------------------------------------------------------------------

  describe('validateToken (validate-token)', () => {
    it('delegates to authService.validateToken with the token string', async () => {
      const token = 'jwt-token';
      const expected = { valid: true, userId: '1', role: 'CUSTOMER', iat: 0, exp: 9999999999 };
      jest.spyOn(authService, 'validateToken').mockResolvedValue(expected as never);
      expect(await authController.validateToken(token)).toEqual(expected);
      expect(authService.validateToken).toHaveBeenCalledWith(token);
    });
  });

  describe('refreshToken (auth-refresh-token)', () => {
    it('delegates to authService.refreshToken with refreshToken and currentAccessToken', async () => {
      const payload = { refreshToken: 'rtoken', currentAccessToken: 'atoken' };
      const expected = { access_token: 'new', refresh_token: 'rnew', userId: '1', email: 'a@a.com', createdAt: '' };
      jest.spyOn(authService, 'refreshToken').mockResolvedValue(expected as never);
      expect(await authController.refreshToken(payload)).toEqual(expected);
      expect(authService.refreshToken).toHaveBeenCalledWith(payload.refreshToken, payload.currentAccessToken);
    });
  });

  describe('revokeRefreshToken (auth-revoke-refresh-token)', () => {
    it('delegates to authService.revokeRefreshToken with userId', async () => {
      const userId = 'user-1';
      const expected = { message: 'Refresh token revoked successfully' };
      jest.spyOn(authService, 'revokeRefreshToken').mockResolvedValue(expected);
      expect(await authController.revokeRefreshToken(userId)).toEqual(expected);
      expect(authService.revokeRefreshToken).toHaveBeenCalledWith(userId);
    });
  });

  describe('revokeToken (auth-revoke-token)', () => {
    it('delegates to authService.revokeToken with token and reason', async () => {
      const payload = { token: 'tok', reason: 'logout' };
      const expected = { success: true, message: 'Token revoked successfully' };
      jest.spyOn(authService, 'revokeToken').mockResolvedValue(expected);
      expect(await authController.revokeToken(payload)).toEqual(expected);
      expect(authService.revokeToken).toHaveBeenCalledWith(payload.token, payload.reason);
    });
  });

  describe('revokeAllUserTokens (auth-revoke-all-user-tokens)', () => {
    it('delegates to authService.revokeAllUserTokens with userId and reason', async () => {
      const payload = { userId: 'user-1', reason: 'security_event' };
      const expected = { message: 'All user tokens revoked successfully', revocationTime: 1000 };
      jest.spyOn(authService, 'revokeAllUserTokens').mockResolvedValue(expected);
      expect(await authController.revokeAllUserTokens(payload)).toEqual(expected);
      expect(authService.revokeAllUserTokens).toHaveBeenCalledWith(payload.userId, payload.reason);
    });
  });

  // ---------------------------------------------------------------------------
  // Password management
  // ---------------------------------------------------------------------------

  describe('forgotPassword (auth-forgot-password)', () => {
    it('delegates to authService.forgotPassword with the payload', async () => {
      const dto = { email: 'a@a.com' };
      const expected = { message: 'If an account with this email exists, you will receive a password reset link.' };
      jest.spyOn(authService, 'forgotPassword').mockResolvedValue(expected);
      expect(await authController.forgotPassword(dto as never)).toEqual(expected);
      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('validateResetToken (auth-validate-reset-token)', () => {
    it('delegates to authService.validateResetToken with the payload', async () => {
      const dto = { token: 'reset-token' };
      const expected = { valid: true, email: 'a@a.com' };
      jest.spyOn(authService, 'validateResetToken').mockResolvedValue(expected);
      expect(await authController.validateResetToken(dto as never)).toEqual(expected);
      expect(authService.validateResetToken).toHaveBeenCalledWith(dto);
    });
  });

  describe('resetPassword (auth-reset-password)', () => {
    it('delegates to authService.resetPassword with the payload', async () => {
      const dto = { token: 'reset-token', newPassword: 'NewPass123!' };
      const expected = { message: 'Password has been reset successfully.' };
      jest.spyOn(authService, 'resetPassword').mockResolvedValue(expected);
      expect(await authController.resetPassword(dto as never)).toEqual(expected);
      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('resetPasswordWithCode (auth-reset-password-with-code)', () => {
    it('delegates to authService.resetPasswordWithCode with the payload', async () => {
      const dto = { email: 'a@a.com', code: '123456', newPassword: 'NewPass123!' };
      const expected = { message: 'Password has been reset successfully.' };
      jest.spyOn(authService, 'resetPasswordWithCode').mockResolvedValue(expected as never);
      expect(await authController.resetPasswordWithCode(dto as never)).toEqual(expected);
      expect(authService.resetPasswordWithCode).toHaveBeenCalledWith(dto);
    });
  });

  // ---------------------------------------------------------------------------
  // Account management
  // ---------------------------------------------------------------------------

  describe('changePassword (auth-change-password)', () => {
    it('delegates to authService.changePassword with userId and changePasswordDto', async () => {
      const payload = { userId: 'user-1', changePasswordDto: { currentPassword: 'old', newPassword: 'new', confirmPassword: 'new' } };
      const expected = { message: 'Password changed successfully' };
      jest.spyOn(authService, 'changePassword').mockResolvedValue(expected as never);
      expect(await authController.changePassword(payload as never)).toEqual(expected);
      expect(authService.changePassword).toHaveBeenCalledWith(payload.userId, payload.changePasswordDto);
    });
  });

  describe('upgradeToSeller (auth-upgrade-to-seller)', () => {
    it('delegates to authService.upgradeToSeller with userId and upgradeDto', async () => {
      const payload = { userId: 'user-1', upgradeDto: { phoneNumber: '+1', country: 'US' } };
      const expected = { message: 'Account upgraded to seller' };
      jest.spyOn(authService, 'upgradeToSeller').mockResolvedValue(expected as never);
      expect(await authController.upgradeToSeller(payload as never)).toEqual(expected);
      expect(authService.upgradeToSeller).toHaveBeenCalledWith(payload.userId, payload.upgradeDto);
    });
  });
});
