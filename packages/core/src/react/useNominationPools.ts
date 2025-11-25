/**
 * useNominationPools Hook
 *
 * React hook for nomination pool operations.
 *
 * @example
 * ```tsx
 * import { useNominationPools } from '@selendrajs/sdk/react';
 *
 * function PoolsDashboard() {
 *   const { pools, memberInfo, loading, join, create } = useNominationPools(address);
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <h2>Available Pools: {pools?.length}</h2>
 *       {memberInfo && <p>Your Pool: #{memberInfo.poolId}</p>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

import { useState, useEffect, useCallback } from "react";
import { useSelendra } from "./useSelendra.js";
import type { Signer } from "@polkadot/api/types";
import type {
  PoolInfo,
  PoolMember,
  PoolState,
} from "../pallets/nomination-pools/types.js";

/**
 * Pools state
 */
export interface PoolsState {
  /** All active pools */
  pools: PoolInfo[];
  /** Current account's pool membership */
  memberInfo: PoolMember | null;
  /** Current pool ID (if member) */
  poolId: number | null;
  /** Pool metadata (if member) */
  poolMetadata: string | null;
  /** Pending rewards (if member) */
  pendingRewards: string;
  /** Total bonded in pools */
  totalBonded: string;
  /** Pool count */
  poolCount: number;
  /** Minimum join bond */
  minJoinBond: string;
  /** Minimum create bond */
  minCreateBond: string;
  /** Token symbol */
  symbol: string;
  /** Token decimals */
  decimals: number;
}

/**
 * Result type for useNominationPools hook
 */
