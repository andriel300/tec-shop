import {
  ConflictException,
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ClientProxy } from '@nestjs/microservices';
import { AuthPrismaService } from '../../prisma/prisma.service';
import { LoginDto, SignupDto, VerifyEmailDto } from '@tec-shop/shared/dto';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private jwtService: JwtService,
    private prisma: AuthPrismaService,
    private redisService: RedisService,
    private emailService: EmailService,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  async onModuleInit() {
    console.log('AuthService: Initializing module...');

    // 1. Test User Service connection
    try {
      await this.userClient.connect();
      console.log('AuthService: User Service client connected successfully.');
    } catch (err) {
      console.error('AuthService: FAILED to connect to User Service client.', err);
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

    // Generate and store OTP and name
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const redisPayload = JSON.stringify({ otp, name });
    await this.redisService.set(
      `verification-otp:${user.id}`,
      redisPayload,
      600,
    );

    // Send verification email
    await this.emailService.sendOtp(user.email, otp);

    // We will not emit an event or return a token until the user is verified.
    return {
      message: 'Signup successful. Please check your email to verify your account.',
    };
  }

  async login(credential: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: credential.email },
    });

    if (!user || !user.password || !user.isEmailVerified) {
      throw new UnauthorizedException(
        'Credentials are not valid or email not verified',
      );
    }

    const isPasswordMatching = await bcrypt.compare(
      credential.password,
      user.password,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credentials are not valid');
    }

    return this.generateToken(user.id, user.email);
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const redisPayload = await this.redisService.get(
      `verification-otp:${user.id}`,
    );

    if (!redisPayload) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const { otp: storedOtp, name } = JSON.parse(redisPayload);

    if (storedOtp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    await this.redisService.del(`verification-otp:${user.id}`);

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
    } catch (err) {
      return { valid: false, userId: null, role: null };
    }
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
