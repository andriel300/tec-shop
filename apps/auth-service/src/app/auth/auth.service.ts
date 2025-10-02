import {
  ConflictException,
  Inject,
  Injectable,
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
} from '@tec-shop/dto';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { ServiceAuthUtil } from './service-auth.util';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private jwtService: JwtService,
    private prisma: AuthPrismaService,
    private redisService: RedisService,
    private emailService: EmailService,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    @Inject('SELLER_SERVICE') private readonly sellerClient: ClientProxy
  ) {}

  async onModuleInit() {
    console.log('AuthService: Initializing module...');

    // 1. Test User Service connection
    try {
      await this.userClient.connect();
      console.log('AuthService: User Service client connected successfully.');
    } catch (err) {
      console.error(
        'AuthService: FAILED to connect to User Service client.',
        err
      );
    }

    // 2. Test Redis connection
    try {
      await this.redisService.get('ping'); // Use a simple command to check connection
      console.log('AuthService: Redis connected successfully.');
    } catch (err) {
      console.error('AuthService: FAILED to connect to Redis.', err);
    }
  }

  async signup(signupDto: SignupDto) {
    const { email, password, name } = signupDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isEmailVerified: false,
      },
    });

    // Generate and store OTP and name using cryptographically secure random
    const otp = randomInt(100000, 1000000).toString().padStart(6, '0');
    const redisPayload = JSON.stringify({ otp, name });
    await this.redisService.set(
      `verification-otp:${user.id}`,
      redisPayload,
      600
    );

    // Send verification email
    await this.emailService.sendOtp(user.email, otp);

    // We will not emit an event or return a token until the user is verified.
    return {
      message:
        'Signup successful. Please check your email to verify your account.',
    };
  }

  async sellerSignup(sellerSignupDto: SellerSignupDto) {
    const { email, password, name, phoneNumber, country } = sellerSignupDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isEmailVerified: false,
        userType: 'SELLER', // Mark as seller type
      },
    });

    // Generate and store OTP with seller profile data
    const otp = randomInt(100000, 1000000).toString().padStart(6, '0');
    const redisPayload = JSON.stringify({
      otp,
      name,
      phoneNumber,
      country,
      userType: 'SELLER'
    });
    await this.redisService.set(
      `verification-otp:${user.id}`,
      redisPayload,
      600
    );

    // Send verification email
    await this.emailService.sendOtp(user.email, otp);

    return {
      message:
        'Seller signup successful. Please check your email to verify your account.',
    };
  }

  async login(credential: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: credential.email },
    });

    // Generic error message to prevent email enumeration
    const genericError = 'Invalid credentials';

    if (!user || !user.password || !user.isEmailVerified) {
      throw new UnauthorizedException(genericError);
    }

    const isPasswordMatching = await bcrypt.compare(
      credential.password,
      user.password
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException(genericError);
    }

    // Pass rememberMe flag to token generation for extended session
    return this.generateTokens(user.id, user.email, credential.rememberMe);
  }

  async sellerLogin(credential: LoginDto) {
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
      throw new UnauthorizedException(genericError);
    }

    const isPasswordMatching = await bcrypt.compare(
      credential.password,
      user.password
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException(genericError);
    }

    // Generate tokens for seller with proper role and userType
    return this.generateSellerTokens(
      user.id,
      user.email,
      credential.rememberMe
    );
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

    // Create the user profile in the user-service now that email is verified
    try {
      await firstValueFrom(
        this.userClient.send('create-user-profile', {
          userId: user.id,
          name,
        })
      );
      console.log(`User profile created successfully for user ${user.id}`);
    } catch (error) {
      console.error('Failed to create user profile in user-service:', error);
      // Log the error but don't fail the email verification process
      // The user profile can be created later if needed
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

    const { otp: storedOtp, name, phoneNumber, country, userType } = JSON.parse(redisPayload);

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

      const serviceSecret = ServiceAuthUtil.deriveServiceSecret(
        process.env.SERVICE_MASTER_SECRET || 'default-secret',
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
      console.log(`Seller profile created successfully for user ${user.id}`);
    } catch (error) {
      console.error('Failed to create seller profile in seller-service:', error);
      // Log the error but don't fail the email verification process
    }

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
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      wasRememberMe
    );

    return tokens;
  }

  async revokeRefreshToken(userId: string) {
    // Clear the refresh token from database
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Refresh token revoked successfully' };
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
      role: 'user',
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
      role: 'seller',
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
}
