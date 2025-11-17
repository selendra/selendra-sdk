/**
 * Jest setup file for Node.js environment tests
 */

// Configure test timeout
jest.setTimeout(30000);

// Mock console methods in tests unless debugging
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Set up global test utilities
// TypeScript declarations are handled in separate .d.ts file

// Custom matchers for common validation
expect.extend({
  toBeValidAddress(received) {
    const pass = typeof received === 'string' && received.length > 0;

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid address`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid address`,
        pass: false,
      };
    }
  },

  toBeValidHash(received) {
    const pass = typeof received === 'string' &&
                received.startsWith('0x') &&
                received.length === 66; // 64 hex chars + 0x

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid hash`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid hash`,
        pass: false,
      };
    }
  },

  toBeValidSignature(received) {
    const pass = typeof received === 'string' &&
                received.startsWith('0x') &&
                received.length === 132; // 65 bytes * 2 + 0x

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid signature`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid signature`,
        pass: false,
      };
    }
  },

  toBeValidBalance(received) {
    const pass = typeof received === 'string' || typeof received === 'bigint';

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid balance`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid balance`,
        pass: false,
      };
    }
  },
});

// Mock network requests for faster tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test helpers
const testUtils = {
  /**
   * Generate a mock address
   */
  generateMockAddress: (prefix = '0x') => {
    const randomBytes = Array.from({ length: 20 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    return prefix + randomBytes;
  },

  /**
   * Generate a mock hash
   */
  generateMockHash: () => {
    const randomBytes = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    return '0x' + randomBytes;
  },

  /**
   * Generate a mock signature
   */
  generateMockSignature: () => {
    const randomBytes = Array.from({ length: 65 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    return '0x' + randomBytes;
  },

  /**
   * Generate a mock balance
   */
  generateMockBalance: () => {
    const randomAmount = Math.floor(Math.random() * 1000000);
    return randomAmount.toString();
  },

  /**
   * Wait for async operations
   */
  wait: (ms = 100) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Create a mock transaction result
   */
  createMockTransactionResult: (hash) => ({
    hash: hash || testUtils.generateMockHash(),
    status: 'finalized',
    blockHash: testUtils.generateMockHash(),
    blockNumber: Math.floor(Math.random() * 1000000),
    fee: testUtils.generateMockBalance(),
  }),

  /**
   * Create a mock network status
   */
  createMockNetworkStatus: () => ({
    isConnected: true,
    networkName: 'Test Network',
    chainId: 'testnet',
    blockNumber: Math.floor(Math.random() * 1000000),
    blockHash: testUtils.generateMockHash(),
    genesisHash: testUtils.generateMockHash(),
    isSyncing: false,
    timestamp: Date.now(),
  }),
};

// Export for CommonJS
module.exports = { testUtils };

// Make testUtils globally available
global.testUtils = testUtils;