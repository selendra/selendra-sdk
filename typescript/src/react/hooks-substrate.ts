/**
 * Substrate-specific React Hooks
 *
 * Premium React hooks for Selendra's Substrate features including
 * Staking, Aleph Consensus, Elections, and Unified Accounts.
 *
 * @module react/hooks-substrate
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import type {
  ValidatorPerformance,
  SessionCommittee,
  AbftScore,
  CommitteeSeats,
  EraValidators,
  ElectionOpenness,
  ReferendumInfo,
  ProposalInfo,
  VoteInfo,
} from '../substrate';
import { Conviction } from '../substrate';

import { useSelendraContext } from './provider';

/**
 * Hook options for Substrate features
 */
export interface UseSubstrateOptions {
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Auto-refresh on mount */
  autoRefresh?: boolean;
  /** Enable real-time updates */
  realTime?: boolean;
}

/**
 * Staking hook return type
 */
export interface UseStakingReturn {
  /** Current era index */
  currentEra: number | null;
  /** Active era info */
  activeEra: any | null;
  /** Total staked amount */
  totalStaked: string | null;
  /** Validator count */
  validatorCount: number | null;
  /** Minimum stake required */
  minimumStake: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Bond tokens */
  bond: (amount: string, payee: string) => Promise<string>;
  /** Nominate validators */
  nominate: (targets: string[]) => Promise<string>;
  /** Stop nominating */
  chill: () => Promise<string>;
  /** Unbond tokens */
  unbond: (amount: string) => Promise<string>;
  /** Withdraw unbonded */
  withdrawUnbonded: () => Promise<string>;
}

/**
 * useStaking - Staking Management Hook
 *
 * Provides comprehensive staking functionality including bonding,
 * nominating, and rewards management.
 *
 * @param options - Hook options
 * @returns Staking operations and state
 *
 * @example
 * ```typescript
 * const {
 *   currentEra,
 *   validatorCount,
 *   bond,
 *   nominate,
 *   chill
 * } = useStaking({ refreshInterval: 60000 });
 *
 * // Bond tokens
 * await bond('1000000000000000000', 'Staked');
 *
 * // Nominate validators
 * await nominate(['validator1', 'validator2']);
 * ```
 */
export function useStaking(options: UseSubstrateOptions = {}): UseStakingReturn {
  const { sdk, isConnected } = useSelendraContext();
  const [currentEra, setCurrentEra] = useState<number | null>(null);
  const [activeEra, setActiveEra] = useState<any | null>(null);
  const [totalStaked, setTotalStaked] = useState<string | null>(null);
  const [validatorCount, setValidatorCount] = useState<number | null>(null);
  const [minimumStake, setMinimumStake] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!sdk || !isConnected) return;

    try {
      setIsLoading(true);
      setError(null);

      const substrate = (sdk as any).substrate;
      if (!substrate?.staking) {
        throw new Error('Staking client not available');
      }

      const [era, active, staked, count, minStake] = await Promise.all([
        substrate.staking.getCurrentEra().catch(() => null),
        substrate.staking.getActiveEra().catch(() => null),
        substrate.staking.getTotalStaked().catch(() => null),
        substrate.staking.getValidatorCount().catch(() => null),
        substrate.staking.getMinimumValidatorBond().catch(() => null),
      ]);

      setCurrentEra(era);
      setActiveEra(active);
      setTotalStaked(staked);
      setValidatorCount(count);
      setMinimumStake(minStake);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch staking data');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, isConnected]);

  useEffect(() => {
    if (options.autoRefresh !== false) {
      refresh();
    }
  }, [refresh, options.autoRefresh]);

  useEffect(() => {
    if (options.refreshInterval && isConnected) {
      const interval = setInterval(refresh, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, options.refreshInterval, isConnected]);

  const bond = useCallback(
    async (amount: string, payee: string): Promise<string> => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      const result = await substrate.staking.bond(amount, payee);
      await refresh();
      return result.hash;
    },
    [sdk, isConnected, refresh],
  );

  const nominate = useCallback(
    async (targets: string[]): Promise<string> => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      const result = await substrate.staking.nominate(targets);
      await refresh();
      return result.hash;
    },
    [sdk, isConnected, refresh],
  );

  const chill = useCallback(async (): Promise<string> => {
    if (!sdk || !isConnected) throw new Error('Not connected');
    const substrate = (sdk as any).substrate;
    const result = await substrate.staking.chill();
    await refresh();
    return result.hash;
  }, [sdk, isConnected, refresh]);

  const unbond = useCallback(
    async (amount: string): Promise<string> => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      const result = await substrate.staking.unbond(amount);
      await refresh();
      return result.hash;
    },
    [sdk, isConnected, refresh],
  );

  const withdrawUnbonded = useCallback(async (): Promise<string> => {
    if (!sdk || !isConnected) throw new Error('Not connected');
    const substrate = (sdk as any).substrate;
    const result = await substrate.staking.withdrawUnbonded();
    await refresh();
    return result.hash;
  }, [sdk, isConnected, refresh]);

  return {
    currentEra,
    activeEra,
    totalStaked,
    validatorCount,
    minimumStake,
    isLoading,
    error,
    refresh,
    bond,
    nominate,
    chill,
    unbond,
    withdrawUnbonded,
  };
}

