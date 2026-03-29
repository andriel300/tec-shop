import { Test, TestingModule } from '@nestjs/testing';
import { SellerController } from './seller.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { ImageKitService } from '@tec-shop/shared/imagekit';
import { CircuitBreakerService } from '../../common/circuit-breaker.service';

describe('SellerController', () => {
  let module: TestingModule;
  let controller: SellerController;
  let sellerServiceClient: jest.Mocked<ClientProxy>;
  let orderServiceClient: jest.Mocked<ClientProxy>;
  let productServiceClient: jest.Mocked<ClientProxy>;

  const mockRequest = (userId: string) => ({
    user: { userId },
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [SellerController],
      providers: [
        {
          provide: 'SELLER_SERVICE',
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: 'PRODUCT_SERVICE',
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: 'ORDER_SERVICE',
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: ImageKitService,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            getUrlEndpoint: jest.fn().mockReturnValue('https://ik.imagekit.io/test'),
          },
        },
        {
          provide: CircuitBreakerService,
          useValue: {
            fire: jest.fn((_, fn: () => Promise<unknown>) => fn()),
          },
        },
      ],
    }).compile();

    controller = module.get<SellerController>(SellerController);
    sellerServiceClient = module.get('SELLER_SERVICE');
    orderServiceClient = module.get('ORDER_SERVICE');
    productServiceClient = module.get('PRODUCT_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should retrieve seller profile from seller-service', async () => {
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

      const result = await controller.getProfile(req);

      expect(sellerServiceClient.send).toHaveBeenCalledWith('get-seller-profile', userId);
      expect(result).toEqual(expectedProfile);
    });

    it('should handle seller not found', async () => {
      const userId = 'non-existent-seller';
      const req = mockRequest(userId);

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Seller profile not found'))
      );

      await expect(controller.getProfile(req)).rejects.toThrow('Seller profile not found');
    });
  });

  describe('updateProfile', () => {
    it('should update seller profile via seller-service', async () => {
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

      const result = await controller.updateProfile(req, updateData);

      expect(sellerServiceClient.send).toHaveBeenCalledWith('update-seller-profile', {
        authId: userId,
        updateData,
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('createShop', () => {
    it('should create shop via seller-service', async () => {
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

      const result = await controller.createShop(req, shopData);

      expect(sellerServiceClient.send).toHaveBeenCalledWith('create-shop', {
        authId: userId,
        shopData,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should handle shop already exists error', async () => {
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

      await expect(controller.createShop(req, shopData)).rejects.toThrow(
        'Shop already exists for this seller'
      );
    });
  });

  describe('createOrUpdateShop', () => {
    it('should create or update shop via seller-service', async () => {
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

      const result = await controller.createOrUpdateShop(req, shopData);

      expect(sellerServiceClient.send).toHaveBeenCalledWith('create-or-update-shop', {
        authId: userId,
        shopData,
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getShop', () => {
    it('should retrieve shop information from seller-service', async () => {
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

      const result = await controller.getShop(req);

      expect(sellerServiceClient.send).toHaveBeenCalledWith('get-seller-shop', userId);
      expect(result).toEqual(expectedShop);
    });

    it('should handle shop not found', async () => {
      const userId = 'seller-without-shop';
      const req = mockRequest(userId);

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Shop not found'))
      );

      await expect(controller.getShop(req)).rejects.toThrow('Shop not found');
    });
  });

  describe('getDashboardData', () => {
    it('should propagate circuit breaker rejection', async () => {
      const req = mockRequest('seller-auth-123');
      const cb = module.get(CircuitBreakerService);
      jest.spyOn(cb, 'fire').mockRejectedValueOnce(new Error('Circuit open'));

      await expect(controller.getDashboardData(req)).rejects.toThrow('Circuit open');
    });

    it('should retrieve dashboard data from seller-service', async () => {
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

      const result = await controller.getDashboardData(req);

      expect(sellerServiceClient.send).toHaveBeenCalledWith('get-seller-dashboard', userId);
      expect(result).toEqual(expectedDashboard);
    });

    it('should handle errors from seller-service', async () => {
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Failed to retrieve dashboard data'))
      );

      await expect(controller.getDashboardData(req)).rejects.toThrow(
        'Failed to retrieve dashboard data'
      );
    });
  });

  describe('getStatistics', () => {
    it('should propagate circuit breaker rejection', async () => {
      const req = mockRequest('seller-auth-123');
      const cb = module.get(CircuitBreakerService);
      jest.spyOn(cb, 'fire').mockRejectedValueOnce(new Error('Circuit open'));

      await expect(controller.getStatistics(req)).rejects.toThrow('Circuit open');
    });

    it('should aggregate statistics from seller, order, and product services', async () => {
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);
      const shop = { id: 'shop-123', rating: 4.8, totalOrders: 250, isActive: true };
      const orderStats = {
        revenue: { total: 50000, thisMonth: 5000, lastMonth: 4500, growth: 11 },
        orders: { total: 250, pending: 10, completed: 230, cancelled: 10, thisMonth: 20 },
      };
      const productStats = { total: 42, active: 38, outOfStock: 4 };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(shop));
      jest.spyOn(orderServiceClient, 'send').mockReturnValue(of(orderStats));
      jest.spyOn(productServiceClient, 'send').mockReturnValue(of(productStats));

      const result = await controller.getStatistics(req);

      expect(sellerServiceClient.send).toHaveBeenCalledWith('get-seller-shop', userId);
      expect(orderServiceClient.send).toHaveBeenCalledWith('order-get-seller-stats', { sellerId: userId });
      expect(productServiceClient.send).toHaveBeenCalledWith('product-get-seller-stats', { shopId: shop.id });
      expect(result).toEqual({
        revenue: orderStats.revenue,
        orders: orderStats.orders,
        products: productStats,
        shop: { rating: shop.rating, totalOrders: shop.totalOrders, isActive: shop.isActive },
      });
    });

    it('should propagate seller-service errors', async () => {
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Statistics unavailable'))
      );

      await expect(controller.getStatistics(req)).rejects.toThrow('Statistics unavailable');
    });
  });

  describe('getChartData', () => {
    it('should fetch shop then return chart data from order-service', async () => {
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);
      const shop = { id: 'shop-123', businessName: 'Test Shop' };
      const expectedChartData = {
        revenueData: [{ month: 'Jan', revenue: 1200 }],
        monthlyOrdersData: [{ month: 'Jan', orders: 10 }],
        orderStatusData: [{ status: 'DELIVERED', count: 8 }],
      };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(shop));
      jest.spyOn(orderServiceClient, 'send').mockReturnValue(of(expectedChartData));

      const result = await controller.getChartData(req);

      expect(sellerServiceClient.send).toHaveBeenCalledWith('get-seller-shop', userId);
      expect(orderServiceClient.send).toHaveBeenCalledWith('order-get-seller-chart-data', {
        shopId: shop.id,
        sellerId: userId,
      });
      expect(result).toEqual(expectedChartData);
    });

    it('should return empty chart arrays when shop is null', async () => {
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(null));

      const result = await controller.getChartData(req);

      expect(orderServiceClient.send).not.toHaveBeenCalled();
      expect(result).toEqual({
        revenueData: [],
        monthlyOrdersData: [],
        orderStatusData: [],
      });
    });

    it('should propagate order-service errors', async () => {
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);
      const shop = { id: 'shop-123', businessName: 'Test Shop' };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(shop));
      jest.spyOn(orderServiceClient, 'send').mockReturnValue(
        throwError(() => new Error('Order service unavailable'))
      );

      await expect(controller.getChartData(req)).rejects.toThrow(
        'Order service unavailable'
      );
    });
  });

  describe('getNotificationPreferences', () => {
    it('should retrieve notification preferences from seller-service', async () => {
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);
      const expectedPrefs = {
        orderUpdates: true,
        promotions: false,
        newFollowers: true,
      };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedPrefs));

      const result = await controller.getNotificationPreferences(req);

      expect(sellerServiceClient.send).toHaveBeenCalledWith(
        'get-seller-notification-preferences',
        userId
      );
      expect(result).toEqual(expectedPrefs);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences via seller-service', async () => {
      const userId = 'seller-auth-123';
      const req = mockRequest(userId);
      const preferences = { orderUpdates: false, promotions: true };
      const expectedResponse = { ...preferences, newFollowers: true };

      jest.spyOn(sellerServiceClient, 'send').mockReturnValue(of(expectedResponse));

      const result = await controller.updateNotificationPreferences(req, preferences);

      expect(sellerServiceClient.send).toHaveBeenCalledWith(
        'update-seller-notification-preferences',
        { authId: userId, preferences }
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});
