import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupUserDto } from './dto/signup-user.dto';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
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

  describe('signup', () => {
    it('should call authService.signup', async () => {
      const dto: SignupUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
      };
      await controller.signup(dto);
      expect(authService.signup).toHaveBeenCalledWith(dto);
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
