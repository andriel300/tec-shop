import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt, randomBytes, createHash } from 'crypto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthPrismaService } from '../../prisma/prisma.service';
import {
  LoginDto,
  SignupDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ResetPasswordWithCodeDto,
  ValidateResetTokenDto,
  SellerSignupDto,
  GoogleAuthDto,
  ChangePasswordDto,
} from '@tec-shop/dto';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { ServiceAuthUtil } from './service-auth.util';
import { LogProducerService } from '@tec-shop/logger-producer';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private prisma: AuthPrismaService,
    private redisService: RedisService,
    private emailService: EmailService,
    private readonly logProducer: LogProducerService,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    @Inject('SELLER_SERVICE') private readonly sellerClient: ClientProxy
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing AuthService module...');

    // 1. Test User Service connection
    try {
      await this.userClient.connect();
      this.logger.log('User Service client connected successfully');
    } catch (err) {
      this.logger.error('FAILED to connect to User Service client', err);
    }

    // 2. Test Redis connection
    try {
      await this.redisService.get('ping');
      this.logger.log('Redis connected successfully');
    } catch (err) {
      this.logger.error('FAILED to connect to Redis', err);
    }
  }

  async signup(signupDto: SignupDto) {
    try {
      this.logger.log(`Customer signup attempt - email: ${signupDto.email}`);
      const { email, password, name } = signupDto;

      this.logger.debug('Checking if user already exists');
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.warn(`Signup failed - email already exists: ${email}`);
        this.logProducer.warn('auth-service', 'auth', 'Customer signup failed - duplicate email', {
          metadata: { action: 'signup', reason: 'duplicate_email' },
        });
        throw new ConflictException('User with this email already exists');
      }

      this.logger.debug('Hashing password');
      const hashedPassword = await bcrypt.hash(password, 10);

      this.logger.debug('Creating user record');
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          isEmailVerified: false,
        },
      });

      this.logger.debug(`User created - ID: ${user.id}`);

      // Generate and store OTP and name using cryptographically secure random
      this.logger.debug('Generating OTP');
      const otp = randomInt(100000, 1000000).toString().padStart(6, '0');
      const redisPayload = JSON.stringify({ otp, name });
      await this.redisService.set(
        `verification-otp:${user.id}`,
        redisPayload,
        600
      );

      // Send verification email
      this.logger.debug(`Sending verification email to: ${user.email}`);
      await this.emailService.sendOtp(user.email, otp);

      this.logger.log(`Customer signup successful - userId: ${user.id}, email: ${email}`);
      this.logProducer.info('auth-service', 'auth', 'Customer signup successful', {
        userId: user.id,
        metadata: { action: 'signup', userType: 'CUSTOMER' },
      });

      // We will not emit an event or return a token until the user is verified.
      return {
        message:
          'Signup successful. Please check your email to verify your account.',
      };
    } catch (error) {
      this.logger.error(
        `Customer signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async sellerSignup(sellerSignupDto: SellerSignupDto) {
    try {
      this.logger.log(`Seller signup attempt - email: ${sellerSignupDto.email}`);
      const { email, password, name, phoneNumber, country } = sellerSignupDto;

      this.logger.debug('Checking if seller already exists');
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.warn(`Seller signup failed - email already exists: ${email}`);
        this.logProducer.warn('auth-service', 'auth', 'Seller signup failed - duplicate email', {
          metadata: { action: 'signup', reason: 'duplicate_email', userType: 'SELLER' },
        });
        throw new ConflictException('User with this email already exists');
      }

      this.logger.debug('Hashing seller password');
      const hashedPassword = await bcrypt.hash(password, 10);

      this.logger.debug('Creating seller user record');
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          isEmailVerified: false,
          userType: 'SELLER', // Mark as seller type
        },
      });

      this.logger.debug(`Seller user created - ID: ${user.id}`);

      // Generate and store OTP with seller profile data
      this.logger.debug('Generating OTP with seller profile data');
      const otp = randomInt(100000, 1000000).toString().padStart(6, '0');
      const redisPayload = JSON.stringify({
        otp,
        name,
        phoneNumber,
        country,
        userType: 'SELLER',
      });
      await this.redisService.set(
        `verification-otp:${user.id}`,
        redisPayload,
        600
      );

      // Send verification email
      this.logger.debug(`Sending verification email to seller: ${user.email}`);
      await this.emailService.sendOtp(user.email, otp);

      this.logger.log(`Seller signup successful - userId: ${user.id}, email: ${email}`);
      this.logProducer.info('auth-service', 'auth', 'Seller signup successful', {
        userId: user.id,
        metadata: { action: 'signup', userType: 'SELLER' },
      });

      return {
        message:
          'Seller signup successful. Please check your email to verify your account.',
      };
    } catch (error) {
      this.logger.error(
        `Seller signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async login(credential: LoginDto) {
    try {
      this.logger.log(`Customer login attempt - email: ${credential.email}`);

      const user = await this.prisma.user.findUnique({
        where: { email: credential.email },
      });

      // Generic error message to prevent email enumeration
      const genericError = 'Invalid credentials';

      if (!user || !user.password || !user.isEmailVerified) {
        this.logger.warn(`Customer login failed - invalid credentials or unverified email: ${credential.email}`);
        this.logProducer.warn('auth-service', 'security', 'Customer login failed - invalid credentials', {
          metadata: { action: 'login', reason: !user ? 'user_not_found' : !user.isEmailVerified ? 'unverified_email' : 'no_password', userType: 'CUSTOMER' },
        });
        throw new UnauthorizedException(genericError);
      }

      this.logger.debug(`Verifying password for user: ${user.id}`);
      const isPasswordMatching = await bcrypt.compare(
        credential.password,
        user.password
      );

      if (!isPasswordMatching) {
        this.logger.warn(`Customer login failed - password mismatch: ${credential.email}`);
        this.logProducer.warn('auth-service', 'security', 'Customer login failed - wrong password', {
          userId: user.id,
          metadata: { action: 'login', reason: 'wrong_password', userType: 'CUSTOMER' },
        });
        throw new UnauthorizedException(genericError);
      }

      this.logger.log(`Customer login successful - userId: ${user.id}, email: ${credential.email}`);
      this.logProducer.info('auth-service', 'auth', 'Customer login successful', {
        userId: user.id,
        metadata: { action: 'login', userType: 'CUSTOMER' },
      });

      // Pass rememberMe flag to token generation for extended session
      return this.generateTokens(user.id, user.email, credential.rememberMe);
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

      // Find user by email with seller userType
      const user = await this.prisma.user.findUnique({
        where: {
          email: credential.email,
          userType: 'SELLER',
        },
      });

      // Generic error message to prevent email enumeration
      const genericError = 'Invalid credentials';

      if (!user || !user.password || !user.isEmailVerified) {
        this.logger.warn(`Seller login failed - invalid credentials or unverified email: ${credential.email}`);
        this.logProducer.warn('auth-service', 'security', 'Seller login failed - invalid credentials', {
          metadata: { action: 'login', reason: !user ? 'user_not_found' : !user.isEmailVerified ? 'unverified_email' : 'no_password', userType: 'SELLER' },
        });
        throw new UnauthorizedException(genericError);
      }

      this.logger.debug(`Verifying password for seller: ${user.id}`);
      const isPasswordMatching = await bcrypt.compare(
        credential.password,
        user.password
      );

      if (!isPasswordMatching) {
        this.logger.warn(`Seller login failed - password mismatch: ${credential.email}`);
        this.logProducer.warn('auth-service', 'security', 'Seller login failed - wrong password', {
          userId: user.id,
          metadata: { action: 'login', reason: 'wrong_password', userType: 'SELLER' },
        });
        throw new UnauthorizedException(genericError);
      }

      this.logger.log(`Seller login successful - userId: ${user.id}, email: ${credential.email}`);
      this.logProducer.info('auth-service', 'auth', 'Seller login successful', {
        userId: user.id,
        metadata: { action: 'login', userType: 'SELLER' },
      });

      // Generate tokens for seller with proper role and userType
      return this.generateSellerTokens(
        user.id,
        user.email,
        credential.rememberMe
      );
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

      // Find user by email with admin userType
      const user = await this.prisma.user.findUnique({
        where: {
          email: credential.email,
          userType: 'ADMIN',
        },
      });

      // Generic error message to prevent email enumeration
      const genericError = 'Invalid credentials';

      if (!user || !user.password || !user.isEmailVerified) {
        this.logger.warn(`Admin login failed - invalid credentials or unverified email: ${credential.email}`);
        this.logProducer.warn('auth-service', 'security', 'Admin login failed - invalid credentials', {
          metadata: { action: 'login', reason: !user ? 'user_not_found' : !user.isEmailVerified ? 'unverified_email' : 'no_password', userType: 'ADMIN' },
        });
        throw new UnauthorizedException(genericError);
      }

      this.logger.debug(`Verifying password for admin: ${user.id}`);
      const isPasswordMatching = await bcrypt.compare(
        credential.password,
        user.password
      );

      if (!isPasswordMatching) {
        this.logger.warn(`Admin login failed - password mismatch: ${credential.email}`);
        this.logProducer.warn('auth-service', 'security', 'Admin login failed - wrong password', {
          userId: user.id,
          metadata: { action: 'login', reason: 'wrong_password', userType: 'ADMIN' },
        });
        throw new UnauthorizedException(genericError);
      }

      this.logger.log(`Admin login successful - userId: ${user.id}, email: ${credential.email}`);
      this.logProducer.info('auth-service', 'auth', 'Admin login successful', {
        userId: user.id,
        metadata: { action: 'login', userType: 'ADMIN' },
      });

      // Generate tokens for admin with proper role and userType
      return this.generateAdminTokens(
        user.id,
        user.email,
        credential.rememberMe
      );
    } catch (error) {
      this.logger.error(
        `Admin login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  async googleLogin(googleAuthDto: GoogleAuthDto) {
    try {
      this.logger.log(`Google OAuth login attempt - email: ${googleAuthDto.email}`);
      const { googleId, email, name, picture, userType = 'CUSTOMER' } = googleAuthDto;

      // First, check if user exists with this googleId
      let user = await this.prisma.user.findFirst({
        where: { googleId },
      });

      if (user) {
        this.logger.log(`Existing Google user found - userId: ${user.id}`);
      } else {
        // Check if user exists with this email (account linking scenario)
        user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Account linking: Add googleId to existing local account
          this.logger.log(`Linking existing local account with Google - userId: ${user.id}`);

          if (user.provider === 'local' && !user.googleId) {
            user = await this.prisma.user.update({
              where: { id: user.id },
              data: {
                googleId,
                provider: 'google',
                isEmailVerified: true, // Google verifies emails
              },
            });
            this.logger.log(`Account linked successfully - userId: ${user.id}`);
          } else if (user.googleId && user.googleId !== googleId) {
            // Email exists but with different googleId - security issue
            this.logger.warn(`Email already linked to different Google account: ${email}`);
            throw new ConflictException('Email already associated with another Google account');
          }
        } else {
          // Create new user with Google OAuth
          this.logger.log(`Creating new Google OAuth user - email: ${email}`);

          user = await this.prisma.user.create({
            data: {
              email,
              googleId,
              password: null, // OAuth users don't have passwords
              provider: 'google',
              isEmailVerified: true, // Google verifies emails
              userType: userType as 'CUSTOMER' | 'SELLER',
            },
          });

          this.logger.log(`New Google user created - userId: ${user.id}, userType: ${userType}`);

          // Create user profile in appropriate service
          try {
            if (userType === 'SELLER') {
              // Create seller profile using signed request
              const profileData = {
                authId: user.id,
                name,
                email: user.email,
                phoneNumber: '', // Will be filled in later by seller
                country: '', // Will be filled in later by seller
              };

              if (!process.env.SERVICE_MASTER_SECRET) {
                throw new Error(
                  'SERVICE_MASTER_SECRET environment variable is not configured'
                );
              }

              const serviceSecret = ServiceAuthUtil.deriveServiceSecret(
                process.env.SERVICE_MASTER_SECRET,
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
              // Create customer profile
              await firstValueFrom(
                this.userClient.send('create-user-profile', {
                  userId: user.id,
                  name,
                  picture, // Google profile picture
                })
              );
              this.logger.log(`Customer profile created via Google OAuth - userId: ${user.id}`);
            }
          } catch (error) {
            this.logger.error(
              `Failed to create ${userType.toLowerCase()} profile for Google user ${user.id}:`,
              error
            );
            // Don't fail the login, profile can be created later
          }
        }
      }

      // Generate appropriate tokens based on userType
      this.logger.log(`Generating tokens for Google user - userId: ${user.id}, userType: ${user.userType}`);

      const tokens = user.userType === 'SELLER'
        ? await this.generateSellerTokens(user.id, user.email, false)
        : await this.generateTokens(user.id, user.email, false);

      this.logProducer.info('auth-service', 'auth', 'Google OAuth login successful', {
        userId: user.id,
        metadata: { action: 'google_login', userType: user.userType },
      });

      return {
        ...tokens,
        userId: user.id,
        email: user.email,
        name: name, // Name from Google profile
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

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid verification details');
    }

    // Check OTP attempt limiting
    const attemptKey = `otp-attempts:${user.id}`;
    const attemptsStr = await this.redisService.get(attemptKey);
    const attempts = attemptsStr ? parseInt(attemptsStr) : 0;

    if (attempts >= 3) {
      // Clean up OTP after max attempts
      await this.redisService.del(`verification-otp:${user.id}`);
      throw new UnauthorizedException(
        'Too many failed attempts. Please request a new OTP.'
      );
    }

    const redisPayload = await this.redisService.get(
      `verification-otp:${user.id}`
    );

    if (!redisPayload) {
      throw new UnauthorizedException('Invalid verification details');
    }

    const { otp: storedOtp, name } = JSON.parse(redisPayload);

    if (storedOtp !== otp) {
      // Increment failed attempts
      await this.redisService.set(attemptKey, (attempts + 1).toString(), 600);
      throw new UnauthorizedException('Invalid verification details');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    await this.redisService.del(`verification-otp:${user.id}`);
    await this.redisService.del(`otp-attempts:${user.id}`);

    this.logProducer.info('auth-service', 'auth', 'Email verified successfully', {
      userId: user.id,
      metadata: { action: 'verify_email', userType: 'CUSTOMER' },
    });

    // Create the user profile in the user-service now that email is verified
    try {
      await firstValueFrom(
        this.userClient.send('create-user-profile', {
          userId: user.id,
          name,
        })
      );
      this.logger.log(`User profile created successfully for user ${user.id}`);
    } catch (error) {
      this.logger.error('Failed to create user profile in user-service:', error);
      this.logProducer.error('auth-service', 'system', 'Failed to create user profile in user-service', {
        userId: user.id,
        metadata: { action: 'create_profile', targetService: 'user-service' },
      });
    }

    return { message: 'Email verified successfully.' };
  }

  async verifySellerEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { email, userType: 'SELLER' },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid verification details');
    }

    // Check OTP attempt limiting
    const attemptKey = `otp-attempts:${user.id}`;
    const attemptsStr = await this.redisService.get(attemptKey);
    const attempts = attemptsStr ? parseInt(attemptsStr) : 0;

    if (attempts >= 3) {
      await this.redisService.del(`verification-otp:${user.id}`);
      throw new UnauthorizedException(
        'Too many failed attempts. Please request a new OTP.'
      );
    }

    const redisPayload = await this.redisService.get(
      `verification-otp:${user.id}`
    );

    if (!redisPayload) {
      throw new UnauthorizedException('Invalid verification details');
    }

    const {
      otp: storedOtp,
      name,
      phoneNumber,
      country,
      userType,
    } = JSON.parse(redisPayload);

    if (storedOtp !== otp) {
      await this.redisService.set(attemptKey, (attempts + 1).toString(), 600);
      throw new UnauthorizedException('Invalid verification details');
    }

    // Verify this is actually a seller verification
    if (userType !== 'SELLER') {
      throw new UnauthorizedException('Invalid verification type');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    await this.redisService.del(`verification-otp:${user.id}`);
    await this.redisService.del(`otp-attempts:${user.id}`);

    // Create the seller profile in seller-service using signed request
    try {
      const profileData = {
        authId: user.id,
        name,
        email: user.email,
        phoneNumber,
        country,
      };

      if (!process.env.SERVICE_MASTER_SECRET) {
        throw new Error(
          'SERVICE_MASTER_SECRET environment variable is not configured. This is required for secure service-to-service communication.'
        );
      }

      const serviceSecret = ServiceAuthUtil.deriveServiceSecret(
        process.env.SERVICE_MASTER_SECRET,
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
      this.logger.log(`Seller profile created successfully for user ${user.id}`);
    } catch (error) {
      this.logger.error(
        'Failed to create seller profile in seller-service:',
        error
      );
      this.logProducer.error('auth-service', 'system', 'Failed to create seller profile in seller-service', {
        userId: user.id,
        metadata: { action: 'create_profile', targetService: 'seller-service' },
      });
    }

    this.logProducer.info('auth-service', 'auth', 'Seller email verified successfully', {
      userId: user.id,
      metadata: { action: 'verify_email', userType: 'SELLER' },
    });

    return { message: 'Seller email verified successfully.' };
  }

  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);

      // Check if token is blacklisted (Security Hardened)
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

      // Check for global user token revocation
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

      // Additional validation: check token age and issuer
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

  async refreshToken(refreshToken: string, currentAccessToken?: string) {
    // Hash the provided refresh token to compare with stored hash
    const hashedRefreshToken = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Find user with matching refresh token
    const user = await this.prisma.user.findFirst({
      where: {
        refreshToken: hashedRefreshToken,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Determine if this was a "remember me" session by checking token expiration
    let wasRememberMe = false;
    if (currentAccessToken) {
      try {
        const decoded = this.jwtService.decode(currentAccessToken) as {
          exp: number;
          iat: number;
        } | null;
        if (decoded && decoded.exp) {
          const tokenDuration = decoded.exp - decoded.iat;
          wasRememberMe = tokenDuration > 2 * 24 * 60 * 60; // More than 2 days = remember me
        }
      } catch (_error) {
        // If we can't decode, default to normal session
        console.log('Could not decode token for remember me detection');
      }
    }

    // Generate new token pair maintaining the remember me preference
    // Use the appropriate token generator based on userType
    let tokens;
    if (user.userType === 'ADMIN') {
      tokens = await this.generateAdminTokens(user.id, user.email, wasRememberMe);
    } else if (user.userType === 'SELLER') {
      tokens = await this.generateSellerTokens(user.id, user.email, wasRememberMe);
    } else {
      tokens = await this.generateTokens(user.id, user.email, wasRememberMe);
    }

    this.logProducer.info('auth-service', 'auth', 'Token refreshed', {
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
      // Clear the refresh token from database
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      return { message: 'Refresh token revoked successfully' };
    } catch (error) {
      // User might not exist (deleted or invalid ID) - this is okay during logout
      if ((error as { code?: string }).code === 'P2025') {
        // Record not found - no action needed
        this.logger.warn(`User ${userId} not found during refresh token revocation`);
        return { message: 'Refresh token already revoked or user not found' };
      }
      throw error;
    }
  }

  // Security Hardened: Token revocation with blacklisting
  async revokeToken(token: string, reason = 'logout') {
    try {
      const decoded = this.jwtService.verify(token);
      const tokenId = createHash('sha256').update(token).digest('hex');

      // Calculate TTL to match token expiration (blacklist only as long as needed)
      const now = Math.floor(Date.now() / 1000);
      const ttl = Math.max(0, decoded.exp - now);

      if (ttl > 0) {
        // Store reason and timestamp for audit purposes
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
      // Even if token is invalid, we don't want to throw errors during logout
      return { success: false, message: 'Token already invalid' };
    }
  }

  async revokeAllUserTokens(userId: string, _reason = 'security_event') {
    // Mark user for global token revocation by setting a revocation timestamp
    const revocationTime = Math.floor(Date.now() / 1000);

    // Store in Redis with long TTL for JWT validation
    await this.redisService.set(
      `user-revocation:${userId}`,
      revocationTime.toString(),
      30 * 24 * 60 * 60 // 30 days - longer than max JWT lifetime
    );

    // Also clear refresh token from database
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'All user tokens revoked successfully', revocationTime };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    const successMessage =
      'If an account with this email exists, you will receive a password reset link.';

    if (!user || !user.isEmailVerified) {
      return { message: successMessage };
    }

    // Clean up any existing unused tokens for this user (security best practice)
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        OR: [{ used: true }, { expiresAt: { lt: new Date() } }],
      },
    });

    // Generate cryptographically secure token (128-bit entropy)
    const resetToken = randomBytes(32).toString('hex');

    // Create token record with 1-hour expiry
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Generate reset link with frontend URL
    const resetLink = `${
      process.env.FRONTEND_URL || 'http://localhost:3000'
    }/reset-password?token=${resetToken}`;

    // Send reset email with secure link
    await this.emailService.sendPasswordResetLink(user.email, resetLink);

    return { message: successMessage };
  }

  async validateResetToken(validateResetTokenDto: ValidateResetTokenDto) {
    const { token } = validateResetTokenDto;

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            email: true,
            isEmailVerified: true,
          },
        },
      },
    });

    if (!resetToken || !resetToken.user.isEmailVerified) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    return {
      valid: true,
      email: resetToken.user.email,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    // Find and validate the token
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetToken || !resetToken.user.isEmailVerified) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // Clean up all reset tokens for this user (security best practice)
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        used: true,
      },
    });

    // Send confirmation email
    await this.emailService.sendPasswordChangedNotification(
      resetToken.user.email
    );

    this.logProducer.info('auth-service', 'security', 'Password reset successful', {
      userId: resetToken.userId,
      metadata: { action: 'password_reset' },
    });

    return { message: 'Password has been reset successfully.' };
  }

  // Legacy method - keep for backward compatibility during transition
  async resetPasswordWithCode(resetPasswordDto: ResetPasswordWithCodeDto) {
    const { email, code, newPassword } = resetPasswordDto;

    // First verify the user exists and get their ID
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isEmailVerified) {
      throw new UnauthorizedException('Invalid reset credentials');
    }

    // Check reset attempt limiting per user (not per code, for better UX)
    const attemptKey = `reset-attempts:${user.id}`;
    const attemptsStr = await this.redisService.get(attemptKey);
    const attempts = attemptsStr ? parseInt(attemptsStr) : 0;

    // Hash the provided code to look up in Redis
    const codeHash = createHash('sha256').update(code).digest('hex');

    // Check if code exists and matches the user
    const storedUserId = await this.redisService.get(
      `password-reset:${codeHash}`
    );

    if (!storedUserId || storedUserId !== user.id) {
      // Increment failed attempts for this user
      const newAttempts = attempts + 1;
      await this.redisService.set(attemptKey, newAttempts.toString(), 600);
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    if (attempts >= 3) {
      // Clean up code after max attempts (stricter limit for security)
      await this.redisService.del(`password-reset:${codeHash}`);
      throw new UnauthorizedException(
        'Too many failed attempts. Please request a new reset code.'
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Clean up reset code and attempts
    await this.redisService.del(`password-reset:${codeHash}`);
    await this.redisService.del(`reset-attempts:${user.id}`);

    // Send confirmation email
    await this.emailService.sendPasswordChangedNotification(user.email);

    return { message: 'Password has been reset successfully.' };
  }

  private async generateTokens(
    userId: string,
    email: string,
    rememberMe = false
  ) {
    const payload = {
      sub: userId,
      username: email,
      role: 'CUSTOMER',
      userType: 'CUSTOMER' as const,
    };

    // Set token expiration based on rememberMe preference
    const accessTokenExpiry = rememberMe ? '7d' : '1d'; // Extended: 7 days, Normal: 1 day

    // Generate access token with appropriate expiration
    const access_token = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiry,
    });

    // Generate refresh token (cryptographically secure)
    const refresh_token = randomBytes(32).toString('hex');

    // Store refresh token in database (hashed for security)
    const hashedRefreshToken = createHash('sha256')
      .update(refresh_token)
      .digest('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      access_token,
      refresh_token,
      rememberMe, // Return the flag for cookie configuration
    };
  }

  private async generateSellerTokens(
    userId: string,
    email: string,
    rememberMe = false
  ) {
    const payload = {
      sub: userId,
      username: email,
      role: 'SELLER',
      userType: 'SELLER' as const,
    };

    // Set token expiration based on rememberMe preference
    const accessTokenExpiry = rememberMe ? '7d' : '1d'; // Extended: 7 days, Normal: 1 day

    // Generate access token with appropriate expiration
    const access_token = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiry,
    });

    // Generate refresh token (cryptographically secure)
    const refresh_token = randomBytes(32).toString('hex');

    // Store refresh token in database (hashed for security)
    // For sellers, we use the same User table since they are Users with userType: SELLER
    const hashedRefreshToken = createHash('sha256')
      .update(refresh_token)
      .digest('hex');

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      access_token,
      refresh_token,
      rememberMe, // Return the flag for cookie configuration
    };
  }

  private async generateAdminTokens(
    userId: string,
    email: string,
    rememberMe = false
  ) {
    const payload = {
      sub: userId,
      username: email,
      role: 'ADMIN',
      userType: 'ADMIN' as const,
    };

    // Set token expiration based on rememberMe preference
    const accessTokenExpiry = rememberMe ? '7d' : '1d'; // Extended: 7 days, Normal: 1 day

    // Generate access token with appropriate expiration
    const access_token = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiry,
    });

    // Generate refresh token (cryptographically secure)
    const refresh_token = randomBytes(32).toString('hex');

    // Store refresh token in database (hashed for security)
    const hashedRefreshToken = createHash('sha256')
      .update(refresh_token)
      .digest('hex');

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      access_token,
      refresh_token,
      rememberMe, // Return the flag for cookie configuration
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    this.logger.log(`Change password attempt for user: ${userId}`);
    const { currentPassword, newPassword } = changePasswordDto;

    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`Change password failed - user not found: ${userId}`);
      throw new UnauthorizedException('User not found');
    }

    // Users authenticated via Google don't have a password
    if (!user.password) {
      this.logger.warn(`Change password failed - user authenticated via Google: ${userId}`);
      throw new UnauthorizedException(
        'Cannot change password for accounts authenticated via Google. Please use Google to manage your account security.'
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Change password failed - invalid current password for user: ${userId}`);
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      this.logger.warn(`Change password failed - new password same as current for user: ${userId}`);
      throw new UnauthorizedException(
        'New password must be different from current password'
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all existing refresh tokens for security
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    this.logger.log(`Password changed successfully for user: ${userId}`);
    this.logProducer.info('auth-service', 'security', 'Password changed successfully', {
      userId,
      metadata: { action: 'change_password' },
    });

    return {
      message: 'Password changed successfully. Please log in again with your new password.',
    };
  }
}
