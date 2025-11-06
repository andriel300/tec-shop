// SWC compilation config for the spec files
const swcJestConfig = {
  jsc: {
    target: 'es2017',
    parser: {
      syntax: 'typescript',
      decorators: true,
      dynamicImport: true,
    },
    transform: {
      decoratorMetadata: true,
      legacyDecorator: true,
    },
    keepClassNames: true,
    externalHelpers: true,
    loose: true,
  },
  module: {
    type: 'es6',
  },
  sourceMaps: true,
  swcrc: false,
};

export default {
  displayName: '@tec-shop/auth-service',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: 'test-output/jest/coverage',
  moduleNameMapper: {
    '^@tec-shop/auth-client$':
      '<rootDir>/../../libs/prisma-clients/auth-client/src/index.ts',
    '^@tec-shop/dto$': '<rootDir>/../../libs/shared/dto/src/index.ts',
  },
};