/**
 * useGovernance Hook
 *
 * React hook for governance operations (Democracy, Council, Treasury).
 *
 * @example
 * ```tsx
 * import { useGovernance } from '@selendrajs/sdk-core/react';
 *
 * function GovernanceDashboard() {
 *   const { governance, loading, vote, propose } = useGovernance();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <h2>Active Referenda: {governance?.activeReferenda.length}</h2>
 *       <h2>Public Proposals: {governance?.publicProposals.length}</h2>
 *       <h2>Council Members: {governance?.councilMembers.length}</h2>
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
  ReferendumInfo,
  VotingInfo,
  Conviction,
} from "../pallets/democracy/types.js";
import type {
  Votes as CouncilVotes,
  CouncilProposal,
} from "../pallets/council/types.js";
import type { TreasuryProposal } from "../pallets/treasury/types.js";

/**
 * Governance state
 */
export interface GovernanceState {
  /** Active referenda */
  activeReferenda: Array<{ index: number; info: ReferendumInfo }>;
  /** Public proposals */
  publicProposals: Array<{ index: number; hash: string; depositors: string[] }>;
  /** Next external proposal */
  nextExternal: { hash: string; threshold: string } | null;
  /** Council members */
  councilMembers: string[];
  /** Council proposals */
  councilProposals: Array<{
    hash: string;
    proposal: CouncilProposal;
    votes: CouncilVotes | null;
  }>;
  /** Treasury proposals */
  treasuryProposals: Array<{ id: number; proposal: TreasuryProposal }>;
  /** Treasury balance */
  treasuryBalance: string;
  /** Launch period (blocks) */
  launchPeriod: number;
  /** Voting period (blocks) */
  votingPeriod: number;
  /** Enactment period (blocks) */
  enactmentPeriod: number;
  /** Minimum deposit for proposal */
  minimumDeposit: string;
  /** Token symbol */
  symbol: string;
  /** Token decimals */
  decimals: number;
}

/**
 * Result type for useGovernance hook
 */
