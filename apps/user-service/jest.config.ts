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
    '^@tec-shop/user-prisma-client$': '<rootDir>/../../node_modules/.prisma/user-client/index.js',
  },
};