/**
 * Aleph consensus hook return type
 */
export interface UseAlephReturn {
  /** Current session index */
  currentSession: number | null;
  /** Active validators */
  activeValidators: string[];
  /** Session committee */
  committee: SessionCommittee | null;
  /** Session length in blocks */
  sessionLength: number | null;
  /** Session progress */
  sessionProgress: { current: number; total: number; remaining: number } | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Get validator performance */
  getValidatorPerformance: (address: string) => Promise<ValidatorPerformance | null>;
  /** Get validator history */
  getValidatorHistory: (address: string, sessions?: number) => Promise<AbftScore[]>;
  /** Check if validator is banned */
  isValidatorBanned: (address: string) => Promise<boolean>;
}

/**
 * useAleph - Aleph Consensus Hook
 *
 * Provides access to Aleph BFT consensus information including
 * validator performance, session data, and committee management.
 *
 * @param options - Hook options
 * @returns Aleph consensus data and operations
 *
 * @example
 * ```typescript
 * const {
 *   currentSession,
 *   activeValidators,
 *   getValidatorPerformance,
 *   sessionProgress
 * } = useAleph({ refreshInterval: 30000 });
 *
 * // Get validator performance
 * const perf = await getValidatorPerformance(validatorAddress);
 * console.log(`Uptime: ${perf.uptime}%`);
 * ```
 */
export function useAleph(options: UseSubstrateOptions = {}): UseAlephReturn {
  const { sdk, isConnected } = useSelendraContext();
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [activeValidators, setActiveValidators] = useState<string[]>([]);
  const [committee, setCommittee] = useState<SessionCommittee | null>(null);
  const [sessionLength, setSessionLength] = useState<number | null>(null);
  const [sessionProgress, setSessionProgress] = useState<{
    current: number;
    total: number;
    remaining: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!sdk || !isConnected) return;

    try {
      setIsLoading(true);
      setError(null);

      const substrate = (sdk as any).substrate;
      if (!substrate?.aleph) {
        throw new Error('Aleph client not available');
      }

      const [session, validators, comm, length, progress] = await Promise.all([
        substrate.aleph.getCurrentSession().catch(() => null),
        substrate.aleph.getActiveValidators().catch(() => []),
        substrate.aleph
          .getSessionCommittee(await substrate.aleph.getCurrentSession())
          .catch(() => null),
        substrate.aleph.getSessionLength().catch(() => null),
        substrate.aleph.getSessionProgress().catch(() => null),
      ]);

      setCurrentSession(session);
      setActiveValidators(validators);
      setCommittee(comm);
      setSessionLength(length);
      setSessionProgress(progress);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch Aleph data');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, isConnected]);

  useEffect(() => {
    if (options.autoRefresh !== false) {
      refresh();
    }
  }, [refresh, options.autoRefresh]);

  useEffect(() => {
    if (options.refreshInterval && isConnected) {
      const interval = setInterval(refresh, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, options.refreshInterval, isConnected]);

  const getValidatorPerformance = useCallback(
    async (address: string): Promise<ValidatorPerformance | null> => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      return await substrate.aleph.getValidatorPerformance(address);
    },
    [sdk, isConnected],
  );

  const getValidatorHistory = useCallback(
    async (address: string, sessions: number = 10): Promise<AbftScore[]> => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      return await substrate.aleph.getValidatorHistory(address, sessions);
    },
    [sdk, isConnected],
  );

  const isValidatorBanned = useCallback(
    async (address: string): Promise<boolean> => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      return await substrate.aleph.isValidatorBanned(address);
    },
    [sdk, isConnected],
  );

  return {
    currentSession,
    activeValidators,
    committee,
    sessionLength,
    sessionProgress,
    isLoading,
    error,
    refresh,
    getValidatorPerformance,
    getValidatorHistory,
    isValidatorBanned,
  };
}

