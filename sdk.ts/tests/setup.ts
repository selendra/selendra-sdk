/**
 * Jest Test Setup
 *
 * Global test configuration and utilities.
 */

// Increase timeout for async operations
jest.setTimeout(30000);

// Mock console.warn and console.error to suppress noise during tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  // Suppress Polkadot.js warnings about API not being ready
  console.warn = (...args: unknown[]) => {
    const message = args[0];
    if (
      typeof message === "string" &&
      (message.includes("API/INIT") ||
        message.includes("@polkadot") ||
        message.includes("Unable to resolve type"))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  // Suppress expected errors during testing
  console.error = (...args: unknown[]) => {
    const message = args[0];
    if (
      typeof message === "string" &&
      (message.includes("Expected test error") ||
        message.includes("Mock error"))
    ) {
      return;
    }
    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Global test utilities
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeValidAddress(): R;
      toBeValidHex(): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidAddress(received: string) {
    const isSubstrate = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(received);
    const isEvm = /^0x[a-fA-F0-9]{40}$/.test(received);

    if (isSubstrate || isEvm) {
      return {
        message: () => `expected ${received} not to be a valid address`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be a valid Substrate or EVM address`,
        pass: false,
      };
    }
  },

  toBeValidHex(received: string) {
    const isHex = /^0x[a-fA-F0-9]+$/.test(received);

    if (isHex) {
      return {
        message: () => `expected ${received} not to be valid hex`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be valid hex (0x prefixed)`,
        pass: false,
      };
    }
  },
});

export {};
