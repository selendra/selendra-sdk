/**
 * Core React Hooks Tests
 *
 * Tests for main SDK hooks including useSelendraSDK, useBalance, useAccount,
 * useTransaction, useContract, useEvents, and utility hooks.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { TestWrapper } from '../../src/react/test-utils';
import {
  useSelendraSDK,
  useBalance,
  useAccount,
  useTransaction,
  useContract,
  useEvents,
  useBlockSubscription,
  useDebounce,
  useLocalStorage,
  usePrevious,
  useIsMounted,
  useMultiBalance,
  useMultiContract,
  useBatchTransactions,
} from '../../src/react/hooks';

describe('Core React Hooks', () => {
  describe('useSelendraSDK', () => {
    it('should return SDK context', () => {
      const { result } = renderHook(() => useSelendraSDK(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(result.current.sdk).toBeDefined();
      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.retry).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });

    it('should have connection state', () => {
      const { result } = renderHook(() => useSelendraSDK(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.isConnected).toBe('boolean');
      expect(typeof result.current.isConnecting).toBe('boolean');
    });

    it('should have network information', () => {
      const { result } = renderHook(() => useSelendraSDK(), {
        wrapper: TestWrapper,
      });

      expect(result.current.network).toBeDefined();
      expect(result.current.chainType).toBeDefined();
    });
  });

  describe('useBalance', () => {
    it('should initialize with null balance', () => {
      const { result } = renderHook(() => useBalance(), {
        wrapper: TestWrapper,
      });

      expect(result.current.balance).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should provide refresh function', () => {
      const { result } = renderHook(() => useBalance('test-address'), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.refresh).toBe('function');
    });

    it('should provide formatted balance', () => {
      const { result } = renderHook(() => useBalance(), {
        wrapper: TestWrapper,
      });

      expect(result.current.formatted).toBeDefined();
      expect(typeof result.current.formatted.native).toBe('string');
      expect(typeof result.current.formatted.symbol).toBe('string');
      expect(typeof result.current.formatted.decimals).toBe('number');
    });

    it('should handle options', () => {
      const { result } = renderHook(
        () => useBalance('test-address', { refreshInterval: 5000, includeUSD: true }),
        { wrapper: TestWrapper }
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('useAccount', () => {
    it('should initialize with null account', () => {
      const { result } = renderHook(() => useAccount(), {
        wrapper: TestWrapper,
      });

      expect(result.current.account).toBeNull();
      expect(result.current.transactions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should provide refresh function', () => {
      const { result } = renderHook(() => useAccount(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.refresh).toBe('function');
    });

    it('should have hasBalance property', () => {
      const { result } = renderHook(() => useAccount(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.hasBalance).toBe('boolean');
    });
  });

  describe('useTransaction', () => {
    it('should initialize with idle status', () => {
      const { result } = renderHook(() => useTransaction(), {
        wrapper: TestWrapper,
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.transaction).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should provide submit function', () => {
      const { result } = renderHook(() => useTransaction(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.submit).toBe('function');
    });

    it('should provide control functions', () => {
      const { result } = renderHook(() => useTransaction(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.cancel).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('useContract', () => {
    it('should initialize with null contract', () => {
      const { result } = renderHook(() => useContract('0x123'), {
        wrapper: TestWrapper,
      });

      expect(result.current.contract).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should provide read and write functions', () => {
      const { result } = renderHook(() => useContract('0x123'), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.read).toBe('function');
      expect(typeof result.current.write).toBe('function');
    });

    it('should provide estimateGas function', () => {
      const { result } = renderHook(() => useContract('0x123'), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.estimateGas).toBe('function');
    });

    it('should provide getEvents function', () => {
      const { result } = renderHook(() => useContract('0x123'), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.getEvents).toBe('function');
    });
  });

  describe('useEvents', () => {
    it('should initialize with empty events', () => {
      const { result } = renderHook(() => useEvents(), {
        wrapper: TestWrapper,
      });

      expect(result.current.events).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should provide subscribe and unsubscribeAll functions', () => {
      const { result } = renderHook(() => useEvents(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.subscribe).toBe('function');
      expect(typeof result.current.unsubscribeAll).toBe('function');
    });

    it('should provide clear function', () => {
      const { result } = renderHook(() => useEvents(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.clear).toBe('function');
    });
  });

  describe('useBlockSubscription', () => {
    it('should initialize with null block', () => {
      const { result } = renderHook(() => useBlockSubscription(), {
        wrapper: TestWrapper,
      });

      expect(result.current.block).toBeNull();
      expect(result.current.isSubscribed).toBe(false);
    });

    it('should provide subscribe and unsubscribe functions', () => {
      const { result } = renderHook(() => useBlockSubscription(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.subscribe).toBe('function');
      expect(typeof result.current.unsubscribe).toBe('function');
    });
  });

  describe('Utility Hooks', () => {
    describe('useDebounce', () => {
      it('should debounce value changes', async () => {
        const { result, rerender } = renderHook(
          ({ value, delay }) => useDebounce(value, delay),
          {
            initialProps: { value: 'initial', delay: 500 },
            wrapper: TestWrapper,
          }
        );

        expect(result.current).toBe('initial');

        rerender({ value: 'updated', delay: 500 });

        // Value should not change immediately
        expect(result.current).toBe('initial');

        // Wait for debounce delay
        await waitFor(
          () => {
            expect(result.current).toBe('updated');
          },
          { timeout: 1000 }
        );
      });
    });

    describe('useLocalStorage', () => {
      beforeEach(() => {
        localStorage.clear();
      });

      it('should initialize with default value', () => {
        const { result } = renderHook(() => useLocalStorage('test-key', 'default'), {
          wrapper: TestWrapper,
        });

        expect(result.current[0]).toBe('default');
      });

      it('should update value', () => {
        const { result } = renderHook(() => useLocalStorage('test-key', 'default'), {
          wrapper: TestWrapper,
        });

        act(() => {
          result.current[1]('updated');
        });

        expect(result.current[0]).toBe('updated');
      });

      it('should persist to localStorage', () => {
        const { result } = renderHook(() => useLocalStorage('test-key', 'default'), {
          wrapper: TestWrapper,
        });

        act(() => {
          result.current[1]('persisted');
        });

        const stored = localStorage.getItem('test-key');
        expect(JSON.parse(stored!)).toBe('persisted');
      });
    });

    describe('usePrevious', () => {
      it('should return undefined on first render', () => {
        const { result } = renderHook(() => usePrevious('initial'), {
          wrapper: TestWrapper,
        });

        expect(result.current).toBeUndefined();
      });

      it('should return previous value on update', () => {
        const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
          initialProps: { value: 'initial' },
          wrapper: TestWrapper,
        });

        expect(result.current).toBeUndefined();

        rerender({ value: 'updated' });

        expect(result.current).toBe('initial');
      });
    });

    describe('useIsMounted', () => {
      it('should return true when mounted', () => {
        const { result } = renderHook(() => useIsMounted(), {
          wrapper: TestWrapper,
        });

        const isMounted = result.current();
        expect(isMounted).toBe(true);
      });

      it('should return function', () => {
        const { result } = renderHook(() => useIsMounted(), {
          wrapper: TestWrapper,
        });

        expect(typeof result.current).toBe('function');
      });
    });
  });

  describe('Batch Hooks', () => {
    describe('useMultiBalance', () => {
      it('should handle empty addresses array', () => {
        const { result } = renderHook(() => useMultiBalance([]), {
          wrapper: TestWrapper,
        });

        expect(result.current.balances).toEqual([]);
        expect(result.current.isLoading).toBe(false);
      });

      it('should provide refresh function', () => {
        const { result } = renderHook(
          () => useMultiBalance(['address1', 'address2']),
          { wrapper: TestWrapper }
        );

        expect(typeof result.current.refresh).toBe('function');
      });
    });

    describe('useMultiContract', () => {
      it('should handle empty addresses array', () => {
        const { result } = renderHook(() => useMultiContract([]), {
          wrapper: TestWrapper,
        });

        expect(result.current.contracts).toEqual([]);
        expect(result.current.isLoading).toBe(false);
      });

      it('should provide refresh function', () => {
        const { result } = renderHook(
          () => useMultiContract(['0x123', '0x456']),
          { wrapper: TestWrapper }
        );

        expect(typeof result.current.refresh).toBe('function');
      });
    });

    describe('useBatchTransactions', () => {
      it('should initialize with idle status', () => {
        const { result } = renderHook(() => useBatchTransactions(), {
          wrapper: TestWrapper,
        });

        expect(result.current.status).toBe('idle');
        expect(result.current.transactions).toEqual([]);
      });

      it('should provide submit function', () => {
        const { result } = renderHook(() => useBatchTransactions(), {
          wrapper: TestWrapper,
        });

        expect(typeof result.current.submit).toBe('function');
      });

      it('should provide control functions', () => {
        const { result } = renderHook(() => useBatchTransactions(), {
          wrapper: TestWrapper,
        });

        expect(typeof result.current.cancel).toBe('function');
        expect(typeof result.current.reset).toBe('function');
      });
    });
  });
});
