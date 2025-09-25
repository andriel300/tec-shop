import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables for testing
config({ path: join(__dirname, '../../../.env.test') });

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: process.env.TEST_VERBOSE === 'true' ? console.log : jest.fn(),
  info: process.env.TEST_VERBOSE === 'true' ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Global test timeout
jest.setTimeout(60000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.SERVICE_MASTER_SECRET = 'test-master-secret-for-e2e-tests';
process.env.OTP_SALT = 'test-otp-salt-for-e2e-tests';

// Global setup
beforeAll(async () => {
  // Any global setup needed for E2E tests
});

// Global teardown
afterAll(async () => {
  // Any global cleanup needed for E2E tests
});