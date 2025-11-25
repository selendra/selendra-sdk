/**
 * useStaking Hook
 *
 * React hook for staking operations and queries.
 *
 * @example
 * ```tsx
 * import { useStaking } from '@selendrajs/sdk-core/react';
 *
 * function StakingDashboard({ address }: { address: string }) {
 *   const { staking, loading, error, bond, nominate, unbond } = useStaking(address);
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       <p>Bonded: {staking?.bonded}</p>
 *       <p>Stash: {staking?.stash}</p>
 *       <p>Nominating: {staking?.nominations?.length || 0} validators</p>
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
  StakingLedger,
  Nominations,
  ValidatorPrefs,
  RewardDestination,
} from "../pallets/staking/types.js";

/**
 * Staking state
 */
export interface StakingState {
  /** Stash account address */
  stash: string | null;
  /** Controller account address */
  controller: string | null;
  /** Staking ledger */
  ledger: StakingLedger | null;
  /** Current nominations */
  nominations: Nominations | null;
  /** Validator preferences (if validating) */
  validatorPrefs: ValidatorPrefs | null;
  /** Whether account is bonded */
  isBonded: boolean;
  /** Whether account is nominating */
  isNominating: boolean;
  /** Whether account is validating */
  isValidating: boolean;
  /** Bonded amount (formatted) */
  bonded: string;
  /** Unbonding amount (formatted) */
  unbonding: string;
  /** Current era */
  currentEra: number | null;
  /** Active era */
  activeEra: number | null;
  /** Minimum nominator bond */
  minNominatorBond: string;
  /** Minimum validator bond */
  minValidatorBond: string;
  /** Token symbol */
  symbol: string;
  /** Token decimals */
  decimals: number;
}

/**
 * Result type for useStaking hook
 */
