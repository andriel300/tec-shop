import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({ path: join(__dirname, '../../.env.test') });

// Global test configuration (Jest globals available via setupFilesAfterEnv)
// Note: Jest globals (jest, beforeAll, etc.) are automatically available in test files

// Mock console methods during tests to reduce noise
const noop = (..._args: unknown[]) => { /* intentionally empty for test suppression */ };

if (process.env.TEST_VERBOSE !== 'true') {
  global.console = {
    ...console,
    log: noop as typeof console.log,
    info: noop as typeof console.info,
    debug: noop as typeof console.debug,
    warn: console.warn,
    error: console.error,
  };
}

// Mock Date.now for consistent testing
const mockDateNow = () => 1640995200000; // 2022-01-01 00:00:00 UTC
Date.now = mockDateNow;

// Global test utilities - extend Jest matchers
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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

  toMatchSellerSchema(received: Record<string, unknown>) {
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

  toMatchShopSchema(received: Record<string, unknown>) {
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

// Note: Global lifecycle hooks (beforeAll, afterAll, beforeEach) and custom matchers
// are automatically available in test files via Jest's setupFilesAfterEnv configuration