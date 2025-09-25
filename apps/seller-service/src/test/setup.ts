import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({ path: join(__dirname, '../../.env.test') });

// Global test configuration
jest.setTimeout(30000);

// Mock console methods during tests to reduce noise
if (process.env.TEST_VERBOSE !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: console.warn,
    error: console.error,
  };
}

// Mock Date.now for consistent testing
const mockDateNow = jest.fn(() => 1640995200000); // 2022-01-01 00:00:00 UTC
Date.now = mockDateNow;

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidObjectId(): R;
      toMatchSellerSchema(): R;
      toMatchShopSchema(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidObjectId(received: string) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    const pass = objectIdRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ObjectId`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ObjectId`,
        pass: false,
      };
    }
  },

  toMatchSellerSchema(received: any) {
    const requiredFields = ['id', 'authId', 'name', 'email', 'phoneNumber', 'country', 'isVerified'];
    const missingFields = requiredFields.filter(field => !(field in received));

    if (missingFields.length === 0) {
      return {
        message: () => `expected seller object not to match schema`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected seller object to match schema, missing fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }
  },

  toMatchShopSchema(received: any) {
    const requiredFields = ['id', 'sellerId', 'businessName', 'category', 'address', 'isActive'];
    const missingFields = requiredFields.filter(field => !(field in received));

    if (missingFields.length === 0) {
      return {
        message: () => `expected shop object not to match schema`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected shop object to match schema, missing fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }
  },
});

// Global setup
beforeAll(() => {
  // Any global setup needed for all tests
});

// Global teardown
afterAll(() => {
  // Any global cleanup needed for all tests
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockDateNow.mockReturnValue(1640995200000); // Reset to default timestamp
});