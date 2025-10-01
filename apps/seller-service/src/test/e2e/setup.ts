import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables for testing
config({ path: join(__dirname, '../../../.env.test') });

// Global test configuration
const noop = (..._args: unknown[]) => { /* intentionally empty for test suppression */ };

global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: process.env.TEST_VERBOSE === 'true' ? console.log : noop as typeof console.log,
  info: process.env.TEST_VERBOSE === 'true' ? console.info : noop as typeof console.info,
  warn: console.warn,
  error: console.error,
};

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.SERVICE_MASTER_SECRET = 'test-master-secret-for-e2e-tests';
process.env.OTP_SALT = 'test-otp-salt-for-e2e-tests';