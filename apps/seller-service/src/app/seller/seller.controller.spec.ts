import { Test, TestingModule } from '@nestjs/testing';
import { SellerController } from './seller.controller';
import { SellerProfileService } from './seller-profile.service';
import { ShopService } from './shop.service';
import { ServiceAuthUtil } from '@tec-shop/service-auth';
import { TestUtils } from '../../test/test-utils';
import { TestDataFactory } from '../../test/factories';
import type { CreateSellerProfileDto } from '@tec-shop/dto';

jest.mock('@tec-shop/service-auth');

describe('SellerController', () => {
  let controller: SellerController;
  let sellerProfile: jest.Mocked<SellerProfileService>;
  let shopService: jest.Mocked<ShopService>;
  let module: TestingModule;

  const mockSellerProfileService = {
    createProfile: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getDashboardData: jest.fn(),
    updateNotificationPreferences: jest.fn(),
    getNotificationPreferences: jest.fn(),
  };

  const mockShopService = {
    createShop: jest.fn(),
    createOrUpdateShop: jest.fn(),
    getShop: jest.fn(),
    verifyShopExists: jest.fn(),
    getShopById: jest.fn(),
    verifyShopOwnership: jest.fn(),
    getFilteredShops: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [SellerController],
      providers: [
        { provide: SellerProfileService, useValue: mockSellerProfileService },
        { provide: ShopService, useValue: mockShopService },
      ],
    }).compile();

    controller = module.get<SellerController>(SellerController);
    sellerProfile = module.get(SellerProfileService);
    shopService = module.get(ShopService);

    TestUtils.resetAllMocks(mockSellerProfileService);
    TestUtils.resetAllMocks(mockShopService);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('createProfile', () => {
    it('should create seller profile successfully', async () => {
      const createProfileDto = TestDataFactory.createSellerProfileDto();
      const expectedResult = TestDataFactory.createSellerEntity(createProfileDto);

      sellerProfile.createProfile.mockResolvedValue(expectedResult);

      const result = await controller.createProfile(createProfileDto);

      expect(sellerProfile.createProfile).toHaveBeenCalledWith(createProfileDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle service errors', async () => {
      const createProfileDto = TestDataFactory.createSellerProfileDto();
      const serviceError = new Error('Service unavailable');

      sellerProfile.createProfile.mockRejectedValue(serviceError);

      await expect(controller.createProfile(createProfileDto)).rejects.toThrow(serviceError);
    });
  });

  describe('createProfileSigned', () => {
    it('should verify signature and create profile for valid signed request', async () => {
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = TestDataFactory.createSignedRequest(profileData);
      const expectedResult = TestDataFactory.createSellerEntity(profileData);

      (ServiceAuthUtil.deriveServiceSecret as jest.Mock).mockReturnValue('mock-secret');
      (ServiceAuthUtil.verifyRequest as jest.Mock).mockReturnValue({ valid: true });

      sellerProfile.createProfile.mockResolvedValue(expectedResult);

      process.env.SERVICE_MASTER_SECRET = 'test-master-secret';

      const result = await controller.createProfileSigned(signedRequest);

      expect(ServiceAuthUtil.deriveServiceSecret).toHaveBeenCalledWith(
        'test-master-secret',
        'auth-service'
      );
      expect(ServiceAuthUtil.verifyRequest).toHaveBeenCalledWith(
        signedRequest,
        'auth-service',
        'mock-secret'
      );
      expect(sellerProfile.createProfile).toHaveBeenCalledWith(profileData);
      expect(result).toEqual(expectedResult);
    });

    it('should reject invalid signed request', async () => {
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = TestDataFactory.createSignedRequest(profileData, {
        signature: 'invalid-signature',
      });

      (ServiceAuthUtil.deriveServiceSecret as jest.Mock).mockReturnValue('mock-secret');
      (ServiceAuthUtil.verifyRequest as jest.Mock).mockReturnValue({
        valid: false,
        reason: 'invalid_signature',
      });

      process.env.SERVICE_MASTER_SECRET = 'test-master-secret';

      await expect(controller.createProfileSigned(signedRequest)).rejects.toThrow(
        'Invalid service request: invalid_signature'
      );
      expect(sellerProfile.createProfile).not.toHaveBeenCalled();
    });

    it('should handle expired signed request', async () => {
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = TestDataFactory.createSignedRequest(profileData, {
        timestamp: Math.floor(Date.now() / 1000) - 3600,
      });

      (ServiceAuthUtil.deriveServiceSecret as jest.Mock).mockReturnValue('mock-secret');
      (ServiceAuthUtil.verifyRequest as jest.Mock).mockReturnValue({
        valid: false,
        reason: 'request_expired',
      });

      await expect(controller.createProfileSigned(signedRequest)).rejects.toThrow(
        'Invalid service request: request_expired'
      );
    });

    it('should handle wrong service ID in signed request', async () => {
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = TestDataFactory.createSignedRequest(profileData, {
        serviceId: 'wrong-service',
      });

      (ServiceAuthUtil.deriveServiceSecret as jest.Mock).mockReturnValue('mock-secret');
      (ServiceAuthUtil.verifyRequest as jest.Mock).mockReturnValue({
        valid: false,
        reason: 'invalid_service_id',
      });

      await expect(controller.createProfileSigned(signedRequest)).rejects.toThrow(
        'Invalid service request: invalid_service_id'
      );
    });
  });

  describe('getProfile', () => {
    it('should return seller profile', async () => {
      const authId = TestUtils.generateRandomObjectId();
      const expectedResult = TestDataFactory.createSellerWithShop();

      sellerProfile.getProfile.mockResolvedValue(expectedResult);

      const result = await controller.getProfile(authId);

      expect(sellerProfile.getProfile).toHaveBeenCalledWith(authId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateProfile', () => {
    it('should update seller profile', async () => {
      const authId = TestUtils.generateRandomObjectId();
      const updateData = { name: 'Updated Name' };
      const payload = { authId, updateData };
      const expectedResult = TestDataFactory.createSellerEntity({ ...updateData });

      sellerProfile.updateProfile.mockResolvedValue(expectedResult);

      const result = await controller.updateProfile(payload);

      expect(sellerProfile.updateProfile).toHaveBeenCalledWith(authId, updateData);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createOrUpdateShop', () => {
    it('should create new shop', async () => {
      const authId = TestUtils.generateRandomObjectId();
      const shopData = TestDataFactory.createShopDto();
      const payload = { authId, shopData };
      const expectedResult = TestDataFactory.createShopEntity('seller-id', shopData);

      shopService.createOrUpdateShop.mockResolvedValue(expectedResult);

      const result = await controller.createOrUpdateShop(payload);

      expect(shopService.createOrUpdateShop).toHaveBeenCalledWith(authId, shopData);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getShop', () => {
    it('should return seller shop', async () => {
      const authId = TestUtils.generateRandomObjectId();
      const expectedResult = TestDataFactory.createShopEntity('seller-id');

      shopService.getShop.mockResolvedValue(expectedResult);

      const result = await controller.getShop(authId);

      expect(shopService.getShop).toHaveBeenCalledWith(authId);
      expect(result).toEqual(expectedResult);
    });

    it('should return null when no shop exists', async () => {
      const authId = TestUtils.generateRandomObjectId();

      shopService.getShop.mockResolvedValue(null);

      const result = await controller.getShop(authId);

      expect(result).toBeNull();
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard data', async () => {
      const authId = TestUtils.generateRandomObjectId();
      const seller = TestDataFactory.createSellerEntity();
      const shop = TestDataFactory.createShopEntity(seller.id);
      const expectedResult = TestDataFactory.createDashboardData(seller, shop);

      sellerProfile.getDashboardData.mockResolvedValue(expectedResult);

      const result = await controller.getDashboardData(authId);

      expect(sellerProfile.getDashboardData).toHaveBeenCalledWith(authId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors correctly', async () => {
      const authId = TestUtils.generateRandomObjectId();
      const serviceError = new Error('Database connection failed');

      sellerProfile.getProfile.mockRejectedValue(serviceError);

      await expect(controller.getProfile(authId)).rejects.toThrow(serviceError);
    });

    it('should handle malformed payload gracefully', async () => {
      const malformedPayload = { authId: null, updateData: undefined };

      sellerProfile.updateProfile.mockRejectedValue(new Error('Invalid input'));

      await expect(controller.updateProfile(malformedPayload as { authId: string; updateData: Partial<CreateSellerProfileDto> })).rejects.toThrow('Invalid input');
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const authIds = Array.from({ length: 10 }, () => TestUtils.generateRandomObjectId());
      const mockResults = authIds.map(id => TestDataFactory.createSellerEntity({ authId: id }));

      sellerProfile.getProfile.mockImplementation((authId: string) =>
        Promise.resolve(mockResults.find(result => result.authId === authId))
      );

      const startTime = Date.now();
      const results = await Promise.all(
        authIds.map(authId => controller.getProfile(authId))
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(authIds.length);
      expect(duration).toBeLessThan(100);
      expect(sellerProfile.getProfile).toHaveBeenCalledTimes(authIds.length);
    });
  });

  describe('Security Tests', () => {
    it('should reject signed request without master secret', async () => {
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = TestDataFactory.createSignedRequest(profileData);

      const originalSecret = process.env.SERVICE_MASTER_SECRET;
      delete process.env.SERVICE_MASTER_SECRET;

      await expect(controller.createProfileSigned(signedRequest)).rejects.toThrow(
        'SERVICE_MASTER_SECRET environment variable is not configured'
      );

      if (originalSecret) {
        process.env.SERVICE_MASTER_SECRET = originalSecret;
      }
    });

    it('should validate all signed request components', async () => {
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = {
        payload: profileData,
        signature: '',
        timestamp: 0,
        serviceId: '',
      };

      const originalSecret = process.env.SERVICE_MASTER_SECRET;
      process.env.SERVICE_MASTER_SECRET = 'test-master-secret';

      (ServiceAuthUtil.deriveServiceSecret as jest.Mock).mockReturnValue('mock-secret');
      (ServiceAuthUtil.verifyRequest as jest.Mock).mockReturnValue({
        valid: false,
        reason: 'invalid_signature',
      });

      await expect(controller.createProfileSigned(signedRequest)).rejects.toThrow(
        'Invalid service request: invalid_signature'
      );

      if (originalSecret) {
        process.env.SERVICE_MASTER_SECRET = originalSecret;
      } else {
        delete process.env.SERVICE_MASTER_SECRET;
      }
    });
  });
});
