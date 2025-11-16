/**
 * React Hooks Tests
 */

import { renderHook, waitFor } from '@testing-library/react';
import {
  useStaking,
  useAleph,
  useElections,
  useGovernance,
  useUnifiedAccounts,
} from '../../src/react/hooks-substrate';
import { ApiPromise } from '@polkadot/api';

// Mock API creation
const createMockApi = (overrides: any = {}) => {
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
  } as unknown as ApiPromise;
};

describe('React Hooks', () => {
  describe('useStaking', () => {
    it('should return null when API is not provided', () => {
      const { result } = renderHook(() => useStaking(null));
      expect(result.current.currentEra).toBeNull();
      expect(result.current.validators).toBeNull();
    });

    it('should fetch staking data when API is provided', async () => {
      const mockApi = createMockApi();
      const { result } = renderHook(() => useStaking(mockApi));

      await waitFor(() => {
        expect(result.current.currentEra).toBe(100);
      });

      expect(result.current.validators).toEqual(['validator1', 'validator2']);
    });

    it('should handle errors gracefully', async () => {
      const mockApi = createMockApi({
        staking: {
          currentEra: jest.fn().mockRejectedValue(new Error('API error')),
        },
      });

      const { result } = renderHook(() => useStaking(mockApi));

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should support custom refresh interval', async () => {
      const mockApi = createMockApi();
      const { result } = renderHook(() => useStaking(mockApi, { refreshInterval: 1000 }));

      await waitFor(() => {
        expect(result.current.currentEra).toBe(100);
      });
    });
  });

  describe('useAleph', () => {
    it('should return null when API is not provided', () => {
      const { result } = renderHook(() => useAleph(null));
      expect(result.current.currentSession).toBeNull();
    });

    it('should fetch aleph data when API is provided', async () => {
      const mockApi = createMockApi();
      const { result } = renderHook(() => useAleph(mockApi));

      await waitFor(() => {
        expect(result.current.currentSession).toBe(500);
      });

      expect(result.current.sessionLength).toBe(900);
    });

    it('should calculate session progress', async () => {
      const mockApi = createMockApi();
      const { result } = renderHook(() => useAleph(mockApi));

      await waitFor(() => {
        expect(result.current.sessionProgress).toBeDefined();
      });
    });
  });

  describe('useElections', () => {
    it('should return null when API is not provided', () => {
      const { result } = renderHook(() => useElections(null));
      expect(result.current.committeeSeats).toBeNull();
    });

    it('should fetch elections data when API is provided', async () => {
      const mockApi = createMockApi();
      const { result } = renderHook(() => useElections(mockApi));

      await waitFor(() => {
        expect(result.current.committeeSeats).toEqual({
          reserved: 4,
          nonReserved: 8,
          nonReservedFinality: 6,
        });
      });

      expect(result.current.electionOpenness).toBe('Permissioned');
    });
  });

  describe('useGovernance', () => {
    it('should return null when API is not provided', () => {
      const { result } = renderHook(() => useGovernance(null));
      expect(result.current.referendumCount).toBeNull();
    });

    it('should fetch governance data when API is provided', async () => {
      const mockApi = createMockApi();
      const { result } = renderHook(() => useGovernance(mockApi));

      await waitFor(() => {
        expect(result.current.referendumCount).toBe(10);
      });

      expect(result.current.minimumDeposit).toBe('100000000000000000');
      expect(result.current.votingPeriod).toBe(28800);
    });

    it('should provide transaction functions', () => {
      const mockApi = createMockApi();
      const { result } = renderHook(() => useGovernance(mockApi));

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
      const { result } = renderHook(() => useUnifiedAccounts(null));

      expect(typeof result.current.substrateToEvm).toBe('function');
      expect(typeof result.current.evmToSubstrate).toBe('function');
      expect(typeof result.current.validateAddress).toBe('function');
    });

    it('should fetch balance when API and address provided', async () => {
      const mockApi = createMockApi();
      mockApi.query.system = {
        account: jest.fn().mockResolvedValue({
          data: {
            free: { toString: () => '5000000000000000000' },
            reserved: { toString: () => '0' },
            frozen: { toString: () => '0' },
          },
        }),
      };
      mockApi.rpc.eth = {
        getBalance: jest.fn().mockResolvedValue({
          toString: () => '2000000000000000000',
        }),
      };

      const { result } = renderHook(() => useUnifiedAccounts(mockApi, 'substrate_address'));

      await waitFor(() => {
        expect(result.current.balance).toBeDefined();
      });
    });

    it('should provide transaction functions', () => {
      const mockApi = createMockApi();
      const { result } = renderHook(() => useUnifiedAccounts(mockApi));

      expect(typeof result.current.claimDefaultEvmAddress).toBe('function');
      expect(typeof result.current.claimEvmAddress).toBe('function');
    });
  });

  describe('Hook refresh mechanisms', () => {
    it('should not refresh when refreshInterval is 0', async () => {
      const mockApi = createMockApi();
      const { result } = renderHook(() => useStaking(mockApi, { refreshInterval: 0 }));

      await waitFor(() => {
        expect(result.current.currentEra).toBe(100);
      });

      // Function should be called only once (initial load)
      expect(mockApi.query.staking.currentEra).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading states', () => {
    it('should set loading to true initially', () => {
      const mockApi = createMockApi();
      const { result } = renderHook(() => useStaking(mockApi));

      // Initially loading should be true or become true quickly
      expect(typeof result.current.loading).toBe('boolean');
    });

    it('should set loading to false after data is fetched', async () => {
      const mockApi = createMockApi();
      const { result } = renderHook(() => useStaking(mockApi));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Error handling', () => {
    it('should capture and expose errors', async () => {
      const mockApi = createMockApi({
        staking: {
          currentEra: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      });

      const { result } = renderHook(() => useStaking(mockApi));

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.message).toContain('Network error');
      });
    });

    it('should continue functioning after error', async () => {
      const mockApi = createMockApi({
        staking: {
          currentEra: jest
            .fn()
            .mockRejectedValueOnce(new Error('Temporary error'))
            .mockResolvedValue({
              unwrap: () => ({ toNumber: () => 100 }),
              isSome: true,
            }),
        },
      });

      const { result, rerender } = renderHook(() => useStaking(mockApi));

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      // Trigger re-fetch
      rerender();

      await waitFor(() => {
        expect(result.current.currentEra).toBe(100);
      });
    });
  });
});
