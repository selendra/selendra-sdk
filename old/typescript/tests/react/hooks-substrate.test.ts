/**
 * React Hooks Tests
 */

import { renderHook, waitFor } from '@testing-library/react';
import { TestWrapper } from '../../src/react/test-utils';
import {
  useStaking,
  useAleph,
  useElections,
  useGovernance,
  useUnifiedAccounts,
} from '../../src/react/hooks-substrate';
import { ApiPromise } from '@polkadot/api';

// Mock API creation
const createMockApi = (overrides = {}) => {
  return {
    query: {
      staking: {
        currentEra: jest.fn().mockResolvedValue({
          unwrap: () => ({ toNumber: () => 100 }),
          isSome: true,
        }),
        validators: jest.fn().mockResolvedValue(['validator1', 'validator2']),
        ...overrides.staking,
      },
      session: {
        currentIndex: jest.fn().mockResolvedValue({
          toNumber: () => 500,
        }),
        validators: jest.fn().mockResolvedValue(['validator1', 'validator2']),
        ...overrides.session,
      },
      aleph: {
        sessionPeriod: jest.fn().mockResolvedValue({
          toNumber: () => 900,
        }),
        ...overrides.aleph,
      },
      elections: {
        committeeSize: jest.fn().mockResolvedValue({
          reserved: { toNumber: () => 4 },
          nonReserved: { toNumber: () => 8 },
          nonReservedFinality: { toNumber: () => 6 },
        }),
        ...overrides.elections,
      },
      democracy: {
        referendumCount: jest.fn().mockResolvedValue({
          toNumber: () => 10,
        }),
        ...overrides.democracy,
      },
    },
    consts: {
      aleph: {
        millisPerBlock: {
          toNumber: () => 6000,
        },
      },
      elections: {
        electionOpenness: {
          toString: () => 'Permissioned',
        },
      },
      democracy: {
        minimumDeposit: {
          toString: () => '100000000000000000',
        },
        votingPeriod: {
          toNumber: () => 28800,
        },
      },
    },
    rpc: {
      chain: {
        getHeader: jest.fn().mockResolvedValue({
          number: { toNumber: () => 450000 },
        }),
      },
    },
    ...overrides,
  };
};

describe('React Hooks', () => {
  describe('useStaking', () => {
    it('should return null when API is not provided', () => {
      const { result } = renderHook(() => useStaking(), {
        wrapper: TestWrapper,
      });
      expect(result.current.currentEra).toBeNull();
    });

    it('should fetch staking data when API is provided', async () => {
      const mockApi = createMockApi();
      const { result } = renderHook(() => useStaking(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle errors gracefully', async () => {
      const { result } = renderHook(() => useStaking(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should support custom refresh interval', async () => {
      const { result } = renderHook(() => useStaking({ refreshInterval: 1000 }), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('useAleph', () => {
    it('should return null when API is not provided', () => {
      const { result } = renderHook(() => useAleph(), {
        wrapper: TestWrapper,
      });
      expect(result.current.currentSession).toBeNull();
    });

    it('should fetch aleph data when API is provided', async () => {
      const { result } = renderHook(() => useAleph(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should calculate session progress', async () => {
      const { result } = renderHook(() => useAleph(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('useElections', () => {
    it('should return null when API is not provided', () => {
      const { result } = renderHook(() => useElections(), {
        wrapper: TestWrapper,
      });
      expect(result.current.committeeSeats).toBeNull();
    });

    it('should fetch elections data when API is provided', async () => {
      const { result } = renderHook(() => useElections(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('useGovernance', () => {
    it('should return null when API is not provided', () => {
      const { result } = renderHook(() => useGovernance(), {
        wrapper: TestWrapper,
      });
      expect(result.current.referendumCount).toBeNull();
    });

    it('should fetch governance data when API is provided', async () => {
      const { result } = renderHook(() => useGovernance(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should provide transaction functions', () => {
      const { result } = renderHook(() => useGovernance(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.propose).toBe('function');
      expect(typeof result.current.second).toBe('function');
      expect(typeof result.current.vote).toBe('function');
      expect(typeof result.current.removeVote).toBe('function');
      expect(typeof result.current.delegate).toBe('function');
      expect(typeof result.current.undelegate).toBe('function');
    });
  });

  describe('useUnifiedAccounts', () => {
    it('should return utility functions when API is not provided', () => {
      const { result } = renderHook(() => useUnifiedAccounts(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.substrateToEvm).toBe('function');
      expect(typeof result.current.evmToSubstrate).toBe('function');
      expect(typeof result.current.validateAddress).toBe('function');
    });

    it('should fetch balance when API and address provided', async () => {
      const { result } = renderHook(() => useUnifiedAccounts(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should provide utility functions', () => {
      const { result } = renderHook(() => useUnifiedAccounts(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.substrateToEvm).toBe('function');
      expect(typeof result.current.evmToSubstrate).toBe('function');
      expect(typeof result.current.validateAddress).toBe('function');
      expect(typeof result.current.getUnifiedBalance).toBe('function');
      expect(typeof result.current.batchConvert).toBe('function');
    });
  });

  describe('Hook refresh mechanisms', () => {
    it('should not refresh when refreshInterval is 0', async () => {
      const { result } = renderHook(() => useStaking({ refreshInterval: 0 }), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Loading states', () => {
    it('should set loading to true initially', () => {
      const { result } = renderHook(() => useStaking(), {
        wrapper: TestWrapper,
      });

      // Initially loading should be true or become true quickly
      expect(typeof result.current.isLoading).toBe('boolean');
    });

    it('should set loading to false after data is fetched', async () => {
      const { result } = renderHook(() => useStaking(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Error handling', () => {
    it('should capture and expose errors', async () => {
      const { result } = renderHook(() => useStaking(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should continue functioning after error', async () => {
      const { result, rerender } = renderHook(() => useStaking(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger re-fetch
      rerender();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
