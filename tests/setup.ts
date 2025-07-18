import 'dotenv/config';

// Extend global types for testing
declare global {
  let mockProvider: any;
  interface Window {
    ethereum: any;
  }
}

// Mock Web3 provider for testing
(global as any).mockProvider = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

// Mock window.ethereum for browser environment tests
Object.defineProperty(global, 'window', {
  value: {
    ethereum: (global as any).mockProvider,
  },
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test',
  },
  writable: true,
});

// Test configuration
export const TEST_CONFIG = {
  PRIVATE_KEY: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  RPC_URL: 'http://localhost:8545',
  CHAIN_ID: 1337,
  CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',
  ACCOUNT_ADDRESS: '0x742d35Cc6634C0532925a3b8D42C25F93c68c46f',
  WASM_CONTRACT_ADDRESS: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  SUBSTRATE_WS_URL: 'ws://localhost:9944',
};

// Global test utilities
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const generateRandomAddress = (): string => {
  const chars = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateRandomHash = (): string => {
  const chars = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Setup global mocks
beforeEach(() => {
  jest.clearAllMocks();
});

// Cleanup after tests
afterEach(() => {
  jest.restoreAllMocks();
});