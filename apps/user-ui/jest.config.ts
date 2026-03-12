const swcJestConfig = {
  jsc: {
    target: 'es2017',
    parser: {
      syntax: 'typescript',
      tsx: true,
      dynamicImport: true,
    },
  },
  module: {
    type: 'commonjs',
  },
  sourceMaps: true,
  swcrc: false,
};

module.exports = {
  displayName: 'user-ui',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
  moduleNameMapper: {
    '^next/image$': '<rootDir>/src/__mocks__/next-image.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
