import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CreateUserProfileDto, UpdateUserDto } from '@tec-shop/dto';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getUserProfile: jest.fn(),
            updateUserProfile: jest.fn(),
            createUserProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserProfile', () => {
    it('should call AppService.getUserProfile with the correct userId', async () => {
      const userId = 'user1';
      await controller.getUserProfile(userId);
      expect(service.getUserProfile).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateUserProfile', () => {
    it('should call AppService.updateUserProfile with the correct payload', async () => {
      const payload = { userId: 'user1', data: { name: 'New Name' } as UpdateUserDto };
      await controller.updateUserProfile(payload);
      expect(service.updateUserProfile).toHaveBeenCalledWith(payload.userId, payload.data);
    });
  });

  describe('createUserProfile', () => {
    it('should call AppService.createUserProfile with the correct data', async () => {
      const data: CreateUserProfileDto = {
        userId: 'user1',
        email: 'test@example.com',
        name: 'Test User',
      };
      await controller.createUserProfile(data);
      expect(service.createUserProfile).toHaveBeenCalledWith(data);
    });
  });
});