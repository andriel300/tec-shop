import { Test, TestingModule } from '@nestjs/testing';
import { ClientsModule, Transport, ClientProxy } from '@nestjs/microservices';
import { INestMicroservice } from '@nestjs/common';
import { SellerModule } from '../../app/seller/seller.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { SellerPrismaService } from '../../prisma/prisma.service';
import { TestUtils, TestDatabase } from '../test-utils';
import { TestDataFactory } from '../factories';

describe('Seller Service E2E', () => {
  let app: INestMicroservice;
  let client: ClientProxy;
  let prisma: SellerPrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    // Create the testing module with real dependencies
    module = await Test.createTestingModule({
      imports: [
        SellerModule,
        PrismaModule,
        ClientsModule.register([
          {
            name: 'SELLER_SERVICE_TEST',
            transport: Transport.TCP,
            options: {
              host: 'localhost',
              port: 0, // Let the system assign a port
            },
          },
        ]),
      ],
    }).compile();

    // Create microservice instance
    app = module.createNestMicroservice({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 0, // Let the system assign a port
      },
    });

    // Start the microservice
    await app.listen();

    // Get client for testing
    client = module.get('SELLER_SERVICE_TEST');
    await client.connect();

    // Get Prisma service for database operations
    prisma = module.get<SellerPrismaService>(SellerPrismaService);
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
    if (app) {
      await app.close();
    }
    if (module) {
      await module.close();
    }
  });

  beforeEach(async () => {
    // Clean database before each test
    await TestDatabase.cleanDatabase(prisma);
  });

  describe('Seller Profile Management', () => {
    it('should create seller profile successfully', async () => {
      // Arrange
      const createProfileDto = TestDataFactory.createSellerProfileDto();

      // Act
      const result = await client.send('create-seller-profile', createProfileDto).toPromise();

      // Assert
      expect(result).toBeDefined();
      expect(result.authId).toBe(createProfileDto.authId);
      expect(result.name).toBe(createProfileDto.name);
      expect(result.email).toBe(createProfileDto.email);
      expect(result.phoneNumber).toBe(createProfileDto.phoneNumber);
      expect(result.country).toBe(createProfileDto.country);
      expect(result.isVerified).toBe(true);

      // Verify in database
      const dbSeller = await prisma.seller.findUnique({
        where: { authId: createProfileDto.authId },
      });
      expect(dbSeller).toBeTruthy();
      expect(dbSeller.email).toBe(createProfileDto.email);
    });

    it('should return existing seller when profile already exists', async () => {
      // Arrange
      const createProfileDto = TestDataFactory.createSellerProfileDto();

      // Create seller first
      await client.send('create-seller-profile', createProfileDto).toPromise();

      // Act - Try to create again
      const result = await client.send('create-seller-profile', createProfileDto).toPromise();

      // Assert
      expect(result.authId).toBe(createProfileDto.authId);

      // Verify only one record in database
      const dbSellers = await prisma.seller.findMany({
        where: { authId: createProfileDto.authId },
      });
      expect(dbSellers).toHaveLength(1);
    });

    it('should get seller profile successfully', async () => {
      // Arrange
      const seller = await TestDatabase.createTestSeller(prisma);

      // Act
      const result = await client.send('get-seller-profile', seller.authId).toPromise();

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(seller.id);
      expect(result.authId).toBe(seller.authId);
      expect(result.name).toBe(seller.name);
      expect(result.email).toBe(seller.email);
    });

    it('should throw error when getting non-existent seller', async () => {
      // Arrange
      const nonExistentAuthId = TestUtils.generateRandomObjectId();

      // Act & Assert
      await expect(
        client.send('get-seller-profile', nonExistentAuthId).toPromise()
      ).rejects.toThrow();
    });

    it('should update seller profile successfully', async () => {
      // Arrange
      const seller = await TestDatabase.createTestSeller(prisma);
      const updateData = { name: 'Updated Name', phoneNumber: '+9876543210' };
      const payload = { authId: seller.authId, updateData };

      // Act
      const result = await client.send('update-seller-profile', payload).toPromise();

      // Assert
      expect(result.name).toBe(updateData.name);
      expect(result.phoneNumber).toBe(updateData.phoneNumber);
      expect(result.email).toBe(seller.email); // Should remain unchanged

      // Verify in database
      const dbSeller = await prisma.seller.findUnique({
        where: { authId: seller.authId },
      });
      expect(dbSeller.name).toBe(updateData.name);
      expect(dbSeller.phoneNumber).toBe(updateData.phoneNumber);
    });
  });

  describe('Shop Management', () => {
    it('should create shop for seller successfully', async () => {
      // Arrange
      const seller = await TestDatabase.createTestSeller(prisma);
      const shopData = TestDataFactory.createShopDto();
      const payload = { authId: seller.authId, shopData };

      // Act
      const result = await client.send('create-or-update-shop', payload).toPromise();

      // Assert
      expect(result).toBeDefined();
      expect(result.sellerId).toBe(seller.id);
      expect(result.businessName).toBe(shopData.businessName);
      expect(result.category).toBe(shopData.category);
      expect(result.address).toBe(shopData.address);

      // Verify in database
      const dbShop = await prisma.shop.findUnique({
        where: { sellerId: seller.id },
      });
      expect(dbShop).toBeTruthy();
      expect(dbShop.businessName).toBe(shopData.businessName);
    });

    it('should update existing shop successfully', async () => {
      // Arrange
      const seller = await TestDatabase.createTestSeller(prisma);
      const shop = await TestDatabase.createTestShop(prisma, seller.id);

      const updateData = {
        businessName: 'Updated Business Name',
        description: 'Updated Description',
        category: 'Updated Category',
      };
      const payload = { authId: seller.authId, shopData: updateData };

      // Act
      const result = await client.send('create-or-update-shop', payload).toPromise();

      // Assert
      expect(result.businessName).toBe(updateData.businessName);
      expect(result.description).toBe(updateData.description);
      expect(result.category).toBe(updateData.category);
      expect(result.address).toBe(shop.address); // Should remain unchanged

      // Verify in database
      const dbShop = await prisma.shop.findUnique({
        where: { sellerId: seller.id },
      });
      expect(dbShop.businessName).toBe(updateData.businessName);
    });

    it('should get shop for seller successfully', async () => {
      // Arrange
      const seller = await TestDatabase.createTestSeller(prisma);
      const shop = await TestDatabase.createTestShop(prisma, seller.id);

      // Act
      const result = await client.send('get-seller-shop', seller.authId).toPromise();

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(shop.id);
      expect(result.sellerId).toBe(seller.id);
      expect(result.businessName).toBe(shop.businessName);
    });

    it('should return null when seller has no shop', async () => {
      // Arrange
      const seller = await TestDatabase.createTestSeller(prisma);

      // Act
      const result = await client.send('get-seller-shop', seller.authId).toPromise();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Dashboard Data', () => {
    it('should get dashboard data with shop', async () => {
      // Arrange
      const seller = await TestDatabase.createTestSeller(prisma);
      const shop = await TestDatabase.createTestShop(prisma, seller.id);

      // Act
      const result = await client.send('get-seller-dashboard', seller.authId).toPromise();

      // Assert
      expect(result).toBeDefined();
      expect(result.seller).toBeDefined();
      expect(result.seller.id).toBe(seller.id);
      expect(result.seller.name).toBe(seller.name);
      expect(result.seller.email).toBe(seller.email);
      expect(result.seller.isVerified).toBe(seller.isVerified);

      expect(result.shop).toBeDefined();
      expect(result.shop.id).toBe(shop.id);
      expect(result.shop.businessName).toBe(shop.businessName);
      expect(result.shop.category).toBe(shop.category);
      expect(result.shop.rating).toBe(shop.rating);
      expect(result.shop.totalOrders).toBe(shop.totalOrders);
    });

    it('should get dashboard data without shop', async () => {
      // Arrange
      const seller = await TestDatabase.createTestSeller(prisma);

      // Act
      const result = await client.send('get-seller-dashboard', seller.authId).toPromise();

      // Assert
      expect(result).toBeDefined();
      expect(result.seller).toBeDefined();
      expect(result.seller.id).toBe(seller.id);
      expect(result.shop).toBeNull();
    });
  });

  describe('Signed Request Security', () => {
    it('should process valid signed request', async () => {
      // Arrange
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = TestDataFactory.createSignedRequest(profileData, {
        timestamp: Math.floor(Date.now() / 1000), // Current timestamp
      });

      // Mock environment variable
      process.env.SERVICE_MASTER_SECRET = 'test-master-secret';

      // Act
      const result = await client.send('create-seller-profile-signed', signedRequest).toPromise();

      // Assert
      expect(result).toBeDefined();
      expect(result.authId).toBe(profileData.authId);
    });

    it('should reject invalid signed request', async () => {
      // Arrange
      const profileData = TestDataFactory.createSellerProfileDto();
      const signedRequest = TestDataFactory.createSignedRequest(profileData, {
        signature: 'invalid-signature',
        timestamp: Math.floor(Date.now() / 1000),
      });

      process.env.SERVICE_MASTER_SECRET = 'test-master-secret';

      // Act & Assert
      await expect(
        client.send('create-seller-profile-signed', signedRequest).toPromise()
      ).rejects.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous profile creations', async () => {
      // Arrange
      const profiles = Array.from({ length: 10 }, () => TestDataFactory.createSellerProfileDto());

      // Act
      const results = await Promise.all(
        profiles.map(profile =>
          client.send('create-seller-profile', profile).toPromise()
        )
      );

      // Assert
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.authId).toBe(profiles[index].authId);
        expect(result.email).toBe(profiles[index].email);
      });

      // Verify all in database
      const dbSellers = await prisma.seller.findMany();
      expect(dbSellers).toHaveLength(10);
    });

    it('should handle concurrent shop operations for same seller', async () => {
      // Arrange
      const seller = await TestDatabase.createTestSeller(prisma);
      const shopData1 = TestDataFactory.createShopDto({ businessName: 'Shop 1' });
      const shopData2 = TestDataFactory.createShopDto({ businessName: 'Shop 2' });

      const payload1 = { authId: seller.authId, shopData: shopData1 };
      const payload2 = { authId: seller.authId, shopData: shopData2 };

      // Act
      const [result1, result2] = await Promise.all([
        client.send('create-or-update-shop', payload1).toPromise(),
        client.send('create-or-update-shop', payload2).toPromise(),
      ]);

      // Assert
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();

      // Verify only one shop exists (last update wins)
      const dbShops = await prisma.shop.findMany({
        where: { sellerId: seller.id },
      });
      expect(dbShops).toHaveLength(1);
    });
  });

  describe('Database Constraints', () => {
    it('should enforce unique authId constraint', async () => {
      // Arrange
      const authId = TestUtils.generateRandomObjectId();
      const profile1 = TestDataFactory.createSellerProfileDto({ authId });
      const profile2 = TestDataFactory.createSellerProfileDto({
        authId,
        email: 'different@example.com'
      });

      // Act
      await client.send('create-seller-profile', profile1).toPromise();

      // The second creation should return the existing seller
      const result = await client.send('create-seller-profile', profile2).toPromise();

      // Assert
      expect(result.email).toBe(profile1.email); // Should be original email

      // Verify only one record exists
      const dbSellers = await prisma.seller.findMany({
        where: { authId },
      });
      expect(dbSellers).toHaveLength(1);
    });

    it('should enforce unique email constraint', async () => {
      // Arrange
      const email = TestUtils.generateRandomEmail();
      const profile1 = TestDataFactory.createSellerProfileDto({ email });
      const profile2 = TestDataFactory.createSellerProfileDto({ email });

      // Act
      await client.send('create-seller-profile', profile1).toPromise();

      // Act & Assert
      await expect(
        client.send('create-seller-profile', profile2).toPromise()
      ).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle high load of profile operations', async () => {
      // Arrange
      const operationCount = 100;
      const profiles = Array.from({ length: operationCount }, () =>
        TestDataFactory.createSellerProfileDto()
      );

      // Act
      const startTime = Date.now();

      // Create all profiles
      await Promise.all(
        profiles.map(profile =>
          client.send('create-seller-profile', profile).toPromise()
        )
      );

      // Get all profiles
      await Promise.all(
        profiles.map(profile =>
          client.send('get-seller-profile', profile.authId).toPromise()
        )
      );

      const duration = Date.now() - startTime;

      // Assert
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all profiles exist
      const dbSellers = await prisma.seller.findMany();
      expect(dbSellers).toHaveLength(operationCount);
    });
  });
});