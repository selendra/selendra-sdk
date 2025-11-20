module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  transform: {
    '^.+\\.ts$': ['babel-jest', {
      configFile: './babel.config.cjs',
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@polkadot|@acala)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts',
    '!src/test/**/*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
    'clover'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/test/setup.js'
  ],
  testTimeout: 60000,
  verbose: true,
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/connection/(.*)$': '<rootDir>/src/connection/$1',
    '^@/substrate/(.*)$': '<rootDir>/src/substrate/$1',
    '^@/evm/(.*)$': '<rootDir>/src/evm/$1',
    '^@/unified/(.*)$': '<rootDir>/src/unified/$1',
    '^@/react/(.*)$': '<rootDir>/src/react/$1',
  },
  projects: [
    {
      displayName: 'Node Tests',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/!(react)/**/*.test.ts'
      ],
      setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
    },
    {
      displayName: 'React Tests',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/tests/react/**/*.test.ts'
      ],
      setupFilesAfterEnv: ['<rootDir>/src/test/setup.js', '@testing-library/jest-dom'],
      setupFiles: [
        '<rootDir>/tests/react-setup.js'
      ],
    }
  ],
};