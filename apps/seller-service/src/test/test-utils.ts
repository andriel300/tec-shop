import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@tec-shop/seller-client';
import { SellerPrismaService } from '../prisma/prisma.service';

// Global test utilities
export class TestUtils {
  /**
   * Create a testing module with mocked dependencies
   */
  static async createTestingModule(imports: any[], providers: any[] = [], controllers: any[] = []): Promise<TestingModule> {
    return Test.createTestingModule({
      imports,
      providers,
      controllers,
    }).compile();
  }

  /**
   * Clean up all mocks before each test
   */
  static resetAllMocks(mocks: Record<string, any>) {
    Object.values(mocks).forEach(mock => {
      if (mock && typeof mock === 'object' && 'mockReset' in mock) {
        mockReset(mock);
      }
    });
  }

  /**
   * Generate random test data
   */
  static generateRandomString(length = 10): string {
    return Math.random().toString(36).substring(2, length + 2);
  }

  static generateRandomEmail(): string {
    return `test${this.generateRandomString()}@example.com`;
  }

  static generateRandomObjectId(): string {
    return '64f' + this.generateRandomString(21);
  }

  /**
   * Create a mock timestamp
   */
  static mockTimestamp(): Date {
    return new Date('2024-01-01T00:00:00.000Z');
  }

  /**
   * Async test wrapper for better error handling
   */
  static async runTest(testFn: () => Promise<void>): Promise<void> {
    try {
      await testFn();
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error;
    }
  }
}

// Prisma mock type
export type MockPrismaService = DeepMockProxy<PrismaClient>;

/**
 * Create a mock Prisma service for testing
 */
export const createMockPrismaService = (): MockPrismaService => {
  return mockDeep<PrismaClient>();
};

/**
 * Mock provider for Prisma service
 */
export const mockPrismaProvider = {
  provide: SellerPrismaService,
  useFactory: createMockPrismaService,
};

/**
 * Test database helper for integration tests
 */
export class TestDatabase {
  static async cleanDatabase(prisma: PrismaClient): Promise<void> {
    // Clean up in reverse order of dependencies
    await prisma.shop.deleteMany({});
    await prisma.seller.deleteMany({});
  }

  static async createTestSeller(prisma: PrismaClient, overrides: Partial<any> = {}): Promise<any> {
    return prisma.seller.create({
      data: {
        authId: TestUtils.generateRandomObjectId(),
        name: 'Test Seller',
        email: TestUtils.generateRandomEmail(),
        phoneNumber: '+1234567890',
        country: 'US',
        isVerified: true,
        ...overrides,
      },
    });
  }

  static async createTestShop(prisma: PrismaClient, sellerId: string, overrides: Partial<any> = {}): Promise<any> {
    return prisma.shop.create({
      data: {
        sellerId,
        businessName: 'Test Business',
        description: 'Test Description',
        category: 'Electronics',
        address: '123 Test St',
        website: 'https://test.com',
        isActive: true,
        rating: 4.5,
        totalOrders: 0,
        ...overrides,
      },
    });
  }
}