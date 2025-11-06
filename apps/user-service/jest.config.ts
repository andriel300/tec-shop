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
