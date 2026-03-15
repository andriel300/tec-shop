import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthCoreService } from './auth-core.service';
import { AuthRegistrationService } from './auth-registration.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authCore: AuthCoreService;
  let authRegistration: AuthRegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthCoreService,
          useValue: {
            login: jest.fn(),
            sellerLogin: jest.fn(),
            adminLogin: jest.fn(),
            googleLogin: jest.fn(),
            validateToken: jest.fn(),
            refreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
            revokeToken: jest.fn(),
            revokeAllUserTokens: jest.fn(),
            changePassword: jest.fn(),
            upgradeToSeller: jest.fn(),
          },
        },
        {
          provide: AuthRegistrationService,
          useValue: {
            signup: jest.fn(),
            sellerSignup: jest.fn(),
            verifyEmail: jest.fn(),
            verifySellerEmail: jest.fn(),
            forgotPassword: jest.fn(),
            validateResetToken: jest.fn(),
            resetPassword: jest.fn(),
            resetPasswordWithCode: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authCore = module.get<AuthCoreService>(AuthCoreService);
    authRegistration = module.get<AuthRegistrationService>(AuthRegistrationService);
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------------------------------------------------------------------
  // Customer auth
  // ---------------------------------------------------------------------------

  describe('signup (auth-signup)', () => {
    it('delegates to authRegistration.signup with the payload', async () => {
      const dto = { email: 'a@a.com', password: 'pass', name: 'A', confirmPassword: 'pass', termsAccepted: true };
      const expected = { message: 'ok' };
      jest.spyOn(authRegistration, 'signup').mockResolvedValue(expected);
      expect(await authController.signup(dto as never)).toEqual(expected);
      expect(authRegistration.signup).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifyEmail (auth-verify-email)', () => {
    it('delegates to authRegistration.verifyEmail with the payload', async () => {
      const dto = { email: 'a@a.com', otp: '123456' };
      const expected = { message: 'Email verified successfully.' };
      jest.spyOn(authRegistration, 'verifyEmail').mockResolvedValue(expected);
      expect(await authController.verifyEmail(dto as never)).toEqual(expected);
      expect(authRegistration.verifyEmail).toHaveBeenCalledWith(dto);
    });
  });

  describe('login (auth-login)', () => {
    it('delegates to authCore.login with the payload', async () => {
      const dto = { email: 'a@a.com', password: 'pass' };
      const expected = { access_token: 'tok', refresh_token: 'rtok', rememberMe: false };
      jest.spyOn(authCore, 'login').mockResolvedValue(expected);
      expect(await authController.login(dto as never)).toEqual(expected);
      expect(authCore.login).toHaveBeenCalledWith(dto);
    });
  });

  // ---------------------------------------------------------------------------
  // Seller auth
  // ---------------------------------------------------------------------------

  describe('sellerSignup (seller-auth-signup)', () => {
    it('delegates to authRegistration.sellerSignup with the payload', async () => {
      const dto = { email: 's@s.com', password: 'pass', name: 'S', confirmPassword: 'pass', phoneNumber: '+1', country: 'US', termsAccepted: true };
      const expected = { message: 'ok' };
      jest.spyOn(authRegistration, 'sellerSignup').mockResolvedValue(expected);
      expect(await authController.sellerSignup(dto as never)).toEqual(expected);
      expect(authRegistration.sellerSignup).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifySellerEmail (seller-auth-verify-email)', () => {
    it('delegates to authRegistration.verifySellerEmail with the payload', async () => {
      const dto = { email: 's@s.com', otp: '654321' };
      const expected = { message: 'Seller email verified successfully.' };
      jest.spyOn(authRegistration, 'verifySellerEmail').mockResolvedValue(expected);
      expect(await authController.verifySellerEmail(dto as never)).toEqual(expected);
      expect(authRegistration.verifySellerEmail).toHaveBeenCalledWith(dto);
    });
  });

  describe('sellerLogin (seller-auth-login)', () => {
    it('delegates to authCore.sellerLogin with the payload', async () => {
      const dto = { email: 's@s.com', password: 'pass' };
      const expected = { access_token: 'tok', refresh_token: 'rtok', rememberMe: false };
      jest.spyOn(authCore, 'sellerLogin').mockResolvedValue(expected);
      expect(await authController.sellerLogin(dto as never)).toEqual(expected);
      expect(authCore.sellerLogin).toHaveBeenCalledWith(dto);
    });
  });

  // ---------------------------------------------------------------------------
  // Admin auth
  // ---------------------------------------------------------------------------

  describe('adminLogin (admin-auth-login)', () => {
    it('delegates to authCore.adminLogin with the payload', async () => {
      const dto = { email: 'admin@a.com', password: 'pass' };
      const expected = { access_token: 'tok', refresh_token: 'rtok', rememberMe: false };
      jest.spyOn(authCore, 'adminLogin').mockResolvedValue(expected);
      expect(await authController.adminLogin(dto as never)).toEqual(expected);
      expect(authCore.adminLogin).toHaveBeenCalledWith(dto);
    });
  });

  // ---------------------------------------------------------------------------
  // OAuth
  // ---------------------------------------------------------------------------

  describe('googleLogin (auth-google-login)', () => {
    it('delegates to authCore.googleLogin with the payload', async () => {
      const dto = { googleId: 'gid', email: 'g@g.com', name: 'G' };
      const expected = { access_token: 'tok', refresh_token: 'rtok', userId: '1', email: 'g@g.com', createdAt: '' };
      jest.spyOn(authCore, 'googleLogin').mockResolvedValue(expected as never);
      expect(await authController.googleLogin(dto as never)).toEqual(expected);
      expect(authCore.googleLogin).toHaveBeenCalledWith(dto);
    });
  });

  // ---------------------------------------------------------------------------
  // Token management
  // ---------------------------------------------------------------------------

  describe('validateToken (validate-token)', () => {
    it('delegates to authCore.validateToken with the token string', async () => {
      const token = 'jwt-token';
      const expected = { valid: true, userId: '1', role: 'CUSTOMER', iat: 0, exp: 9999999999 };
      jest.spyOn(authCore, 'validateToken').mockResolvedValue(expected as never);
      expect(await authController.validateToken(token)).toEqual(expected);
      expect(authCore.validateToken).toHaveBeenCalledWith(token);
    });
  });

  describe('refreshToken (auth-refresh-token)', () => {
    it('delegates to authCore.refreshToken with refreshToken and currentAccessToken', async () => {
      const payload = { refreshToken: 'rtoken', currentAccessToken: 'atoken' };
      const expected = { access_token: 'new', refresh_token: 'rnew', userId: '1', email: 'a@a.com', createdAt: '' };
      jest.spyOn(authCore, 'refreshToken').mockResolvedValue(expected as never);
      expect(await authController.refreshToken(payload)).toEqual(expected);
      expect(authCore.refreshToken).toHaveBeenCalledWith(payload.refreshToken, payload.currentAccessToken);
    });
  });

  describe('revokeRefreshToken (auth-revoke-refresh-token)', () => {
    it('delegates to authCore.revokeRefreshToken with userId', async () => {
      const userId = 'user-1';
      const expected = { message: 'Refresh token revoked successfully' };
      jest.spyOn(authCore, 'revokeRefreshToken').mockResolvedValue(expected);
      expect(await authController.revokeRefreshToken(userId)).toEqual(expected);
      expect(authCore.revokeRefreshToken).toHaveBeenCalledWith(userId);
    });
  });

  describe('revokeToken (auth-revoke-token)', () => {
    it('delegates to authCore.revokeToken with token and reason', async () => {
      const payload = { token: 'tok', reason: 'logout' };
      const expected = { success: true, message: 'Token revoked successfully' };
      jest.spyOn(authCore, 'revokeToken').mockResolvedValue(expected);
      expect(await authController.revokeToken(payload)).toEqual(expected);
      expect(authCore.revokeToken).toHaveBeenCalledWith(payload.token, payload.reason);
    });
  });

  describe('revokeAllUserTokens (auth-revoke-all-user-tokens)', () => {
    it('delegates to authCore.revokeAllUserTokens with userId and reason', async () => {
      const payload = { userId: 'user-1', reason: 'security_event' };
      const expected = { message: 'All user tokens revoked successfully', revocationTime: 1000 };
      jest.spyOn(authCore, 'revokeAllUserTokens').mockResolvedValue(expected);
      expect(await authController.revokeAllUserTokens(payload)).toEqual(expected);
      expect(authCore.revokeAllUserTokens).toHaveBeenCalledWith(payload.userId, payload.reason);
    });
  });

  // ---------------------------------------------------------------------------
  // Password management
  // ---------------------------------------------------------------------------

  describe('forgotPassword (auth-forgot-password)', () => {
    it('delegates to authRegistration.forgotPassword with the payload', async () => {
      const dto = { email: 'a@a.com' };
      const expected = { message: 'If an account with this email exists, you will receive a password reset link.' };
      jest.spyOn(authRegistration, 'forgotPassword').mockResolvedValue(expected);
      expect(await authController.forgotPassword(dto as never)).toEqual(expected);
      expect(authRegistration.forgotPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('validateResetToken (auth-validate-reset-token)', () => {
    it('delegates to authRegistration.validateResetToken with the payload', async () => {
      const dto = { token: 'reset-token' };
      const expected = { valid: true, email: 'a@a.com' };
      jest.spyOn(authRegistration, 'validateResetToken').mockResolvedValue(expected);
      expect(await authController.validateResetToken(dto as never)).toEqual(expected);
      expect(authRegistration.validateResetToken).toHaveBeenCalledWith(dto);
    });
  });

  describe('resetPassword (auth-reset-password)', () => {
    it('delegates to authRegistration.resetPassword with the payload', async () => {
      const dto = { token: 'reset-token', newPassword: 'NewPass123!' };
      const expected = { message: 'Password has been reset successfully.' };
      jest.spyOn(authRegistration, 'resetPassword').mockResolvedValue(expected);
      expect(await authController.resetPassword(dto as never)).toEqual(expected);
      expect(authRegistration.resetPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('resetPasswordWithCode (auth-reset-password-with-code)', () => {
    it('delegates to authRegistration.resetPasswordWithCode with the payload', async () => {
      const dto = { email: 'a@a.com', code: '123456', newPassword: 'NewPass123!' };
      const expected = { message: 'Password has been reset successfully.' };
      jest.spyOn(authRegistration, 'resetPasswordWithCode').mockResolvedValue(expected as never);
      expect(await authController.resetPasswordWithCode(dto as never)).toEqual(expected);
      expect(authRegistration.resetPasswordWithCode).toHaveBeenCalledWith(dto);
    });
  });

  // ---------------------------------------------------------------------------
  // Account management
  // ---------------------------------------------------------------------------

  describe('changePassword (auth-change-password)', () => {
    it('delegates to authCore.changePassword with userId and changePasswordDto', async () => {
      const payload = { userId: 'user-1', changePasswordDto: { currentPassword: 'old', newPassword: 'new', confirmPassword: 'new' } };
      const expected = { message: 'Password changed successfully' };
      jest.spyOn(authCore, 'changePassword').mockResolvedValue(expected as never);
      expect(await authController.changePassword(payload as never)).toEqual(expected);
      expect(authCore.changePassword).toHaveBeenCalledWith(payload.userId, payload.changePasswordDto);
    });
  });

  describe('upgradeToSeller (auth-upgrade-to-seller)', () => {
    it('delegates to authCore.upgradeToSeller with userId and upgradeDto', async () => {
      const payload = { userId: 'user-1', upgradeDto: { phoneNumber: '+1', country: 'US' } };
      const expected = { message: 'Account upgraded to seller' };
      jest.spyOn(authCore, 'upgradeToSeller').mockResolvedValue(expected as never);
      expect(await authController.upgradeToSeller(payload as never)).toEqual(expected);
      expect(authCore.upgradeToSeller).toHaveBeenCalledWith(payload.userId, payload.upgradeDto);
    });
  });
});
