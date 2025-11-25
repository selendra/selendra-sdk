/**
 * useBalance Hook
 *
 * React hook for querying and subscribing to account balances.
 *
 * @example
 * ```tsx
 * import { useBalance } from '@selendrajs/sdk/react';
 *
 * function BalanceDisplay({ address }: { address: string }) {
 *   const { balance, loading, error, refresh } = useBalance(address);
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!balance) return null;
 *
 *   return (
 *     <div>
 *       <p>Free: {balance.free}</p>
 *       <p>Reserved: {balance.reserved}</p>
 *       <p>Total: {balance.total}</p>
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useSelendra } from "./useSelendra.js";
import type {
  AccountData,
  BalanceLock,
  ReserveData,
} from "../pallets/balances/types.js";

/**
 * Balance state with formatted values
 */
export interface BalanceState {
  /** Raw account data from chain */
  raw: AccountData | null;
  /** Free balance (formatted string with decimals) */
  free: string;
  /** Reserved balance (formatted string with decimals) */
  reserved: string;
  /** Total balance (free + reserved) */
  total: string;
  /** Frozen balance */
  frozen: string;
  /** Transferable balance (free - frozen) */
  transferable: string;
  /** Balance locks */
  locks: BalanceLock[];
  /** Balance reserves */
  reserves: ReserveData[];
  /** Existential deposit for the chain */
  existentialDeposit: string;
  /** Token symbol */
  symbol: string;
  /** Token decimals */
  decimals: number;
}

/**
 * Result type for useBalance hook
 */
export interface UseBalanceResult {
  /** Balance data (null if loading or error) */
  balance: BalanceState | null;
  /** Whether balance is loading */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Refresh balance */
  refresh: () => Promise<void>;
  /** Subscribe to balance changes */
  subscribe: () => () => void;
}

/**
 * Format a balance value with decimals
 */
function formatBalance(value: string | bigint, decimals: number): string {
  const strValue = typeof value === "bigint" ? value.toString() : value;

  if (strValue === "0") return "0";

  // Pad with zeros if needed
  const paddedValue = strValue.padStart(decimals + 1, "0");
  const integerPart = paddedValue.slice(0, -decimals) || "0";
  const decimalPart = paddedValue.slice(-decimals).replace(/0+$/, "");

  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
}

/**
 * Hook to query and subscribe to account balance
 *
 * @param address - Account address to query (optional, uses empty if not provided)
 * @param options - Hook options
 * @returns Balance state and control functions
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { balance, loading, error } = useBalance('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
 *
 * // With auto-subscribe
 * const { balance, subscribe } = useBalance(address);
 * useEffect(() => subscribe(), [subscribe]);
 *
 * // Display formatted balance
 * {balance && <span>{balance.free} {balance.symbol}</span>}
 * ```
 */
export function useBalance(
  address?: string,
  options: { autoFetch?: boolean; autoSubscribe?: boolean } = {}
): UseBalanceResult {
  const { autoFetch = true, autoSubscribe = false } = options;
  const { sdk, isConnected } = useSelendra();

  const [balance, setBalance] = useState<BalanceState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const addressRef = useRef(address);
  addressRef.current = address;

  // Get chain metadata
  const getChainInfo = useCallback(() => {
    if (!sdk || !isConnected) {
      return { decimals: 18, symbol: "SEL" };
    }

    const connectionInfo = sdk.getConnectionInfo();
    return {
      decimals: connectionInfo?.tokenDecimals ?? 18,
      symbol: connectionInfo?.tokenSymbol ?? "SEL",
    };
  }, [sdk, isConnected]);

  // Process raw account data into formatted balance state
  const processBalance = useCallback(
    async (accountData: AccountData): Promise<BalanceState> => {
      const { decimals, symbol } = getChainInfo();

      // Get locks and reserves
      let locks: BalanceLock[] = [];
      let reserves: ReserveData[] = [];
      let existentialDeposit = "0";

      if (sdk && addressRef.current) {
        try {
          const balancesQueries = sdk.pallets.balances?.queries;
          if (balancesQueries) {
            locks = await balancesQueries.locks(addressRef.current);
            reserves = await balancesQueries.reserves(addressRef.current);
            existentialDeposit = formatBalance(
              balancesQueries.getExistentialDeposit(),
              decimals
            );
          }
        } catch {
          // Ignore errors for optional data
        }
      }

      const free = BigInt(accountData.free);
      const reserved = BigInt(accountData.reserved);
      const frozen = BigInt(accountData.frozen);
      const total = free + reserved;
      const transferable = free > frozen ? free - frozen : BigInt(0);

      return {
        raw: accountData,
        free: formatBalance(free, decimals),
        reserved: formatBalance(reserved, decimals),
        total: formatBalance(total, decimals),
        frozen: formatBalance(frozen, decimals),
        transferable: formatBalance(transferable, decimals),
        locks,
        reserves,
        existentialDeposit,
        symbol,
        decimals,
      };
    },
    [sdk, getChainInfo]
  );

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!sdk || !isConnected || !address) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const balancesQueries = sdk.pallets.balances?.queries;
      if (!balancesQueries) {
        throw new Error("Balances pallet not available");
      }

      const accountData = await balancesQueries.account(address);
      const processedBalance = await processBalance(accountData);
      setBalance(processedBalance);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [sdk, isConnected, address, processBalance]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  // Subscribe to balance changes
  const subscribe = useCallback((): (() => void) => {
    if (!sdk || !isConnected || !address) {
      return () => {};
    }

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    try {
      const api = sdk.getSubstrateApi();
      if (!api) return () => {};

      // Subscribe to account changes - use .then() instead of await
      api.query.system.account(
        address,
        async (accountInfo: unknown) => {
          try {
            // Extract data from accountInfo
            const info = accountInfo as { data?: AccountData };
            if (info?.data) {
              const processedBalance = await processBalance(info.data);
              setBalance(processedBalance);
            }
          } catch (err) {
            console.error("Error processing balance update:", err);
          }
        }
      ).then((unsub) => {
        // Store unsubscribe function
        unsubscribeRef.current = unsub as unknown as () => void;
      });

      // Return cleanup function
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    } catch (err) {
      console.error("Error subscribing to balance:", err);
      return () => {};
    }
  }, [sdk, isConnected, address, processBalance]);

  // Auto-fetch on mount or address change
  useEffect(() => {
    if (autoFetch && address && isConnected) {
      fetchBalance();
    }
  }, [autoFetch, address, isConnected, fetchBalance]);

  // Auto-subscribe if enabled
  useEffect(() => {
    if (autoSubscribe && address && isConnected) {
      return subscribe();
    }
  }, [autoSubscribe, address, isConnected, subscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    balance,
    loading,
    error,
    refresh,
    subscribe,
  };
}