export interface UseStakingResult {
  /** Staking state (null if loading or error) */
  staking: StakingState | null;
  /** Whether staking info is loading */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Refresh staking info */
  refresh: () => Promise<void>;
  /** Bond tokens for staking */
  bond: (
    value: string | bigint,
    payee: RewardDestination,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Bond extra tokens */
  bondExtra: (
    value: string | bigint,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Unbond tokens */
  unbond: (
    value: string | bigint,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Withdraw unbonded tokens */
  withdrawUnbonded: (
    numSlashingSpans: number,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Nominate validators */
  nominate: (
    targets: string[],
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Stop nominating/validating */
  chill: (signer: Signer, signerAddress: string) => Promise<string>;
  /** Set reward destination */
  setPayee: (
    payee: RewardDestination,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Rebond unbonding tokens */
  rebond: (
    value: string | bigint,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Validate with given preferences */
  validate: (
    prefs: ValidatorPrefs,
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
 * Hook for staking operations
 *
 * @param address - Account address to query staking info for
 * @param options - Hook options
 * @returns Staking state and operation functions
 *
 * @example
 * ```tsx
 * const { staking, bond, nominate } = useStaking(address);
 *
 * // Bond tokens
 * await bond('1000000000000', 'Staked', signer, address);
 *
 * // Nominate validators
 * await nominate(['validator1', 'validator2'], signer, address);
 * ```
 */
export function useStaking(
  address?: string,
  options: { autoFetch?: boolean } = {}
): UseStakingResult {
  const { autoFetch = true } = options;
  const { sdk, isConnected } = useSelendra();

  const [staking, setStaking] = useState<StakingState | null>(null);
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

  // Fetch staking info
  const fetchStakingInfo = useCallback(async () => {
    if (!sdk || !isConnected || !address) {
      setStaking(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const stakingPallet = sdk.pallets.staking;
      if (!stakingPallet) {
        throw new Error("Staking pallet not available");
      }

      const queries = stakingPallet.queries;
      const { decimals, symbol } = getChainInfo();

      // Fetch staking info
      const [
        bonded,
        ledger,
        nominations,
        validators,
        activeEra,
        currentEra,
        minNominatorBond,
        minValidatorBond,
      ] = await Promise.all([
        queries.bonded(address).catch(() => null),
        queries.ledger(address).catch(() => null),
        queries.nominators(address).catch(() => null),
        queries.validators(address).catch(() => null),
        queries.activeEra().catch(() => null),
        queries.currentEra().catch(() => null),
        queries.minNominatorBond().catch(() => "0"),
        queries.minValidatorBond().catch(() => "0"),
      ]);

      // Calculate unbonding amount
      let unbondingAmount = BigInt(0);
      if (ledger?.unlocking) {
        for (const chunk of ledger.unlocking) {
          unbondingAmount += BigInt(chunk.value);
        }
      }

      const stakingState: StakingState = {
        stash: address,
        controller: bonded,
        ledger,
        nominations,
        validatorPrefs: validators,
        isBonded: !!ledger,
        isNominating: !!nominations && nominations.targets.length > 0,
        isValidating: !!validators,
        bonded: formatBalance(ledger?.active, decimals),
        unbonding: formatBalance(unbondingAmount, decimals),
        currentEra: currentEra ? Number(currentEra) : null,
        activeEra: activeEra?.index ? Number(activeEra.index) : null,
        minNominatorBond: formatBalance(minNominatorBond, decimals),
        minValidatorBond: formatBalance(minValidatorBond, decimals),
        symbol,
        decimals,
      };

      setStaking(stakingState);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setStaking(null);
    } finally {
      setLoading(false);
    }
  }, [sdk, isConnected, address, getChainInfo]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchStakingInfo();
  }, [fetchStakingInfo]);

  // Bond tokens
  const bond = useCallback(
    async (
      value: string | bigint,
      payee: RewardDestination,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const stakingManager = sdk.pallets.staking?.manager;
      if (!stakingManager) throw new Error("Staking pallet not available");

      const result = await stakingManager.bond(signer, signerAddress, {
        value: typeof value === "bigint" ? value.toString() : value,
        payee,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Bond extra
  const bondExtra = useCallback(
    async (
      value: string | bigint,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const stakingManager = sdk.pallets.staking?.manager;
      if (!stakingManager) throw new Error("Staking pallet not available");

      const result = await stakingManager.bondExtra(signer, signerAddress, {
        maxAdditional: typeof value === "bigint" ? value.toString() : value,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Unbond
  const unbond = useCallback(
    async (
      value: string | bigint,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const stakingManager = sdk.pallets.staking?.manager;
      if (!stakingManager) throw new Error("Staking pallet not available");

      const result = await stakingManager.unbond(signer, signerAddress, {
        value: typeof value === "bigint" ? value.toString() : value,
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

      const stakingManager = sdk.pallets.staking?.manager;
      if (!stakingManager) throw new Error("Staking pallet not available");

      const result = await stakingManager.withdrawUnbonded(
        signer,
        signerAddress,
        {
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
      targets: string[],
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const stakingManager = sdk.pallets.staking?.manager;
      if (!stakingManager) throw new Error("Staking pallet not available");

      const result = await stakingManager.nominate(signer, signerAddress, {
        targets,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Chill
  const chill = useCallback(
    async (signer: Signer, signerAddress: string): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const stakingManager = sdk.pallets.staking?.manager;
      if (!stakingManager) throw new Error("Staking pallet not available");

      const result = await stakingManager.chill(signer, signerAddress);

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Set payee
  const setPayee = useCallback(
    async (
      payee: RewardDestination,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const stakingManager = sdk.pallets.staking?.manager;
      if (!stakingManager) throw new Error("Staking pallet not available");

      const result = await stakingManager.setPayee(signer, signerAddress, {
        payee,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Rebond
  const rebond = useCallback(
    async (
      value: string | bigint,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const stakingManager = sdk.pallets.staking?.manager;
      if (!stakingManager) throw new Error("Staking pallet not available");

      const result = await stakingManager.rebond(signer, signerAddress, {
        value: typeof value === "bigint" ? value.toString() : value,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Validate
  const validate = useCallback(
    async (
      prefs: ValidatorPrefs,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const stakingManager = sdk.pallets.staking?.manager;
      if (!stakingManager) throw new Error("Staking pallet not available");

      const result = await stakingManager.validate(signer, signerAddress, {
        prefs,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Auto-fetch on mount or address change
  useEffect(() => {
    if (autoFetch && address && isConnected) {
      fetchStakingInfo();
    }
  }, [autoFetch, address, isConnected, fetchStakingInfo]);

  return {
    staking,
    loading,
    error,
    refresh,
    bond,
    bondExtra,
    unbond,
    withdrawUnbonded,
    nominate,
    chill,
    setPayee,
    rebond,
    validate,
  };
}
