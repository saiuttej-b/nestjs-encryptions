/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testMatch: ['**/__tests__/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
    '^.+\\.js$': '<rootDir>/../jest-esm.cjs',
  },
  // pnpm nests packages under node_modules/.pnpm. Transform Nest's ESM build
  // on Node versions where Jest cannot require() ESM directly.
  transformIgnorePatterns: ['/node_modules/(?!(\\.pnpm|@nestjs)/)'],
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/__tests__/**'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
