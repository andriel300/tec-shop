import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
// TODO(migration): bcrypt is kept for legacy hash verification during the bcrypt→Argon2id migration.
// Once all active users have logged in at least once after the migration, remove bcrypt entirely.
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash, randomUUID } from 'crypto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthPrismaService } from '../../prisma/prisma.service';
import { LogCategory } from '@tec-shop/dto';
import type {
  LoginDto,
  GoogleAuthDto,
  ChangePasswordDto,
  UpgradeToSellerDto,
} from '@tec-shop/dto';
import { RedisService } from '@tec-shop/redis-client';
import { ServiceAuthUtil } from '@tec-shop/service-auth';
import { LogProducerService } from '@tec-shop/logger-producer';
import { NotificationProducerService } from '@tec-shop/notification-producer';
import { AuthTotpService } from './auth-totp.service';

@Injectable()
export class AuthCoreService implements OnModuleInit {
  private readonly logger = new Logger(AuthCoreService.name);
  private readonly serviceMasterSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private jwtService: JwtService,
    private prisma: AuthPrismaService,
    private redisService: RedisService,
    private readonly logProducer: LogProducerService,
    private readonly notificationProducer: NotificationProducerService,
    private readonly authTotp: AuthTotpService,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    @Inject('SELLER_SERVICE') private readonly sellerClient: ClientProxy
  ) {
    const secret = this.configService.get<string>('SERVICE_MASTER_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('SERVICE_MASTER_SECRET environment variable is not configured');
    }
    this.serviceMasterSecret = secret;
  }

  async onModuleInit() {
    this.logger.log('Initializing AuthCoreService module...');

    try {
      await this.userClient.connect();
      this.logger.log('User Service client connected successfully');
    } catch (err) {
      this.logger.error('FAILED to connect to User Service client', err);
    }

    try {
      await this.redisService.get('ping');
      this.logger.log('Redis connected successfully');
    } catch (err) {
      this.logger.error('FAILED to connect to Redis', err);
    }
  }

  async login(credential: LoginDto) {
    try {
      this.logger.log(`Customer login attempt - email: ${credential.email}`);

      const user = await this.prisma.user.findFirst({
        where: { email: credential.email, userType: { in: ['CUSTOMER', 'SELLER'] } },
      });

      const genericError = 'Invalid credentials';

      if (!user || !user.password || !user.isEmailVerified) {
        this.logger.warn(`Customer login failed - invalid credentials or unverified email: ${credential.email}`);
        this.logProducer.warn('auth-service', LogCategory.SECURITY, 'Customer login failed - invalid credentials', {
          metadata: { action: 'login', reason: !user ? 'user_not_found' : !user.isEmailVerified ? 'unverified_email' : 'no_password', userType: 'CUSTOMER' },
        });
        throw new RpcException({ statusCode: 401, message: genericError });
      }

      this.logger.debug(`Verifying password for user: ${user.id}`);
      const isPasswordMatching = await this.verifyPassword(credential.password, user.password);

      if (!isPasswordMatching) {
        this.logger.warn(`Customer login failed - password mismatch: ${credential.email}`);
        this.logProducer.warn('auth-service', LogCategory.SECURITY, 'Customer login failed - wrong password', {
          userId: user.id,
          metadata: { action: 'login', reason: 'wrong_password', userType: 'CUSTOMER' },
        });
        throw new RpcException({ statusCode: 401, message: genericError });
      }

      await this.maybeRehash(credential.password, user.password, user.id);

      this.logger.log(`Customer login successful - userId: ${user.id}, email: ${credential.email}`);
      this.logProducer.info('auth-service', LogCategory.AUTH, 'Customer login successful', {
        userId: user.id,
        metadata: { action: 'login', userType: 'CUSTOMER' },
      });

      return this.generateTokens(user.id, user.email, 'CUSTOMER', credential.rememberMe);
    } catch (error) {
      this.logger.error(
        `Customer login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async sellerLogin(credential: LoginDto) {
    try {
      this.logger.log(`Seller login attempt - email: ${credential.email}`);

      const user = await this.prisma.user.findUnique({
        where: {
          email: credential.email,
          userType: 'SELLER',
        },
      });

      const genericError = 'Invalid credentials';

      if (!user || !user.password || !user.isEmailVerified) {
        this.logger.warn(`Seller login failed - invalid credentials or unverified email: ${credential.email}`);
        this.logProducer.warn('auth-service', LogCategory.SECURITY, 'Seller login failed - invalid credentials', {
          metadata: { action: 'login', reason: !user ? 'user_not_found' : !user.isEmailVerified ? 'unverified_email' : 'no_password', userType: 'SELLER' },
        });
        throw new RpcException({ statusCode: 401, message: genericError });
      }

      this.logger.debug(`Verifying password for seller: ${user.id}`);
      const isPasswordMatching = await this.verifyPassword(credential.password, user.password);

      if (!isPasswordMatching) {
        this.logger.warn(`Seller login failed - password mismatch: ${credential.email}`);
        this.logProducer.warn('auth-service', LogCategory.SECURITY, 'Seller login failed - wrong password', {
          userId: user.id,
          metadata: { action: 'login', reason: 'wrong_password', userType: 'SELLER' },
        });
        throw new RpcException({ statusCode: 401, message: genericError });
      }

      await this.maybeRehash(credential.password, user.password, user.id);

      this.logger.log(`Seller login successful - userId: ${user.id}, email: ${credential.email}`);
      this.logProducer.info('auth-service', LogCategory.AUTH, 'Seller login successful', {
        userId: user.id,
        metadata: { action: 'login', userType: 'SELLER' },
      });

      return this.generateTokens(user.id, user.email, 'SELLER', credential.rememberMe);
    } catch (error) {
      this.logger.error(
        `Seller login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async adminLogin(credential: LoginDto) {
    try {
      this.logger.log(`Admin login attempt - email: ${credential.email}`);

      const user = await this.prisma.user.findUnique({
        where: {
          email: credential.email,
          userType: 'ADMIN',
        },
      });

      const genericError = 'Invalid credentials';

      if (!user || !user.password || !user.isEmailVerified) {
        this.logger.warn(`Admin login failed - invalid credentials or unverified email: ${credential.email}`);
        this.logProducer.warn('auth-service', LogCategory.SECURITY, 'Admin login failed - invalid credentials', {
          metadata: { action: 'login', reason: !user ? 'user_not_found' : !user.isEmailVerified ? 'unverified_email' : 'no_password', userType: 'ADMIN' },
        });
        throw new RpcException({ statusCode: 401, message: genericError });
      }

      this.logger.debug(`Verifying password for admin: ${user.id}`);
      const isPasswordMatching = await this.verifyPassword(credential.password, user.password);

      if (!isPasswordMatching) {
        this.logger.warn(`Admin login failed - password mismatch: ${credential.email}`);
        this.logProducer.warn('auth-service', LogCategory.SECURITY, 'Admin login failed - wrong password', {
          userId: user.id,
          metadata: { action: 'login', reason: 'wrong_password', userType: 'ADMIN' },
        });
        throw new RpcException({ statusCode: 401, message: genericError });
      }

      await this.maybeRehash(credential.password, user.password, user.id);

      // If TOTP is enabled, return an opaque handle instead of full tokens.
      // SEC-05: opaque UUID stored in Redis (5-min TTL) replaces a signed JWT so
      // no user information is decodable from the response body.
      if (user.totpEnabled) {
        const handle = randomUUID();
        await this.redisService.set(`partial-auth:${handle}`, user.id, 300);
        void this.logProducer.info('auth-service', LogCategory.AUTH, 'Admin login step 1 passed — TOTP required', {
          userId: user.id,
          metadata: { action: 'login', userType: 'ADMIN', totpRequired: true },
        });
        return { requiresTotp: true, tempToken: handle };
      }

      this.logger.log(`Admin login successful - userId: ${user.id}, email: ${credential.email}`);
      this.logProducer.info('auth-service', LogCategory.AUTH, 'Admin login successful', {
        userId: user.id,
        metadata: { action: 'login', userType: 'ADMIN' },
      });

      return this.generateTokens(user.id, user.email, 'ADMIN', credential.rememberMe);
    } catch (error) {
      this.logger.error(
        `Admin login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async completeTotpLogin(tempToken: string, code: string) {
    // SEC-05: look up opaque handle in Redis — no JWT decode, no user data in token
    const userId = await this.redisService.get(`partial-auth:${tempToken}`);
    if (!userId) {
      throw new RpcException({ statusCode: 401, message: 'Invalid or expired session. Please log in again.' });
    }
    // Consume immediately — one-time use
    await this.redisService.del(`partial-auth:${tempToken}`);
    const isValid = await this.authTotp.verifyTotpForLogin(userId, code);

    if (!isValid) {
      this.logProducer.warn('auth-service', LogCategory.AUTH, 'Admin TOTP login step 2 failed', {
        userId,
        metadata: { action: 'totp_login_complete', reason: 'invalid_code' },
      });
      throw new RpcException({ statusCode: 401, message: 'Invalid authenticator code' });
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new RpcException({ statusCode: 401, message: 'User not found' });
    }

    this.logProducer.info('auth-service', LogCategory.AUTH, 'Admin TOTP login complete', {
      userId,
      metadata: { action: 'totp_login_complete', userType: 'ADMIN' },
    });

    return this.generateTokens(userId, user.email, 'ADMIN', false);
  }

  async googleLogin(googleAuthDto: GoogleAuthDto) {
    try {
      this.logger.log(`Google OAuth login attempt - email: ${googleAuthDto.email}`);
      const { googleId, email, name, picture, userType = 'CUSTOMER' } = googleAuthDto;

      let user = await this.prisma.user.findFirst({
        where: { googleId },
      });

      if (user) {
        this.logger.log(`Existing Google user found - userId: ${user.id}`);
      } else {
        user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          this.logger.log(`Linking existing local account with Google - userId: ${user.id}`);

          if (user.provider === 'local' && !user.googleId) {
            user = await this.prisma.user.update({
              where: { id: user.id },
              data: {
                googleId,
                provider: 'google',
                isEmailVerified: true,
              },
            });
            this.logger.log(`Account linked successfully - userId: ${user.id}`);
            void this.notificationProducer.notifyUser(user.id, user.userType as 'CUSTOMER' | 'SELLER', 'auth.google_linked', {},
              { email: user.email }, ['email']);
          } else if (user.googleId && user.googleId !== googleId) {
            this.logger.warn(`Email already linked to different Google account: ${email}`);
            throw new RpcException({ statusCode: 409, message: 'Email already associated with another Google account' });
          }
        } else {
          this.logger.log(`Creating new Google OAuth user - email: ${email}`);

          user = await this.prisma.user.create({
            data: {
              email,
              googleId,
              password: null,
              provider: 'google',
              isEmailVerified: true,
              userType: userType as 'CUSTOMER' | 'SELLER',
            },
          });

          this.logger.log(`New Google user created - userId: ${user.id}, userType: ${userType}`);

          try {
            if (userType === 'SELLER') {
              const profileData = {
                authId: user.id,
                name,
                email: user.email,
                phoneNumber: '',
                country: '',
              };

              const serviceSecret = ServiceAuthUtil.deriveServiceSecret(
                this.serviceMasterSecret,
                'auth-service'
              );

              const signedRequest = ServiceAuthUtil.signRequest(
                profileData,
                'auth-service',
                serviceSecret
              );

              await firstValueFrom(
                this.sellerClient.send('create-seller-profile-signed', signedRequest)
              );
              this.logger.log(`Seller profile created via Google OAuth - userId: ${user.id}`);
            } else {
              await firstValueFrom(
                this.userClient.send('create-user-profile', {
                  userId: user.id,
                  name,
                  picture,
                })
              );
              this.logger.log(`Customer profile created via Google OAuth - userId: ${user.id}`);
            }
          } catch (error) {
            this.logger.error(
              `Failed to create ${userType.toLowerCase()} profile for Google user ${user.id}:`,
              error
            );
          }
        }
      }

      this.logger.log(`Generating tokens for Google user - userId: ${user.id}, userType: ${user.userType}`);

      const tokens = await this.generateTokens(
        user.id,
        user.email,
        user.userType as 'CUSTOMER' | 'SELLER' | 'ADMIN',
        false
      );

      this.logProducer.info('auth-service', LogCategory.AUTH, 'Google OAuth login successful', {
        userId: user.id,
        metadata: { action: 'google_login', userType: user.userType },
      });

      return {
        ...tokens,
        userId: user.id,
        email: user.email,
        name: name,
        createdAt: user.createdAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Google OAuth login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);

      const tokenId = createHash('sha256').update(token).digest('hex');
      const isBlacklisted = await this.redisService.get(`blacklist:${tokenId}`);

      if (isBlacklisted) {
        return {
          valid: false,
          userId: null,
          role: null,
          reason: 'token_revoked',
        };
      }

      const userRevocation = await this.redisService.get(
        `user-revocation:${decoded.sub}`
      );
      if (userRevocation) {
        const revocationTime = parseInt(userRevocation);
        if (decoded.iat < revocationTime) {
          return {
            valid: false,
            userId: null,
            role: null,
            reason: 'user_tokens_revoked',
          };
        }
      }

      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        return {
          valid: false,
          userId: null,
          role: null,
          reason: 'token_expired',
        };
      }

      return {
        valid: true,
        userId: decoded.sub,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (_error) {
      return {
        valid: false,
        userId: null,
        role: null,
        reason: 'token_invalid',
      };
    }
  }

  async refreshToken(refreshToken: string, _currentAccessToken?: string) {
    // Extract familyId from structured token format: "{familyId}.{secret}"
    // Legacy tokens (no dot) have no family and cannot trigger reuse detection.
    const dotIndex = refreshToken.indexOf('.');
    const familyId = dotIndex !== -1 ? refreshToken.substring(0, dotIndex) : null;

    const hashedRefreshToken = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        refreshToken: hashedRefreshToken,
        isEmailVerified: true,
      },
    });

    if (!user) {
      // Token hash doesn't match the active token.
      // If it carries a familyId, check whether that family is still registered —
      // a match means the token was already rotated and is being replayed (reuse attack).
      if (familyId) {
        const familyOwner = await this.prisma.user.findFirst({
          where: { refreshTokenFamily: familyId },
        });

        if (familyOwner) {
          this.logger.warn(
            `Refresh token reuse detected — revoking all tokens for userId: ${familyOwner.id}`
          );
          this.logProducer.warn(
            'auth-service',
            LogCategory.AUTH,
            'Refresh token reuse detected',
            {
              userId: familyOwner.id,
              metadata: { action: 'reuse_detected', familyId },
            }
          );

          await this.revokeAllUserTokens(familyOwner.id, 'refresh_token_reuse');

          throw new RpcException({
            statusCode: 401,
            message: 'Session invalidated due to suspicious activity. Please log in again.',
          });
        }
      }

      throw new RpcException({ statusCode: 401, message: 'Invalid refresh token' });
    }

    const rememberMeStr = await this.redisService.get(`session-remember-me:${user.id}`);
    const wasRememberMe = rememberMeStr === '1';

    // Rotate: generate new token preserving the same familyId
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.userType as 'CUSTOMER' | 'SELLER' | 'ADMIN',
      wasRememberMe,
      familyId ?? undefined
    );

    this.logProducer.info('auth-service', LogCategory.AUTH, 'Token refreshed', {
      userId: user.id,
      metadata: { action: 'token_refresh', userType: user.userType },
    });

    return {
      ...tokens,
      userId: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async revokeRefreshToken(userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null, refreshTokenFamily: null },
      });

      return { message: 'Refresh token revoked successfully' };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        this.logger.warn(`User ${userId} not found during refresh token revocation`);
        return { message: 'Refresh token already revoked or user not found' };
      }
      throw error;
    }
  }

  async revokeToken(token: string, reason = 'logout') {
    try {
      const decoded = this.jwtService.verify(token);
      const tokenId = createHash('sha256').update(token).digest('hex');

      const now = Math.floor(Date.now() / 1000);
      const ttl = Math.max(0, decoded.exp - now);

      if (ttl > 0) {
        await this.redisService.set(
          `blacklist:${tokenId}`,
          JSON.stringify({
            userId: decoded.sub,
            reason,
            revokedAt: now,
            originalExp: decoded.exp,
          }),
          ttl
        );
      }

      return { success: true, message: 'Token revoked successfully' };
    } catch (_error) {
      return { success: false, message: 'Token already invalid' };
    }
  }

  async revokeAllUserTokens(userId: string, _reason = 'security_event') {
    const revocationTime = Math.floor(Date.now() / 1000);

    await this.redisService.set(
      `user-revocation:${userId}`,
      revocationTime.toString(),
      30 * 24 * 60 * 60 // 30 days
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null, refreshTokenFamily: null },
    });

    return { message: 'All user tokens revoked successfully', revocationTime };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    this.logger.log(`Change password attempt for user: ${userId}`);
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`Change password failed - user not found: ${userId}`);
      throw new RpcException({ statusCode: 401, message: 'User not found' });
    }

    if (!user.password) {
      this.logger.warn(`Change password failed - user authenticated via Google: ${userId}`);
      throw new RpcException({ statusCode: 401, message: 'Cannot change password for accounts authenticated via Google. Please use Google to manage your account security.' });
    }

    const isPasswordValid = await this.verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Change password failed - invalid current password for user: ${userId}`);
      throw new RpcException({ statusCode: 401, message: 'Current password is incorrect' });
    }

    const isSamePassword = await this.verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      this.logger.warn(`Change password failed - new password same as current for user: ${userId}`);
      throw new RpcException({ statusCode: 401, message: 'New password must be different from current password' });
    }

    const hashedPassword = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, refreshToken: null, refreshTokenFamily: null },
    });

    this.logger.log(`Password changed successfully for user: ${userId}`);
    this.logProducer.info('auth-service', LogCategory.SECURITY, 'Password changed successfully', {
      userId,
      metadata: { action: 'change_password' },
    });

    return {
      message: 'Password changed successfully. Please log in again with your new password.',
    };
  }

  async upgradeToSeller(userId: string, dto: UpgradeToSellerDto) {
    this.logger.log(`Upgrade to seller attempt - userId: ${userId}`);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new RpcException({ statusCode: 401, message: 'User not found' });
    }

    if (user.userType !== 'CUSTOMER') {
      throw new RpcException({ statusCode: 400, message: 'Only CUSTOMER accounts can be upgraded to SELLER' });
    }

    if (user.password) {
      if (!dto.currentPassword) {
        throw new RpcException({ statusCode: 400, message: 'Current password is required to upgrade account. Please provide your current password.' });
      }
      const isPasswordValid = await this.verifyPassword(dto.currentPassword, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Upgrade to seller failed - invalid password for user: ${userId}`);
        this.logProducer.warn('auth-service', LogCategory.SECURITY, 'Upgrade to seller rejected - wrong password', {
          userId,
          metadata: { action: 'upgrade_to_seller' },
        });
        throw new RpcException({ statusCode: 401, message: 'Current password is incorrect' });
      }
    }

    let userName = '';
    try {
      const userProfile = await firstValueFrom(
        this.userClient.send('get-user-profile', userId)
      );
      userName = userProfile?.name || '';
    } catch (err) {
      this.logger.warn(`Could not fetch user profile name for upgrade - userId: ${userId}`, err);
    }

    const profileData = {
      authId: userId,
      name: userName,
      email: user.email,
      phoneNumber: dto.phoneNumber,
      country: dto.country,
    };

    const serviceSecret = ServiceAuthUtil.deriveServiceSecret(
      this.serviceMasterSecret,
      'auth-service'
    );

    const signedRequest = ServiceAuthUtil.signRequest(
      profileData,
      'auth-service',
      serviceSecret
    );

    await firstValueFrom(
      this.sellerClient.send('create-seller-profile-signed', signedRequest)
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { userType: 'SELLER' },
    });

    await this.revokeRefreshToken(userId);

    const tokens = await this.generateTokens(userId, user.email, 'SELLER', false);

    this.logger.log(`Account upgraded to seller - userId: ${userId}`);
    this.logProducer.info('auth-service', LogCategory.AUTH, 'Account upgraded to seller', {
      userId,
      metadata: { action: 'upgrade_to_seller' },
    });

    void this.notificationProducer.notifyUser(userId, 'SELLER', 'auth.account_upgrade', {},
      { email: user.email }, ['email']);

    return {
      ...tokens,
      userId,
      email: user.email,
    };
  }

  async getUserEmail(userId: string): Promise<{ email: string } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user ?? null;
  }

  /**
   * Verifies a password against a stored hash.
   * Supports both Argon2id (current) and bcrypt (legacy migration path).
   * Argon2 hashes start with "$argon2"; bcrypt hashes start with "$2b$" or "$2a$".
   */
  private async verifyPassword(plain: string, hash: string): Promise<boolean> {
    if (hash.startsWith('$argon2')) {
      return argon2.verify(hash, plain);
    }
    return bcrypt.compare(plain, hash);
  }

  /**
   * If the stored hash is still bcrypt, transparently rehash with Argon2id and persist.
   * Call this only after verifyPassword returns true.
   */
  private async maybeRehash(plain: string, hash: string, userId: string): Promise<void> {
    if (!hash.startsWith('$argon2')) {
      const newHash = await argon2.hash(plain);
      await this.prisma.user.update({ where: { id: userId }, data: { password: newHash } });
      this.logger.debug(`Migrated bcrypt hash to Argon2id for user: ${userId}`);
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: 'CUSTOMER' | 'SELLER' | 'ADMIN',
    rememberMe = false,
    familyId?: string  // reuse existing family on rotation; undefined = new login → new family
  ) {
    const payload = { sub: userId, username: email, role, userType: role };

    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Structured refresh token: "{familyId}.{secret}"
    // familyId survives all rotations so a reused old token can be traced back to its family.
    const family = familyId ?? randomBytes(16).toString('hex');
    const secret = randomBytes(32).toString('hex');
    const refresh_token = `${family}.${secret}`;
    const hashedRefreshToken = createHash('sha256').update(refresh_token).digest('hex');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: hashedRefreshToken,
        refreshTokenFamily: family,
      },
    });

    const sessionTtl = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
    await this.redisService.set(
      `session-remember-me:${userId}`,
      rememberMe ? '1' : '0',
      sessionTtl
    );

    return { access_token, refresh_token, rememberMe };
  }
}
