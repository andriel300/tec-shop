import { readFileSync } from 'fs';

// Reading the SWC compilation config for the spec files
const swcJestConfig = JSON.parse(
  readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8')
);

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

export default {
  displayName: '@tec-shop/seller-service:e2e',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: 'test-output/jest/coverage-e2e',

  // E2E Test patterns - only E2E tests
  testMatch: [
    '<rootDir>/src/test/e2e/**/*.e2e-spec.ts',
  ],

  // Setup files for E2E
  setupFilesAfterEnv: ['<rootDir>/src/test/e2e/setup.ts'],

  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@tec-shop/seller-client$': '<rootDir>/../../libs/prisma-clients/seller-client/src/index.ts',
    '^@tec-shop/dto$': '<rootDir>/../../libs/shared/dto/src/index.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/src/test/$1',
  },

  // E2E tests need longer timeout
  testTimeout: 60000,

  // Error handling
  errorOnDeprecated: true,
  verbose: true,

  // Run E2E tests serially (not in parallel)
  maxWorkers: 1,
};