export interface UseGovernanceResult {
  /** Governance state (null if loading or error) */
  governance: GovernanceState | null;
  /** Whether governance info is loading */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Refresh governance info */
  refresh: () => Promise<void>;
  /** Get voting info for an account */
  getVotingInfo: (address: string) => Promise<VotingInfo | null>;
  /** Submit a democracy proposal */
  propose: (
    proposalHash: string,
    value: string | bigint,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Second a democracy proposal */
  second: (
    proposalIndex: number,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Vote on a referendum */
  vote: (
    refIndex: number,
    aye: boolean,
    conviction: Conviction,
    balance: string | bigint,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Delegate voting power */
  delegate: (
    to: string,
    conviction: Conviction,
    balance: string | bigint,
    signer: Signer,
    signerAddress: string
  ) => Promise<string>;
  /** Remove delegation */
  undelegate: (signer: Signer, signerAddress: string) => Promise<string>;
  /** Propose treasury spend */
  proposeSpend: (
    value: string | bigint,
    beneficiary: string,
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
 * Hook for governance operations
 *
 * @param options - Hook options
 * @returns Governance state and operation functions
 *
 * @example
 * ```tsx
 * const { governance, vote, propose } = useGovernance();
 *
 * // Vote on a referendum
 * await vote(0, true, 'Locked1x', '1000000000', signer, address);
 *
 * // Propose treasury spend
 * await proposeSpend('1000000000', beneficiaryAddress, signer, address);
 * ```
 */
export function useGovernance(
  options: { autoFetch?: boolean } = {}
): UseGovernanceResult {
  const { autoFetch = true } = options;
  const { sdk, isConnected } = useSelendra();

  const [governance, setGovernance] = useState<GovernanceState | null>(null);
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

  // Fetch governance info
  const fetchGovernanceInfo = useCallback(async () => {
    if (!sdk || !isConnected) {
      setGovernance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const democracyQueries = sdk.pallets.democracy?.queries;
      const councilQueries = sdk.pallets.council?.queries;
      const treasuryQueries = sdk.pallets.treasury?.queries;

      if (!democracyQueries) {
        throw new Error("Democracy pallet not available");
      }

      const { decimals, symbol } = getChainInfo();

      // Fetch democracy info
      const [
        referendumCount,
        publicProps,
        nextExternal,
        councilMembers,
        councilProposals,
        treasuryProposals,
        treasuryBalance,
        constants,
      ] = await Promise.all([
        democracyQueries.referendumCount().catch(() => 0),
        democracyQueries.publicProps().catch(() => []),
        democracyQueries.nextExternal().catch(() => null),
        councilQueries?.members().catch(() => []) ?? Promise.resolve([]),
        councilQueries?.proposals().catch(() => []) ?? Promise.resolve([]),
        treasuryQueries?.getAllProposals().catch(() => []) ??
          Promise.resolve([]),
        treasuryQueries?.getPot().catch(() => "0") ?? Promise.resolve("0"),
        democracyQueries.getConstants().catch(() => null),
      ]);

      // Fetch active referenda
      const activeReferenda: Array<{ index: number; info: ReferendumInfo }> =
        [];
      for (let i = 0; i < referendumCount; i++) {
        try {
          const info = await democracyQueries.referendumInfoOf(i);
          if (info && "Ongoing" in (info as Record<string, unknown>)) {
            activeReferenda.push({ index: i, info });
          }
        } catch {
          // Skip failed queries
        }
      }

      // Fetch council proposal details
      const councilProposalDetails: Array<{
        hash: string;
        proposal: CouncilProposal;
        votes: CouncilVotes | null;
      }> = [];

      if (councilQueries) {
        for (const hash of councilProposals) {
          try {
            const [proposal, votes] = await Promise.all([
              councilQueries.proposalOf(hash),
              councilQueries.voting(hash),
            ]);
            if (proposal) {
              councilProposalDetails.push({
                hash: hash as string,
                proposal,
                votes: votes ?? null,
              });
            }
          } catch {
            // Skip failed queries
          }
        }
      }

      setGovernance({
        activeReferenda,
        publicProposals: publicProps.map((p: unknown, i: number) => ({
          index: i,
          hash: (p as { hash?: string })?.hash ?? "",
          depositors: (p as { depositors?: string[] })?.depositors ?? [],
        })),
        nextExternal: nextExternal
          ? {
              hash: (nextExternal as { hash?: string })?.hash ?? "",
              threshold: String(nextExternal),
            }
          : null,
        councilMembers,
        councilProposals: councilProposalDetails,
        treasuryProposals,
        treasuryBalance: formatBalance(treasuryBalance, decimals),
        launchPeriod: constants?.launchPeriod ?? 0,
        votingPeriod: constants?.votingPeriod ?? 0,
        enactmentPeriod: constants?.enactmentPeriod ?? 0,
        minimumDeposit: formatBalance(constants?.minimumDeposit, decimals),
        symbol,
        decimals,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setGovernance(null);
    } finally {
      setLoading(false);
    }
  }, [sdk, isConnected, getChainInfo]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchGovernanceInfo();
  }, [fetchGovernanceInfo]);

  // Get voting info for an account
  const getVotingInfo = useCallback(
    async (address: string): Promise<VotingInfo | null> => {
      if (!sdk) return null;

      const democracyQueries = sdk.pallets.democracy?.queries;
      if (!democracyQueries) return null;

      try {
        return await democracyQueries.votingOf(address);
      } catch {
        return null;
      }
    },
    [sdk]
  );

  // Propose
  const propose = useCallback(
    async (
      proposalHash: string,
      value: string | bigint,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const democracyManager = sdk.pallets.democracy?.manager;
      if (!democracyManager) throw new Error("Democracy pallet not available");

      const result = await democracyManager.propose(signer, signerAddress, {
        proposalHash,
        value: typeof value === "bigint" ? value.toString() : value,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Second
  const second = useCallback(
    async (
      proposalIndex: number,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const democracyManager = sdk.pallets.democracy?.manager;
      if (!democracyManager) throw new Error("Democracy pallet not available");

      const result = await democracyManager.second(signer, signerAddress, {
        proposal: proposalIndex,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Vote
  const vote = useCallback(
    async (
      refIndex: number,
      aye: boolean,
      conviction: Conviction,
      balance: string | bigint,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const democracyManager = sdk.pallets.democracy?.manager;
      if (!democracyManager) throw new Error("Democracy pallet not available");

      const result = await democracyManager.vote(signer, signerAddress, {
        refIndex,
        vote: {
          Standard: {
            vote: { aye, conviction },
            balance: typeof balance === "bigint" ? balance.toString() : balance,
          },
        },
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Delegate
  const delegate = useCallback(
    async (
      to: string,
      conviction: Conviction,
      balance: string | bigint,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const democracyManager = sdk.pallets.democracy?.manager;
      if (!democracyManager) throw new Error("Democracy pallet not available");

      const result = await democracyManager.delegate(signer, signerAddress, {
        to,
        conviction,
        balance: typeof balance === "bigint" ? balance.toString() : balance,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Undelegate
  const undelegate = useCallback(
    async (signer: Signer, signerAddress: string): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const democracyManager = sdk.pallets.democracy?.manager;
      if (!democracyManager) throw new Error("Democracy pallet not available");

      const result = await democracyManager.undelegate(signer, signerAddress);

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Propose spend
  const proposeSpend = useCallback(
    async (
      value: string | bigint,
      beneficiary: string,
      signer: Signer,
      signerAddress: string
    ): Promise<string> => {
      if (!sdk) throw new Error("SDK not connected");

      const treasuryManager = sdk.pallets.treasury?.manager;
      if (!treasuryManager) throw new Error("Treasury pallet not available");

      const result = await treasuryManager.proposeSpend(signer, signerAddress, {
        value: typeof value === "bigint" ? value.toString() : value,
        beneficiary,
      });

      await refresh();
      return result.txHash;
    },
    [sdk, refresh]
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && isConnected) {
      fetchGovernanceInfo();
    }
  }, [autoFetch, isConnected, fetchGovernanceInfo]);

  return {
    governance,
    loading,
    error,
    refresh,
    getVotingInfo,
    propose,
    second,
    vote,
    delegate,
    undelegate,
    proposeSpend,
  };
}
