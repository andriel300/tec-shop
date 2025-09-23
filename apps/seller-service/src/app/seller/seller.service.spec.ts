import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SellerService } from './seller.service';
import { SellerPrismaService } from '../../prisma/prisma.service';
import { TestUtils, MockPrismaService, mockPrismaProvider } from '../../test/test-utils';
import { TestDataFactory } from '../../test/factories';

describe('SellerService', () => {
  let service: SellerService;
  let prisma: MockPrismaService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        SellerService,
        mockPrismaProvider,
      ],
    }).compile();

    service = module.get<SellerService>(SellerService);
    prisma = module.get<MockPrismaService>(SellerPrismaService);

    // Reset all mocks before each test
    TestUtils.resetAllMocks({ prisma });
  });

  afterEach(async () => {
    await module.close();
  });

  describe('createProfile', () => {
    it('should create a new seller profile when seller does not exist', async () => {
      // Arrange
      const createProfileDto = TestDataFactory.createSellerProfileDto();
      const expectedSeller = TestDataFactory.createSellerEntity({
        authId: createProfileDto.authId,
        name: createProfileDto.name,
        email: createProfileDto.email,
        phoneNumber: createProfileDto.phoneNumber,
        country: createProfileDto.country,
      });

      prisma.seller.findUnique.mockResolvedValue(null);
      prisma.seller.create.mockResolvedValue(expectedSeller);

      // Act
      const result = await service.createProfile(createProfileDto);

      // Assert
      expect(prisma.seller.findUnique).toHaveBeenCalledWith({
        where: { authId: createProfileDto.authId },
      });
      expect(prisma.seller.create).toHaveBeenCalledWith({
        data: {
          authId: createProfileDto.authId,
          name: createProfileDto.name,
          email: createProfileDto.email,
          phoneNumber: createProfileDto.phoneNumber,
          country: createProfileDto.country,
          isVerified: true,
        },
        include: { shop: true },
      });
      expect(result).toEqual(expectedSeller);
    });

    it('should return existing seller when seller already exists', async () => {
      // Arrange
      const createProfileDto = TestDataFactory.createSellerProfileDto();
      const existingSeller = TestDataFactory.createSellerEntity({
        authId: createProfileDto.authId,
      });

      prisma.seller.findUnique.mockResolvedValue(existingSeller);

      // Act
      const result = await service.createProfile(createProfileDto);

      // Assert
      expect(prisma.seller.findUnique).toHaveBeenCalledWith({
        where: { authId: createProfileDto.authId },
      });
      expect(prisma.seller.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingSeller);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const createProfileDto = TestDataFactory.createSellerProfileDto();
      const dbError = new Error('Database connection failed');

      prisma.seller.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.createProfile(createProfileDto)).rejects.toThrow(dbError);
    });
  });

  describe('getProfile', () => {
    it('should return seller profile when seller exists', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const expectedSeller = TestDataFactory.createSellerWithShop();

      prisma.seller.findUnique.mockResolvedValue(expectedSeller);

      // Act
      const result = await service.getProfile(authId);

      // Assert
      expect(prisma.seller.findUnique).toHaveBeenCalledWith({
        where: { authId },
        include: { shop: true },
      });
      expect(result).toEqual(expectedSeller);
    });

    it('should throw NotFoundException when seller does not exist', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();

      prisma.seller.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getProfile(authId)).rejects.toThrow(NotFoundException);
      await expect(service.getProfile(authId)).rejects.toThrow('Seller profile not found');
    });
  });

  describe('updateProfile', () => {
    it('should update seller profile successfully', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const updateData = { name: 'Updated Name', phoneNumber: '+1111111111' };
      const existingSeller = TestDataFactory.createSellerEntity({ authId });
      const updatedSeller = { ...existingSeller, ...updateData };

      prisma.seller.findUnique.mockResolvedValue(existingSeller);
      prisma.seller.update.mockResolvedValue(updatedSeller);

      // Act
      const result = await service.updateProfile(authId, updateData);

      // Assert
      expect(prisma.seller.findUnique).toHaveBeenCalledWith({
        where: { authId },
      });
      expect(prisma.seller.update).toHaveBeenCalledWith({
        where: { authId },
        data: updateData,
        include: { shop: true },
      });
      expect(result).toEqual(updatedSeller);
    });

    it('should throw NotFoundException when seller does not exist', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const updateData = { name: 'Updated Name' };

      prisma.seller.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateProfile(authId, updateData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createOrUpdateShop', () => {
    it('should create new shop when seller has no shop', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const shopData = TestDataFactory.createShopDto();
      const seller = TestDataFactory.createSellerEntity({ authId, shop: null });
      const expectedShop = TestDataFactory.createShopEntity(seller.id);

      prisma.seller.findUnique.mockResolvedValue(seller);
      prisma.shop.create.mockResolvedValue(expectedShop);

      // Act
      const result = await service.createOrUpdateShop(authId, shopData);

      // Assert
      expect(prisma.seller.findUnique).toHaveBeenCalledWith({
        where: { authId },
        include: { shop: true },
      });
      expect(prisma.shop.create).toHaveBeenCalledWith({
        data: {
          ...shopData,
          sellerId: seller.id,
        },
      });
      expect(result).toEqual(expectedShop);
    });

    it('should update existing shop when seller has shop', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const shopData = TestDataFactory.createShopDto();
      const shop = TestDataFactory.createShopEntity('seller-id');
      const seller = TestDataFactory.createSellerEntity({ authId, shop });
      const updatedShop = { ...shop, ...shopData };

      prisma.seller.findUnique.mockResolvedValue(seller);
      prisma.shop.update.mockResolvedValue(updatedShop);

      // Act
      const result = await service.createOrUpdateShop(authId, shopData);

      // Assert
      expect(prisma.shop.update).toHaveBeenCalledWith({
        where: { sellerId: seller.id },
        data: shopData,
      });
      expect(result).toEqual(updatedShop);
    });

    it('should throw NotFoundException when seller does not exist', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const shopData = TestDataFactory.createShopDto();

      prisma.seller.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createOrUpdateShop(authId, shopData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getShop', () => {
    it('should return shop when seller has shop', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const shop = TestDataFactory.createShopEntity('seller-id');
      const seller = TestDataFactory.createSellerEntity({ authId, shop });

      prisma.seller.findUnique.mockResolvedValue(seller);

      // Act
      const result = await service.getShop(authId);

      // Assert
      expect(result).toEqual(shop);
    });

    it('should return null when seller has no shop', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const seller = TestDataFactory.createSellerEntity({ authId, shop: null });

      prisma.seller.findUnique.mockResolvedValue(seller);

      // Act
      const result = await service.getShop(authId);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw NotFoundException when seller does not exist', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();

      prisma.seller.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getShop(authId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard data with shop when seller has shop', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const seller = TestDataFactory.createSellerWithShop();
      const expectedDashboardData = TestDataFactory.createDashboardData(seller, seller.shop);

      prisma.seller.findUnique.mockResolvedValue(seller);

      // Act
      const result = await service.getDashboardData(authId);

      // Assert
      expect(result).toEqual(expectedDashboardData);
    });

    it('should return dashboard data without shop when seller has no shop', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const seller = TestDataFactory.createSellerEntity({ authId, shop: null });
      const expectedDashboardData = TestDataFactory.createDashboardData(seller, null);

      prisma.seller.findUnique.mockResolvedValue(seller);

      // Act
      const result = await service.getDashboardData(authId);

      // Assert
      expect(result).toEqual(expectedDashboardData);
    });

    it('should throw NotFoundException when seller does not exist', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();

      prisma.seller.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getDashboardData(authId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed authId gracefully', async () => {
      // Arrange
      const malformedAuthId = 'invalid-auth-id';

      prisma.seller.findUnique.mockRejectedValue(new Error('Invalid ObjectId'));

      // Act & Assert
      await expect(service.getProfile(malformedAuthId)).rejects.toThrow('Invalid ObjectId');
    });

    it('should handle concurrent update scenarios', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const updateData = { name: 'Concurrent Update' };
      const seller = TestDataFactory.createSellerEntity({ authId });

      prisma.seller.findUnique.mockResolvedValue(seller);
      prisma.seller.update.mockRejectedValue(new Error('Version conflict'));

      // Act & Assert
      await expect(service.updateProfile(authId, updateData)).rejects.toThrow('Version conflict');
    });

    it('should handle large payload gracefully', async () => {
      // Arrange
      const createProfileDto = TestDataFactory.createSellerProfileDto({
        name: 'A'.repeat(1000), // Very long name
      });

      prisma.seller.findUnique.mockResolvedValue(null);
      prisma.seller.create.mockRejectedValue(new Error('Data too long'));

      // Act & Assert
      await expect(service.createProfile(createProfileDto)).rejects.toThrow('Data too long');
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent profile creations', async () => {
      // Arrange
      const profiles = TestDataFactory.createPerformanceTestData('small').sellers.map(seller =>
        TestDataFactory.createSellerProfileDto({
          authId: seller.authId,
          name: seller.name,
          email: seller.email,
        })
      );

      prisma.seller.findUnique.mockResolvedValue(null);
      prisma.seller.create.mockImplementation((args) =>
        Promise.resolve(TestDataFactory.createSellerEntity(args.data))
      );

      // Act
      const startTime = Date.now();
      const results = await Promise.all(
        profiles.map(profile => service.createProfile(profile))
      );
      const duration = Date.now() - startTime;

      // Assert
      expect(results).toHaveLength(profiles.length);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(prisma.seller.create).toHaveBeenCalledTimes(profiles.length);
    });
  });
});