/**
 * React Testing Utilities
 *
 * Provides test utilities and wrappers for testing React hooks and components
 * that depend on SelendraProvider context.
 *
 * @module react/test-utils
 */

import React, { ReactNode } from 'react';
import { SelendraProvider } from './provider';
import { Network, ChainType } from '../types';

/**
 * Mock SDK configuration for tests
 */
export const mockConfig = {
  endpoint: 'wss://rpc-testnet.selendra.org',
  network: Network.Selendra,
  chainType: ChainType.Substrate,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

/**
 * Test wrapper component that provides SelendraProvider context
 * for testing hooks and components.
 *
 * @example
 * ```typescript
 * import { renderHook } from '@testing-library/react';
 * import { TestWrapper } from './test-utils';
 *
 * const { result } = renderHook(() => useBalance(address), {
 *   wrapper: TestWrapper
 * });
 * ```
 */
export const TestWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
  <SelendraProvider
    endpoint={mockConfig.endpoint}
    network={mockConfig.network}
    chainType={mockConfig.chainType}
    autoConnect={false}
    config={mockConfig}
    children={children}
  >
    {children}
  </SelendraProvider>
);

/**
 * Custom test wrapper with specific configuration
 *
 * @param config - Custom configuration for the provider
 * @returns Wrapper component with custom config
 */
export function createTestWrapper(config: Partial<typeof mockConfig> = {}) {
  const mergedConfig = { ...mockConfig, ...config };

  return ({ children }: { children: ReactNode }) => (
    <SelendraProvider
      endpoint={mergedConfig.endpoint}
      network={mergedConfig.network}
      chainType={mergedConfig.chainType}
      autoConnect={false}
      config={mergedConfig}
      children={children}
    >
      {children}
    </SelendraProvider>
  );
}

// Re-export testing library utilities for convenience
export * from '@testing-library/react';
export { renderHook, waitFor, act } from '@testing-library/react';
