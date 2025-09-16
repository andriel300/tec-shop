import { Injectable, UnauthorizedException, ConflictException, Inject, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { SignupDto } from '../dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/login.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy
  ) {}

  async onModuleInit() {
    await this.userClient.connect();
  }

  async signup(signupDto: SignupDto) {
    const { email, password, name } = signupDto;

    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.users.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Create the user profile in the user-service
    this.userClient.emit('create-user-profile', {
      userId: user.id,
      email: user.email,
      name,
    });

    return this.generateToken(user.id, user.email);
  }

  async login(credential: LoginDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: credential.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Credentials are not valid');
    }

    const isPasswordMatching = await bcrypt.compare(
      credential.password,
      user.password
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credentials are not valid');
    }

    return this.generateToken(user.id, user.email);
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
