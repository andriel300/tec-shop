import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    generateOtp: jest.fn(),
    verifyOtp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const dto: RegisterUserDto = {
        email: 'test@example.com',
        password: 'password',
      };
      await controller.register(dto);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('generateOtp', () => {
    it('should call authService.generateOtp', async () => {
      const dto: GenerateOtpDto = { email: 'test@example.com' };
      await controller.generateOtp(dto);
      expect(authService.generateOtp).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifyOtp', () => {
    it('should call authService.verifyOtp', async () => {
      const dto: VerifyOtpDto = { email: 'test@example.com', otp: '123456' };
      await controller.verifyOtp(dto);
      expect(authService.verifyOtp).toHaveBeenCalledWith(dto);
    });
  });
});
