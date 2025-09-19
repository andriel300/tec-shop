import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto, VerifyEmailDto } from '@tec-shop/shared/dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn(),
            verifyEmail: jest.fn(),
            login: jest.fn(),
            validateToken: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup with the provided data', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };
      const expectedResult = { message: 'User registered successfully' };
      jest.spyOn(authService, 'signup').mockResolvedValue(expectedResult);

      const result = await authController.signup(signupDto);
      expect(authService.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail with the provided data', async () => {
      const verifyEmailDto: VerifyEmailDto = { token: 'some-token' };
      const expectedResult = { message: 'Email verified successfully' };
      jest.spyOn(authService, 'verifyEmail').mockResolvedValue(expectedResult);

      const result = await authController.verifyEmail(verifyEmailDto);
      expect(authService.verifyEmail).toHaveBeenCalledWith(verifyEmailDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login with the provided data', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = { accessToken: 'mockAccessToken' };
      jest.spyOn(authService, 'login').mockResolvedValue(expectedResult);

      const result = await authController.login(loginDto);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('validateToken', () => {
    it('should call authService.validateToken with the provided token', async () => {
      const token = 'some-jwt-token';
      const expectedResult = { userId: '123', email: 'test@example.com' };
      jest.spyOn(authService, 'validateToken').mockResolvedValue(expectedResult);

      const result = await authController.validateToken(token);
      expect(authService.validateToken).toHaveBeenCalledWith(token);
      expect(result).toEqual(expectedResult);
    });
  });
});