export interface UseNominationPoolsResult {
  /** Pools state (null if loading or error) */
  pools: PoolsState | null;
  /** Whether pools info is loading */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Refresh pools info */
  refresh: () => Promise<void>;
  /** Get pool info by ID */
  getPoolInfo: (poolId: number) => Promise<PoolInfo | null>;
  /** Join a pool */
  join: (
    poolId: number,
    amount: string | bigint,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Create a new pool */
  create: (
    amount: string | bigint,
    root: string,
    nominator: string,
    bouncer: string,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Bond extra to pool */
  bondExtra: (
    extra: "FreeBalance" | { Rewards: null },
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Claim pool rewards */
  claimPayout: (signer: Signer, signerAddress: string) => Promise<string>;
  /** Unbond from pool */
  unbond: (
    points: string | bigint,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Withdraw unbonded from pool */
  withdrawUnbonded: (
    numSlashingSpans: number,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Nominate validators for pool */
  nominate: (
    poolId: number,
    validators: string[],
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Set pool state */
  setState: (
    poolId: number,
    state: PoolState,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
}

/**
 * Format a balance value with decimals
 */
function formatBalance(
  value: string | bigint | undefined,
  decimals: number
): string {
  if (value === undefined) return "0";
  const strValue = typeof value === "bigint" ? value.toString() : value;

  if (strValue === "0") return "0";

  const paddedValue = strValue.padStart(decimals + 1, "0");
  const integerPart = paddedValue.slice(0, -decimals) || "0";
  const decimalPart = paddedValue.slice(-decimals).replace(/0+$/, "");

  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
}

/**
 * Hook for nomination pools operations
 *
 * @param address - Account address to query pool membership for
 * @param options - Hook options
 * @returns Pools state and operation functions
 *
 * @example
 * ```tsx
 * const { pools, join, create } = useNominationPools(address);
 *
 * // Join a pool
 * await join(1, '10000000000000', signer, address);
 *
 * // Create a new pool
 * await create('100000000000000', root, nominator, bouncer, signer, address);
 * ```
 */
export function useNominationPools(
  address?: string,
  options: { autoFetch?: boolean } = {}
): UseNominationPoolsResult {
  const { autoFetch = true } = options;
  const { sdk, isConnected } = useSelendra();

  const [pools, setPools] = useState<PoolsState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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

  // Fetch pools info
  const fetchPoolsInfo = useCallback(async () => {
    if (!sdk || !isConnected) {
      setPools(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const poolsQueries = sdk.pallets.nominationPools?.queries;
      if (!poolsQueries) {
        throw new Error("Nomination Pools pallet not available");
      }

      const { decimals, symbol } = getChainInfo();

      // Fetch pools info
      const [lastPoolId, allPools, minJoinBond, minCreateBond] =
        await Promise.all([
          poolsQueries.lastPoolId().catch(() => 0),
          poolsQueries.getAllPools().catch(() => []),
          poolsQueries.minJoinBond().catch(() => "0"),
          poolsQueries.minCreateBond().catch(() => "0"),
        ]);

      // Calculate total bonded
      let totalBonded = BigInt(0);
      for (const pool of allPools) {
        if (pool.points) {
          totalBonded += BigInt(pool.points);
        }
      }

      // Get member info if address provided
      let memberInfo: PoolMember | null = null;
      let poolId: number | null = null;
      let poolMetadata: string | null = null;
      let pendingRewards = "0";

      if (address) {
        try {
          memberInfo = await poolsQueries.poolMembers(address);
          if (memberInfo?.poolId) {
            poolId = Number(memberInfo.poolId);
            poolMetadata = await poolsQueries
              .metadata(poolId)
              .catch(() => null);
            const rewards = await poolsQueries
              .pendingRewards(address)
              .catch(() => "0");
            pendingRewards = formatBalance(rewards, decimals);
          }
        } catch {
          // Not a pool member
        }
      }

      setPools({
        pools: allPools,
        memberInfo,
        poolId,
        poolMetadata,
        pendingRewards,
        totalBonded: formatBalance(totalBonded, decimals),
        poolCount: lastPoolId,
        minJoinBond: formatBalance(minJoinBond, decimals),
        minCreateBond: formatBalance(minCreateBond, decimals),
        symbol,
        decimals,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setPools(null);
    } finally {
      setLoading(false);
    }
  }, [sdk, isConnected, address, getChainInfo]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchPoolsInfo();
  }, [fetchPoolsInfo]);

  // Get pool info by ID
  const getPoolInfo = useCallback(
    async (poolId: number): Promise<PoolInfo | null> => {
      if (!sdk) return null;

      const poolsQueries = sdk.pallets.nominationPools?.queries;
      if (!poolsQueries) return null;

      try {
        return await poolsQueries.getPoolInfo(poolId);
      } catch {
        return null;
      }
    },
    [sdk]
  );

  // Join pool
  const join = useCallback(
    async (
      poolId: number,
      amount: string | bigint,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const poolsManager = sdk.pallets.nominationPools?.manager;
      if (!poolsManager)
        throw new Error("Nomination Pools pallet not available");

      const result = await poolsManager.join(signer, signerAddress, {
        amount: typeof amount === "bigint" ? amount.toString() : amount,
        poolId,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Create pool
  const create = useCallback(
    async (
      amount: string | bigint,
      root: string,
      nominator: string,
      bouncer: string,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const poolsManager = sdk.pallets.nominationPools?.manager;
      if (!poolsManager)
        throw new Error("Nomination Pools pallet not available");

      const result = await poolsManager.create(signer, signerAddress, {
        amount: typeof amount === "bigint" ? amount.toString() : amount,
        root,
        nominator,
        bouncer,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Bond extra
  const bondExtra = useCallback(
    async (
      extra: "FreeBalance" | { Rewards: null },
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const poolsManager = sdk.pallets.nominationPools?.manager;
      if (!poolsManager)
        throw new Error("Nomination Pools pallet not available");

      const result = await poolsManager.bondExtra(signer, signerAddress, {
        extra,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Claim payout
  const claimPayout = useCallback(
    async (signer: Signer, signerAddress: string): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const poolsManager = sdk.pallets.nominationPools?.manager;
      if (!poolsManager)
        throw new Error("Nomination Pools pallet not available");

      const result = await poolsManager.claimPayout(signer, signerAddress);

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Unbond
  const unbond = useCallback(
    async (
      points: string | bigint,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const poolsManager = sdk.pallets.nominationPools?.manager;
      if (!poolsManager)
        throw new Error("Nomination Pools pallet not available");

      const result = await poolsManager.unbond(signer, signerAddress, {
        memberAccount: signerAddress,
        unbondingPoints:
          typeof points === "bigint" ? points.toString() : points,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Withdraw unbonded
  const withdrawUnbonded = useCallback(
    async (
      numSlashingSpans: number,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const poolsManager = sdk.pallets.nominationPools?.manager;
      if (!poolsManager)
        throw new Error("Nomination Pools pallet not available");

      const result = await poolsManager.withdrawUnbonded(
        signer,
        signerAddress,
        {
          memberAccount: signerAddress,
          numSlashingSpans,
        }
      );

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Nominate
  const nominate = useCallback(
    async (
      poolId: number,
      validators: string[],
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const poolsManager = sdk.pallets.nominationPools?.manager;
      if (!poolsManager)
        throw new Error("Nomination Pools pallet not available");

      const result = await poolsManager.nominate(signer, signerAddress, {
        poolId,
        validators,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Set state
  const setState = useCallback(
    async (
      poolId: number,
      state: PoolState,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const poolsManager = sdk.pallets.nominationPools?.manager;
      if (!poolsManager)
        throw new Error("Nomination Pools pallet not available");

      const result = await poolsManager.setState(signer, signerAddress, {
        poolId,
        state,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Auto-fetch on mount or address change
  useEffect(() => {
    if (autoFetch && isConnected) {
      fetchPoolsInfo();
    }
  }, [autoFetch, isConnected, address, fetchPoolsInfo]);

  return {
    pools,
    loading,
    error,
    refresh,
    getPoolInfo,
    join,
    create,
    bondExtra,
    claimPayout,
    unbond,
    withdrawUnbonded,
    nominate,
    setState,
  };
}
