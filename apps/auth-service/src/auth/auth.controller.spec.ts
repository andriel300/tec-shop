import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        // Add mocks for other services that are now required by the controller
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: RedisService, useValue: { set: jest.fn(), get: jest.fn(), del: jest.fn() } },
        { provide: EmailService, useValue: { sendOtp: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with the correct parameters', async () => {
      const registerUserDto: RegisterUserDto = {
        email: 'test@example.com',
        password: 'password',
      };

      await controller.register(registerUserDto);

      expect(authService.register).toHaveBeenCalledWith(registerUserDto);
    });
  });
});