/**
 * Elections hook return type
 */
export interface UseElectionsReturn {
  /** Committee seats configuration */
  committeeSeats: CommitteeSeats | null;
  /** Next era validators */
  nextEraValidators: EraValidators | null;
  /** Election openness mode */
  electionOpenness: ElectionOpenness | null;
  /** Total validator count */
  totalValidators: number | null;
  /** Current era */
  currentEra: number | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Check if address is reserved validator */
  isReservedValidator: (address: string) => Promise<boolean>;
  /** Check if address is non-reserved validator */
  isNonReservedValidator: (address: string) => Promise<boolean>;
  /** Get validator statistics */
  getValidatorStats: () => Promise<any>;
}

/**
 * useElections - Elections Pallet Hook
 *
 * Provides access to validator election information including
 * committee configuration, validator sets, and election status.
 *
 * @param options - Hook options
 * @returns Elections data and operations
 *
 * @example
 * ```typescript
 * const {
 *   committeeSeats,
 *   nextEraValidators,
 *   electionOpenness,
 *   isReservedValidator
 * } = useElections({ refreshInterval: 60000 });
 *
 * // Check validator status
 * const isReserved = await isReservedValidator(address);
 * ```
 */
export function useElections(options: UseSubstrateOptions = {}): UseElectionsReturn {
  const { sdk, isConnected } = useSelendraContext();
  const [committeeSeats, setCommitteeSeats] = useState<CommitteeSeats | null>(null);
  const [nextEraValidators, setNextEraValidators] = useState<EraValidators | null>(null);
  const [electionOpenness, setElectionOpenness] = useState<ElectionOpenness | null>(null);
  const [totalValidators, setTotalValidators] = useState<number | null>(null);
  const [currentEra, setCurrentEra] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!sdk || !isConnected) return;

    try {
      setIsLoading(true);
      setError(null);

      const substrate = (sdk as any).substrate;
      if (!substrate?.elections) {
        throw new Error('Elections client not available');
      }

      const [seats, validators, openness, count, era] = await Promise.all([
        substrate.elections.getCommitteeSeats().catch(() => null),
        substrate.elections.getNextEraValidators().catch(() => null),
        substrate.elections.getElectionOpenness().catch(() => null),
        substrate.elections.getTotalValidatorCount().catch(() => null),
        substrate.elections.getCurrentEra().catch(() => null),
      ]);

      setCommitteeSeats(seats);
      setNextEraValidators(validators);
      setElectionOpenness(openness);
      setTotalValidators(count);
      setCurrentEra(era);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch elections data');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, isConnected]);

  useEffect(() => {
    if (options.autoRefresh !== false) {
      refresh();
    }
  }, [refresh, options.autoRefresh]);

  useEffect(() => {
    if (options.refreshInterval && isConnected) {
      const interval = setInterval(refresh, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, options.refreshInterval, isConnected]);

  const isReservedValidator = useCallback(
    async (address: string): Promise<boolean> => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      return await substrate.elections.isReservedValidator(address);
    },
    [sdk, isConnected],
  );

  const isNonReservedValidator = useCallback(
    async (address: string): Promise<boolean> => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      return await substrate.elections.isNonReservedValidator(address);
    },
    [sdk, isConnected],
  );

  const getValidatorStats = useCallback(async () => {
    if (!sdk || !isConnected) throw new Error('Not connected');
    const substrate = (sdk as any).substrate;
    return await substrate.elections.getValidatorStats();
  }, [sdk, isConnected]);

  return {
    committeeSeats,
    nextEraValidators,
    electionOpenness,
    totalValidators,
    currentEra,
    isLoading,
    error,
    refresh,
    isReservedValidator,
    isNonReservedValidator,
    getValidatorStats,
  };
}

