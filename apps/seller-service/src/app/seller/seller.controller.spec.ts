import { Test, TestingModule } from '@nestjs/testing';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { ServiceAuthUtil } from './service-auth.util';
import { TestUtils } from '../../test/test-utils';
import { TestDataFactory } from '../../test/factories';
import type { CreateSellerProfileDto } from '@tec-shop/dto';

// Mock the ServiceAuthUtil
jest.mock('./service-auth.util');

describe('SellerController', () => {
  let controller: SellerController;
  let sellerService: jest.Mocked<SellerService>;
  let module: TestingModule;

  const mockSellerService = {
    createProfile: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    createOrUpdateShop: jest.fn(),
    getShop: jest.fn(),
    getDashboardData: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [SellerController],
      providers: [
        {
          provide: SellerService,
          useValue: mockSellerService,
        },
      ],
    }).compile();

    controller = module.get<SellerController>(SellerController);
    sellerService = module.get(SellerService);

    // Reset all mocks
    TestUtils.resetAllMocks(mockSellerService);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('createProfile', () => {
    it('should create seller profile successfully', async () => {
      // Arrange
      const createProfileDto = TestDataFactory.createSellerProfileDto();
      const expectedResult = TestDataFactory.createSellerEntity(createProfileDto);

      sellerService.createProfile.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.createProfile(createProfileDto);

      // Assert
      expect(sellerService.createProfile).toHaveBeenCalledWith(createProfileDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle service errors', async () => {
      // Arrange
      const createProfileDto = TestDataFactory.createSellerProfileDto();
      const serviceError = new Error('Service unavailable');

      sellerService.createProfile.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.createProfile(createProfileDto)).rejects.toThrow(serviceError);
    });
  });

  describe('createProfileSigned', () => {
    it('should verify signature and create profile for valid signed request', async () => {
      // Arrange
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = TestDataFactory.createSignedRequest(profileData);
      const expectedResult = TestDataFactory.createSellerEntity(profileData);

      // Mock successful verification
      (ServiceAuthUtil.deriveServiceSecret as jest.Mock).mockReturnValue('mock-secret');
      (ServiceAuthUtil.verifyRequest as jest.Mock).mockReturnValue({ valid: true });

      sellerService.createProfile.mockResolvedValue(expectedResult);

      // Set environment variable for test
      process.env.SERVICE_MASTER_SECRET = 'test-master-secret';

      // Act
      const result = await controller.createProfileSigned(signedRequest);

      // Assert
      expect(ServiceAuthUtil.deriveServiceSecret).toHaveBeenCalledWith(
        'test-master-secret',
        'auth-service'
      );
      expect(ServiceAuthUtil.verifyRequest).toHaveBeenCalledWith(
        signedRequest,
        'auth-service',
        'mock-secret'
      );
      expect(sellerService.createProfile).toHaveBeenCalledWith(profileData);
      expect(result).toEqual(expectedResult);
    });

    it('should reject invalid signed request', async () => {
      // Arrange
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = TestDataFactory.createSignedRequest(profileData, {
        signature: 'invalid-signature',
      });

      // Mock failed verification
      (ServiceAuthUtil.deriveServiceSecret as jest.Mock).mockReturnValue('mock-secret');
      (ServiceAuthUtil.verifyRequest as jest.Mock).mockReturnValue({
        valid: false,
        reason: 'invalid_signature',
      });

      process.env.SERVICE_MASTER_SECRET = 'test-master-secret';

      // Act & Assert
      await expect(controller.createProfileSigned(signedRequest)).rejects.toThrow(
        'Invalid service request: invalid_signature'
      );
      expect(sellerService.createProfile).not.toHaveBeenCalled();
    });

    it('should handle expired signed request', async () => {
      // Arrange
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = TestDataFactory.createSignedRequest(profileData, {
        timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      });

      (ServiceAuthUtil.deriveServiceSecret as jest.Mock).mockReturnValue('mock-secret');
      (ServiceAuthUtil.verifyRequest as jest.Mock).mockReturnValue({
        valid: false,
        reason: 'request_expired',
      });

      // Act & Assert
      await expect(controller.createProfileSigned(signedRequest)).rejects.toThrow(
        'Invalid service request: request_expired'
      );
    });

    it('should handle wrong service ID in signed request', async () => {
      // Arrange
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = TestDataFactory.createSignedRequest(profileData, {
        serviceId: 'wrong-service',
      });

      (ServiceAuthUtil.deriveServiceSecret as jest.Mock).mockReturnValue('mock-secret');
      (ServiceAuthUtil.verifyRequest as jest.Mock).mockReturnValue({
        valid: false,
        reason: 'invalid_service_id',
      });

      // Act & Assert
      await expect(controller.createProfileSigned(signedRequest)).rejects.toThrow(
        'Invalid service request: invalid_service_id'
      );
    });
  });

  describe('getProfile', () => {
    it('should return seller profile', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const expectedResult = TestDataFactory.createSellerWithShop();

      sellerService.getProfile.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getProfile(authId);

      // Assert
      expect(sellerService.getProfile).toHaveBeenCalledWith(authId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateProfile', () => {
    it('should update seller profile', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const updateData = { name: 'Updated Name' };
      const payload = { authId, updateData };
      const expectedResult = TestDataFactory.createSellerEntity({ ...updateData });

      sellerService.updateProfile.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.updateProfile(payload);

      // Assert
      expect(sellerService.updateProfile).toHaveBeenCalledWith(authId, updateData);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createOrUpdateShop', () => {
    it('should create new shop', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const shopData = TestDataFactory.createShopDto();
      const payload = { authId, shopData };
      const expectedResult = TestDataFactory.createShopEntity('seller-id', shopData);

      sellerService.createOrUpdateShop.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.createOrUpdateShop(payload);

      // Assert
      expect(sellerService.createOrUpdateShop).toHaveBeenCalledWith(authId, shopData);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getShop', () => {
    it('should return seller shop', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const expectedResult = TestDataFactory.createShopEntity('seller-id');

      sellerService.getShop.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getShop(authId);

      // Assert
      expect(sellerService.getShop).toHaveBeenCalledWith(authId);
      expect(result).toEqual(expectedResult);
    });

    it('should return null when no shop exists', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();

      sellerService.getShop.mockResolvedValue(null);

      // Act
      const result = await controller.getShop(authId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard data', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const seller = TestDataFactory.createSellerEntity();
      const shop = TestDataFactory.createShopEntity(seller.id);
      const expectedResult = TestDataFactory.createDashboardData(seller, shop);

      sellerService.getDashboardData.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getDashboardData(authId);

      // Assert
      expect(sellerService.getDashboardData).toHaveBeenCalledWith(authId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors correctly', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const serviceError = new Error('Database connection failed');

      sellerService.getProfile.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.getProfile(authId)).rejects.toThrow(serviceError);
    });

    it('should handle malformed payload gracefully', async () => {
      // Arrange
      const malformedPayload = { authId: null, updateData: undefined };

      sellerService.updateProfile.mockRejectedValue(new Error('Invalid input'));

      // Act & Assert
      await expect(controller.updateProfile(malformedPayload as { authId: string; updateData: Partial<CreateSellerProfileDto> })).rejects.toThrow('Invalid input');
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      // Arrange
      const authIds = Array.from({ length: 10 }, () => TestUtils.generateRandomObjectId());
      const mockResults = authIds.map(id => TestDataFactory.createSellerEntity({ authId: id }));

      sellerService.getProfile.mockImplementation((authId: string) =>
        Promise.resolve(mockResults.find(result => result.authId === authId))
      );

      // Act
      const startTime = Date.now();
      const results = await Promise.all(
        authIds.map(authId => controller.getProfile(authId))
      );
      const duration = Date.now() - startTime;

      // Assert
      expect(results).toHaveLength(authIds.length);
      expect(duration).toBeLessThan(100); // Should be very fast for mocked calls
      expect(sellerService.getProfile).toHaveBeenCalledTimes(authIds.length);
    });
  });

  describe('Security Tests', () => {
    it('should reject signed request without master secret', async () => {
      // Arrange
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = TestDataFactory.createSignedRequest(profileData);

      const originalSecret = process.env.SERVICE_MASTER_SECRET;
      delete process.env.SERVICE_MASTER_SECRET;

      // Act & Assert
      await expect(controller.createProfileSigned(signedRequest)).rejects.toThrow(
        'SERVICE_MASTER_SECRET environment variable is not configured'
      );

      // Restore
      if (originalSecret) {
        process.env.SERVICE_MASTER_SECRET = originalSecret;
      }
    });

    it('should validate all signed request components', async () => {
      // Arrange
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = {
        payload: profileData,
        signature: '', // Empty signature
        timestamp: 0, // Invalid timestamp
        serviceId: '', // Empty service ID
      };

      // Ensure SERVICE_MASTER_SECRET is set for this test
      const originalSecret = process.env.SERVICE_MASTER_SECRET;
      process.env.SERVICE_MASTER_SECRET = 'test-master-secret';

      (ServiceAuthUtil.deriveServiceSecret as jest.Mock).mockReturnValue('mock-secret');
      (ServiceAuthUtil.verifyRequest as jest.Mock).mockReturnValue({
        valid: false,
        reason: 'invalid_signature',
      });

      // Act & Assert
      await expect(controller.createProfileSigned(signedRequest)).rejects.toThrow(
        'Invalid service request: invalid_signature'
      );

      // Restore
      if (originalSecret) {
        process.env.SERVICE_MASTER_SECRET = originalSecret;
      } else {
        delete process.env.SERVICE_MASTER_SECRET;
      }
    });
  });
});