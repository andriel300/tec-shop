/* eslint-disable */
export default {
  displayName: '@tec-shop/user-service',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/user-service',
  moduleNameMapper: {
    '^@tec-shop/dto$': '<rootDir>/../../libs/shared/dto/src/index.ts',
    '^@tec-shop/user-client$': '<rootDir>/../../libs/prisma-clients/user-client/src/index.ts',
  },
};
