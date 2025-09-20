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
import { AuthPrismaService } from '../../prisma/prisma.service';
import { LoginDto, SignupDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto } from '@tec-shop/dto';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private jwtService: JwtService,
    private prisma: AuthPrismaService,
    private redisService: RedisService,
    private emailService: EmailService,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy
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

    return this.generateToken(user.id, user.email);
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
      throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
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
    this.userClient.emit('create-user-profile', {
      userId: user.id,
      email: user.email,
      name,
    });

    return { message: 'Email verified successfully.' };
  }

  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return { valid: true, userId: decoded.sub, role: decoded.role };
    } catch {
      return { valid: false, userId: null, role: null };
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    const successMessage = 'If an account with this email exists, you will receive a password reset link.';

    if (!user || !user.isEmailVerified) {
      return { message: successMessage };
    }

    // Generate cryptographically secure reset token
    const resetToken = randomBytes(32).toString('hex');

    // Store SHA-256 hash of the token (not the token itself)
    const tokenHash = createHash('sha256').update(resetToken).digest('hex');

    // Store in Redis with 15-minute expiry
    await this.redisService.set(
      `password-reset:${tokenHash}`,
      user.id,
      900 // 15 minutes
    );

    // Send reset email with the original token (not the hash)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    await this.emailService.sendPasswordResetLink(user.email, resetLink);

    return { message: successMessage };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    // Hash the provided token to look up in Redis
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Check if token exists and get user ID
    const userId = await this.redisService.get(`password-reset:${tokenHash}`);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Check reset attempt limiting
    const attemptKey = `reset-attempts:${tokenHash}`;
    const attemptsStr = await this.redisService.get(attemptKey);
    const attempts = attemptsStr ? parseInt(attemptsStr) : 0;

    if (attempts >= 5) {
      // Clean up token after max attempts
      await this.redisService.del(`password-reset:${tokenHash}`);
      throw new UnauthorizedException('Too many failed attempts. Please request a new reset link.');
    }

    // Get user to verify they still exist
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      await this.redisService.del(`password-reset:${tokenHash}`);
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Clean up reset token and attempts
    await this.redisService.del(`password-reset:${tokenHash}`);
    await this.redisService.del(`reset-attempts:${tokenHash}`);

    // Send confirmation email
    await this.emailService.sendPasswordChangedNotification(user.email);

    return { message: 'Password has been reset successfully.' };
  }

  private generateToken(userId: string, email: string) {
    const payload = {
      sub: userId,
      username: email,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
