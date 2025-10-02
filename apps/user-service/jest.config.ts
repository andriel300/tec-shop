import { readFileSync } from 'fs';

// Reading the SWC compilation config for the spec files
const swcJestConfig = JSON.parse(
  readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8')
);

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

export default {
  displayName: '@tec-shop/user-service',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/user-service',
  moduleNameMapper: {
    '^@tec-shop/dto$': '<rootDir>/../../libs/shared/dto/src/index.ts',
    '^@tec-shop/user-client$': '<rootDir>/../../libs/prisma-clients/user-client/src/index.ts',
  },
};
