import { Test, TestingModule } from '@nestjs/testing';
import { SellerController } from './seller.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';

describe('SellerController', () => {
  let controller: SellerController;
  let sellerServiceClient: ClientProxy;

  const mockRequest = (userId: string) => ({
    user: { userId },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerController],
      providers: [
        {
          provide: 'SELLER_SERVICE',
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SellerController>(SellerController);
    sellerServiceClient = module.get<ClientProxy>('SELLER_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should retrieve seller profile from seller-service', async () => {
      // Arrange
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);
      const expectedProfile = {
        id: 'seller-123',
        authId: userId,
        name: 'Test Seller',
        email: 'seller@example.com',
        phoneNumber: '+1234567890',
        country: 'US',
        isVerified: true,
      };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedProfile));

      // Act
      const result = await controller.getProfile(req);

      // Assert
      expect(sellerServiceClient.send).toHaveBeenCalledWith('get-seller-profile', userId);
      expect(result).toEqual(expectedProfile);
    });

    it('should handle seller not found', async () => {
      // Arrange
      const userId = 'non-existent-seller';
      const req = mockRequest(userId);

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Seller profile not found'))
      );

      // Act & Assert
      await expect(controller.getProfile(req)).rejects.toThrow('Seller profile not found');
    });
  });

  describe('updateProfile', () => {
    it('should update seller profile via seller-service', async () => {
      // Arrange
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);
      const updateData = {
        name: 'Updated Seller Name',
        phoneNumber: '+9876543210',
      };
      const expectedResponse = {
        id: 'seller-123',
        authId: userId,
        ...updateData,
        email: 'seller@example.com',
        updatedAt: new Date(),
      };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.updateProfile(req, updateData);

      // Assert
      expect(sellerServiceClient.send).toHaveBeenCalledWith('update-seller-profile', {
        authId: userId,
        updateData,
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('createShop', () => {
    it('should create shop via seller-service', async () => {
      // Arrange
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);
      const shopData = {
        businessName: 'Test Shop',
        description: 'A test shop',
        bio: 'Expert electronics retailer',
        category: 'Electronics',
        address: '123 Shop St',
        openingHours: 'Mon-Fri 9AM-6PM',
        website: 'https://testshop.com',
      };
      const expectedResponse = {
        id: 'shop-123',
        sellerId: 'seller-123',
        ...shopData,
        isActive: true,
        createdAt: new Date(),
      };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.createShop(req, shopData);

      // Assert
      expect(sellerServiceClient.send).toHaveBeenCalledWith('create-shop', {
        authId: userId,
        shopData,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should handle shop already exists error', async () => {
      // Arrange
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);
      const shopData = {
        businessName: 'Existing Shop',
        description: 'Shop description',
        bio: 'Fashion boutique owner',
        category: 'Fashion',
        address: '456 Market St',
        openingHours: 'Daily 10AM-8PM',
      };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Shop already exists for this seller'))
      );

      // Act & Assert
      await expect(controller.createShop(req, shopData)).rejects.toThrow(
        'Shop already exists for this seller'
      );
    });
  });

  describe('createOrUpdateShop', () => {
    it('should create or update shop via seller-service', async () => {
      // Arrange
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);
      const shopData = {
        businessName: 'Updated Shop Name',
        description: 'Updated description',
      };
      const expectedResponse = {
        id: 'shop-123',
        sellerId: 'seller-123',
        businessName: 'Updated Shop Name',
        description: 'Updated description',
        updatedAt: new Date(),
      };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.createOrUpdateShop(req, shopData);

      // Assert
      expect(sellerServiceClient.send).toHaveBeenCalledWith('create-or-update-shop', {
        authId: userId,
        shopData,
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getShop', () => {
    it('should retrieve shop information from seller-service', async () => {
      // Arrange
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);
      const expectedShop = {
        id: 'shop-123',
        sellerId: 'seller-123',
        businessName: 'Test Shop',
        description: 'A test shop',
        category: 'Electronics',
        address: '123 Shop St',
        openingHours: 'Mon-Fri 9AM-6PM',
        isActive: true,
        rating: 4.5,
      };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedShop));

      // Act
      const result = await controller.getShop(req);

      // Assert
      expect(sellerServiceClient.send).toHaveBeenCalledWith('get-seller-shop', userId);
      expect(result).toEqual(expectedShop);
    });

    it('should handle shop not found', async () => {
      // Arrange
      const userId = 'seller-without-shop';
      const req = mockRequest(userId);

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Shop not found'))
      );

      // Act & Assert
      await expect(controller.getShop(req)).rejects.toThrow('Shop not found');
    });
  });

  describe('getDashboardData', () => {
    it('should retrieve dashboard data from seller-service', async () => {
      // Arrange
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);
      const expectedDashboard = {
        seller: {
          id: 'seller-123',
          name: 'Test Seller',
          email: 'seller@example.com',
        },
        shop: {
          id: 'shop-123',
          businessName: 'Test Shop',
          isActive: true,
        },
        stats: {
          totalOrders: 150,
          revenue: 25000,
          rating: 4.7,
        },
      };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedDashboard));

      // Act
      const result = await controller.getDashboardData(req);

      // Assert
      expect(sellerServiceClient.send).toHaveBeenCalledWith('get-seller-dashboard', userId);
      expect(result).toEqual(expectedDashboard);
    });

    it('should handle errors from seller-service', async () => {
      // Arrange
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Failed to retrieve dashboard data'))
      );

      // Act & Assert
      await expect(controller.getDashboardData(req)).rejects.toThrow(
        'Failed to retrieve dashboard data'
      );
    });
  });
});
