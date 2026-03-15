import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { UserProfileService } from './user-profile.service';
import { ShopFollowService } from './shop-follow.service';
import { ShippingAddressService } from './shipping-address.service';
import { CreateUserProfileDto, UpdateUserDto } from '@tec-shop/dto';

describe('AppController', () => {
  let controller: AppController;
  let userProfileService: UserProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: UserProfileService,
          useValue: {
            getUserProfile: jest.fn(),
            updateUserProfile: jest.fn(),
            createUserProfile: jest.fn(),
          },
        },
        {
          provide: ShopFollowService,
          useValue: {
            followShop: jest.fn(),
            unfollowShop: jest.fn(),
            getShopFollowersCount: jest.fn(),
            checkUserFollowsShop: jest.fn(),
            getUserFollowedShops: jest.fn(),
          },
        },
        {
          provide: ShippingAddressService,
          useValue: {
            createShippingAddress: jest.fn(),
            getShippingAddresses: jest.fn(),
            getShippingAddress: jest.fn(),
            updateShippingAddress: jest.fn(),
            deleteShippingAddress: jest.fn(),
            setDefaultShippingAddress: jest.fn(),
            copyShippingAddress: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    userProfileService = module.get<UserProfileService>(UserProfileService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserProfile', () => {
    it('should call UserProfileService.getUserProfile with the correct userId', async () => {
      const userId = 'user1';
      await controller.getUserProfile(userId);
      expect(userProfileService.getUserProfile).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateUserProfile', () => {
    it('should call UserProfileService.updateUserProfile with the correct payload', async () => {
      const payload = { userId: 'user1', data: { name: 'New Name' } as UpdateUserDto };
      await controller.updateUserProfile(payload);
      expect(userProfileService.updateUserProfile).toHaveBeenCalledWith(payload.userId, payload.data);
    });
  });

  describe('createUserProfile', () => {
    it('should call UserProfileService.createUserProfile with the correct data', async () => {
      const data: CreateUserProfileDto = {
        userId: 'user1',
        name: 'Test User',
      };
      await controller.createUserProfile(data);
      expect(userProfileService.createUserProfile).toHaveBeenCalledWith(data);
    });
  });
});