/**
 * Unified accounts hook return type
 */
export interface UseUnifiedAccountsReturn {
  /** Convert Substrate to EVM address */
  substrateToEvm: (address: string) => string;
  /** Convert EVM to Substrate address */
  evmToSubstrate: (address: string) => string;
  /** Get unified balance (Substrate + EVM) */
  getUnifiedBalance: (address: string) => Promise<{
    substrate: { free: string; reserved: string; frozen: string };
    evm: string;
    total: string;
  }>;
  /** Validate address format */
  validateAddress: (address: string) => { valid: boolean; type: 'substrate' | 'evm' | 'unknown' };
  /** Batch convert addresses */
  batchConvert: (addresses: string[], targetFormat: 'substrate' | 'evm') => string[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * useUnifiedAccounts - Unified Accounts Hook
 *
 * Provides seamless Substrate<->EVM address conversion and
 * unified balance queries across both chains.
 *
 * @returns Unified accounts operations
 *
 * @example
 * ```typescript
 * const {
 *   substrateToEvm,
 *   evmToSubstrate,
 *   getUnifiedBalance,
 *   validateAddress
 * } = useUnifiedAccounts();
 *
 * // Convert addresses
 * const evmAddr = substrateToEvm(substrateAddress);
 * const subAddr = evmToSubstrate(evmAddress);
 *
 * // Get unified balance
 * const balance = await getUnifiedBalance(address);
 * console.log(`Total: ${balance.total}`);
 * ```
 */
export function useUnifiedAccounts(): UseUnifiedAccountsReturn {
  const { sdk, isConnected } = useSelendraContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const substrateToEvm = useCallback(
    (address: string): string => {
      if (!sdk) throw new Error('SDK not initialized');
      const substrate = (sdk as any).substrate;
      if (!substrate?.unifiedAccounts) {
        throw new Error('Unified accounts not available');
      }
      return substrate.unifiedAccounts.substrateToEvm(address);
    },
    [sdk],
  );

  const evmToSubstrate = useCallback(
    (address: string): string => {
      if (!sdk) throw new Error('SDK not initialized');
      const substrate = (sdk as any).substrate;
      if (!substrate?.unifiedAccounts) {
        throw new Error('Unified accounts not available');
      }
      return substrate.unifiedAccounts.evmToSubstrate(address);
    },
    [sdk],
  );

  const getUnifiedBalance = useCallback(
    async (address: string) => {
      if (!sdk || !isConnected) throw new Error('Not connected');

      try {
        setIsLoading(true);
        setError(null);

        const substrate = (sdk as any).substrate;
        if (!substrate?.unifiedAccounts) {
          throw new Error('Unified accounts not available');
        }

        const balance = await substrate.unifiedAccounts.getUnifiedBalance(address);
        return balance;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get unified balance');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [sdk, isConnected],
  );

  const validateAddress = useCallback(
    (address: string) => {
      if (!sdk) throw new Error('SDK not initialized');
      const substrate = (sdk as any).substrate;
      if (!substrate?.unifiedAccounts) {
        throw new Error('Unified accounts not available');
      }
      return substrate.unifiedAccounts.validateAddress(address);
    },
    [sdk],
  );

  const batchConvert = useCallback(
    (addresses: string[], targetFormat: 'substrate' | 'evm'): string[] => {
      if (!sdk) throw new Error('SDK not initialized');
      const substrate = (sdk as any).substrate;
      if (!substrate?.unifiedAccounts) {
        throw new Error('Unified accounts not available');
      }
      return substrate.unifiedAccounts.batchConvert(addresses, targetFormat);
    },
    [sdk],
  );

  return {
    substrateToEvm,
    evmToSubstrate,
    getUnifiedBalance,
    validateAddress,
    batchConvert,
    isLoading,
    error,
  };
}

/**
 * Governance hook return type
 */
export interface UseGovernanceReturn {
  /** All active referenda */
  activeReferenda: ReferendumInfo[];
  /** Public proposals (not yet referenda) */
  publicProposals: ProposalInfo[];
  /** Total referendum count */
  referendumCount: number | null;
  /** Minimum deposit to create proposal */
  minimumDeposit: string | null;
  /** Voting period in blocks */
  votingPeriod: number | null;
  /** Enactment period in blocks */
  enactmentPeriod: number | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Get specific referendum */
  getReferendum: (index: number) => Promise<ReferendumInfo>;
  /** Get voting record for account */
  getVotingOf: (referendumIndex: number, account: string) => Promise<VoteInfo | null>;
  /** Submit a proposal */
  propose: (
    signer: any,
    proposalHash: string,
    value: string,
  ) => Promise<{ blockHash: string; success: boolean; proposalIndex?: number }>;
  /** Second a proposal */
  second: (signer: any, proposalIndex: number) => Promise<{ blockHash: string; success: boolean }>;
  /** Vote on referendum */
  vote: (
    signer: any,
    referendumIndex: number,
    aye: boolean,
    balance: string,
    conviction?: Conviction,
  ) => Promise<{ blockHash: string; success: boolean }>;
  /** Remove vote */
  removeVote: (
    signer: any,
    referendumIndex: number,
  ) => Promise<{ blockHash: string; success: boolean }>;
  /** Delegate voting power */
  delegate: (
    signer: any,
    target: string,
    conviction: Conviction,
    balance: string,
  ) => Promise<{ blockHash: string; success: boolean }>;
  /** Remove delegation */
  undelegate: (signer: any) => Promise<{ blockHash: string; success: boolean }>;
}

/**
 * useGovernance - Democracy/Governance Hook
 *
 * Provides comprehensive governance functionality including proposals,
 * referenda, voting, and delegation.
 *
 * @param options - Hook options
 * @returns Governance data and operations
 *
 * @example
 * ```typescript
 * const {
 *   activeReferenda,
 *   publicProposals,
 *   vote,
 *   propose,
 *   getReferendum
 * } = useGovernance({ refreshInterval: 60000 });
 *
 * // Vote on referendum
 * await vote(0, true, '1000000000000', Conviction.Locked1x);
 *
 * // Get referendum details
 * const ref = await getReferendum(0);
 * console.log(`Status: ${ref.status}, Ayes: ${ref.ayes}`);
 * ```
 */
export function useGovernance(options: UseSubstrateOptions = {}): UseGovernanceReturn {
  const { sdk, isConnected } = useSelendraContext();
  const [activeReferenda, setActiveReferenda] = useState<ReferendumInfo[]>([]);
  const [publicProposals, setPublicProposals] = useState<ProposalInfo[]>([]);
  const [referendumCount, setReferendumCount] = useState<number | null>(null);
  const [minimumDeposit, setMinimumDeposit] = useState<string | null>(null);
  const [votingPeriod, setVotingPeriod] = useState<number | null>(null);
  const [enactmentPeriod, setEnactmentPeriod] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!sdk || !isConnected) return;

    try {
      setIsLoading(true);
      setError(null);

      const substrate = (sdk as any).substrate;
      if (!substrate?.democracy) {
        throw new Error('Democracy client not available');
      }

      const [count, proposals, minDeposit, votePeriod, enactPeriod] = await Promise.all([
        substrate.democracy.getReferendumCount().catch(() => null),
        substrate.democracy.getPublicProposals().catch(() => []),
        substrate.democracy.getMinimumDeposit().catch(() => null),
        substrate.democracy.getVotingPeriod().catch(() => null),
        substrate.democracy.getEnactmentPeriod().catch(() => null),
      ]);

      setReferendumCount(count);
      setPublicProposals(proposals);
      setMinimumDeposit(minDeposit);
      setVotingPeriod(votePeriod);
      setEnactmentPeriod(enactPeriod);

      // Fetch active referenda
      if (count !== null) {
        const referenda: ReferendumInfo[] = [];
        for (let i = 0; i < count; i++) {
          const ref = await substrate.democracy.getReferendum(i);
          if (ref.status === 'Ongoing') {
            referenda.push(ref);
          }
        }
        setActiveReferenda(referenda);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch governance data');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, isConnected]);

  useEffect(() => {
    if (options.autoRefresh !== false) {
      refresh();
    }
  }, [refresh, options.autoRefresh]);

  useEffect(() => {
    if (options.refreshInterval && isConnected) {
      const interval = setInterval(refresh, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, options.refreshInterval, isConnected]);

  const getReferendum = useCallback(
    async (index: number): Promise<ReferendumInfo> => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      return await substrate.democracy.getReferendum(index);
    },
    [sdk, isConnected],
  );

  const getVotingOf = useCallback(
    async (referendumIndex: number, account: string): Promise<VoteInfo | null> => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      return await substrate.democracy.getVotingOf(referendumIndex, account);
    },
    [sdk, isConnected],
  );

  const propose = useCallback(
    async (signer: any, proposalHash: string, value: string) => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      const result = await substrate.democracy.propose(signer, proposalHash, value);
      await refresh();
      return result;
    },
    [sdk, isConnected, refresh],
  );

  const second = useCallback(
    async (signer: any, proposalIndex: number) => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      const result = await substrate.democracy.second(signer, proposalIndex);
      await refresh();
      return result;
    },
    [sdk, isConnected, refresh],
  );

  const vote = useCallback(
    async (
      signer: any,
      referendumIndex: number,
      aye: boolean,
      balance: string,
      conviction: Conviction = Conviction.None,
    ) => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      const result = await substrate.democracy.vote(
        signer,
        referendumIndex,
        aye,
        balance,
        conviction,
      );
      await refresh();
      return result;
    },
    [sdk, isConnected, refresh],
  );

  const removeVote = useCallback(
    async (signer: any, referendumIndex: number) => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      const result = await substrate.democracy.removeVote(signer, referendumIndex);
      await refresh();
      return result;
    },
    [sdk, isConnected, refresh],
  );

  const delegate = useCallback(
    async (signer: any, target: string, conviction: Conviction, balance: string) => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      const result = await substrate.democracy.delegate(signer, target, conviction, balance);
      await refresh();
      return result;
    },
    [sdk, isConnected, refresh],
  );

  const undelegate = useCallback(
    async (signer: any) => {
      if (!sdk || !isConnected) throw new Error('Not connected');
      const substrate = (sdk as any).substrate;
      const result = await substrate.democracy.undelegate(signer);
      await refresh();
      return result;
    },
    [sdk, isConnected, refresh],
  );

  return {
    activeReferenda,
    publicProposals,
    referendumCount,
    minimumDeposit,
    votingPeriod,
    enactmentPeriod,
    isLoading,
    error,
    refresh,
    getReferendum,
    getVotingOf,
    propose,
    second,
    vote,
    removeVote,
    delegate,
    undelegate,
  };
}
