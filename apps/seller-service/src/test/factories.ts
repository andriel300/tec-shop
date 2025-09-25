import { TestUtils } from './test-utils';

/**
 * Factory for creating test data objects
 */
export class TestDataFactory {

  /**
   * Create a seller profile DTO for testing
   */
  static createSellerProfileDto(overrides: Partial<any> = {}) {
    return {
      authId: TestUtils.generateRandomObjectId(),
      name: 'John Doe',
      email: TestUtils.generateRandomEmail(),
      phoneNumber: '+1234567890',
      country: 'US',
      ...overrides,
    };
  }

  /**
   * Create a shop DTO for testing
   */
  static createShopDto(overrides: Partial<any> = {}) {
    return {
      businessName: 'Tech Solutions Inc',
      bio: 'Professional technology solutions for businesses',
      description: 'Professional technology solutions for businesses', // Deprecated
      category: 'Technology',
      address: '123 Business Street, Tech City, TC 12345',
      openingHours: 'Mon-Fri 9AM-6PM, Sat 10AM-4PM',
      website: 'https://techsolutions.example.com',
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com/company/techsolutions' },
        { platform: 'twitter', url: 'https://twitter.com/techsolutions' }
      ],
      ...overrides,
    };
  }

  /**
   * Create a seller database entity for testing
   */
  static createSellerEntity(overrides: Partial<any> = {}) {
    const baseDate = TestUtils.mockTimestamp();
    return {
      id: TestUtils.generateRandomObjectId(),
      authId: TestUtils.generateRandomObjectId(),
      name: 'Jane Smith',
      email: TestUtils.generateRandomEmail(),
      phoneNumber: '+1987654321',
      country: 'CA',
      isVerified: true,
      stripeId: null,
      createdAt: baseDate,
      updatedAt: baseDate,
      shop: null,
      ...overrides,
    };
  }

  /**
   * Create a shop database entity for testing
   */
  static createShopEntity(sellerId: string, overrides: Partial<any> = {}) {
    const baseDate = TestUtils.mockTimestamp();
    return {
      id: TestUtils.generateRandomObjectId(),
      sellerId,
      businessName: 'Digital Commerce Ltd',
      bio: 'E-commerce solutions for modern businesses',
      description: 'E-commerce solutions for modern businesses', // Deprecated
      category: 'E-commerce',
      address: '456 Commerce Ave, Business District, BD 67890',
      openingHours: 'Mon-Sun 8AM-10PM',
      website: 'https://digitalcommerce.example.com',
      socialLinks: [],
      isActive: true,
      rating: 4.8,
      totalOrders: 150,
      stripeAccountId: null,
      createdAt: baseDate,
      updatedAt: baseDate,
      ...overrides,
    };
  }

  /**
   * Create seller with shop for testing
   */
  static createSellerWithShop(overrides: { seller?: Partial<any>; shop?: Partial<any> } = {}) {
    const seller = this.createSellerEntity(overrides.seller);
    const shop = this.createShopEntity(seller.id, overrides.shop);

    return {
      ...seller,
      shop,
    };
  }

  /**
   * Create multiple sellers for bulk testing
   */
  static createMultipleSellers(count: number, overrides: Partial<any> = []) {
    return Array.from({ length: count }, (_, index) =>
      this.createSellerEntity({
        ...overrides[index] || {},
        name: `Test Seller ${index + 1}`,
        email: `seller${index + 1}@test.com`
      })
    );
  }

  /**
   * Create signed request for service authentication testing
   */
  static createSignedRequest(payload: any, overrides: Partial<any> = {}) {
    return {
      payload,
      signature: 'mock-signature-hash',
      timestamp: Math.floor(Date.now() / 1000),
      serviceId: 'auth-service',
      ...overrides,
    };
  }

  /**
   * Create dashboard data structure
   */
  static createDashboardData(seller: any, shop: any = null) {
    return {
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        isVerified: seller.isVerified,
        createdAt: seller.createdAt,
      },
      shop: shop ? {
        id: shop.id,
        businessName: shop.businessName,
        category: shop.category,
        rating: shop.rating,
        totalOrders: shop.totalOrders,
        isActive: shop.isActive,
        createdAt: shop.createdAt,
      } : null,
    };
  }

  /**
   * Create error scenarios for negative testing
   */
  static createErrorScenarios() {
    return {
      notFound: {
        code: 'P2025',
        message: 'Record to delete does not exist.',
      },
      uniqueConstraint: {
        code: 'P2002',
        message: 'Unique constraint failed on the constraint: `Seller_email_key`',
      },
      validation: {
        code: 'P2000',
        message: 'The provided value for the column is too long',
      },
      connection: {
        code: 'P1001',
        message: 'Can\'t reach database server',
      },
    };
  }

  /**
   * Create performance test data
   */
  static createPerformanceTestData(size: 'small' | 'medium' | 'large' = 'medium') {
    const sizes = {
      small: 10,
      medium: 100,
      large: 1000,
    };

    return {
      sellers: this.createMultipleSellers(sizes[size]),
      operations: sizes[size] * 5, // 5 operations per seller
    };
  }
}