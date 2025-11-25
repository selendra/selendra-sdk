/**
 * Treasury Pallet Storage Queries
 *
 * Query functions for the Treasury pallet storage
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  TreasuryProposal,
  SpendStatus,
  TreasuryConstants,
} from "./types.js";

/**
 * Helper to safely convert codec to number
 */
function codecToNumber(codec: any): number {
  if (codec?.toNumber) return codec.toNumber();
  if (codec?.toString) return Number(codec.toString());
  return 0;
}

/**
 * Helper to safely convert codec to bigint
 */
function codecToBigInt(codec: any): bigint {
  if (codec?.toBigInt) return codec.toBigInt();
  if (codec?.toString) return BigInt(codec.toString());
  return 0n;
}

/**
 * Treasury storage queries
 */
export class TreasuryQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get proposal count
   * @returns Number of proposals
   */
  async proposalCount(): Promise<number> {
    const count = await this.api.query.treasury.proposalCount();
    return codecToNumber(count);
  }

  /**
   * Get proposal by index
   * @param index - Proposal index
   * @returns Proposal or null
   */
  async proposals(index: number): Promise<TreasuryProposal | null> {
    const proposal: any = await this.api.query.treasury.proposals(index);

    if (proposal.isNone) {
      return null;
    }

    const p = proposal.unwrap();
    return {
      index,
      proposer: p.proposer.toString(),
      value: codecToBigInt(p.value),
      beneficiary: p.beneficiary.toString(),
      bond: codecToBigInt(p.bond),
    };
  }

  /**
   * Get all proposals
   * @returns Array of proposals
   */
  async getAllProposals(): Promise<TreasuryProposal[]> {
    const count = await this.proposalCount();
    const proposals: TreasuryProposal[] = [];

    for (let i = 0; i < count; i++) {
      const proposal = await this.proposals(i);
      if (proposal) {
        proposals.push(proposal);
      }
    }

    return proposals;
  }

  /**
   * Get approved proposal indices
   * @returns Array of approved proposal indices
   */
  async approvals(): Promise<number[]> {
    const approvals: any = await this.api.query.treasury.approvals();
    return approvals.map((a: any) => codecToNumber(a));
  }

  /**
   * Get deactivated funds
   * @returns Deactivated amount
   */
  async deactivated(): Promise<bigint> {
    const deactivated = await this.api.query.treasury.deactivated();
    return codecToBigInt(deactivated);
  }

  /**
   * Get spend count
   * @returns Number of spends
   */
  async spendCount(): Promise<number> {
    if (!this.api.query.treasury.spendCount) {
      return 0;
    }
    const count = await this.api.query.treasury.spendCount();
    return codecToNumber(count);
  }

  /**
   * Get spend status by index
   * @param index - Spend index
   * @returns Spend status or null
   */
  async spends(index: number): Promise<SpendStatus | null> {
    if (!this.api.query.treasury.spends) {
      return null;
    }

    const spend: any = await this.api.query.treasury.spends(index);

    if (spend.isNone) {
      return null;
    }

    const s = spend.unwrap();
    return {
      assetKind: s.assetKind?.toJSON(),
      amount: codecToBigInt(s.amount),
      beneficiary: s.beneficiary.toString(),
      validFrom: codecToNumber(s.validFrom),
      expireAt: codecToNumber(s.expireAt),
      status: s.status?.isPending
        ? "Pending"
        : s.status?.isAttempted
        ? "Attempted"
        : "Failed",
    };
  }

  /**
   * Get treasury account balance (the pot)
   * @returns Treasury balance
   */
  async getPot(): Promise<bigint> {
    // Treasury account is derived from PalletId
    const palletId = this.api.consts.treasury.palletId;
    const treasuryAccount = this.api.registry.createType("AccountId", palletId);

    const accountData: any = await this.api.query.system.account(
      treasuryAccount
    );
    return codecToBigInt(accountData.data.free);
  }

  /**
   * Get treasury constants
   * @returns Treasury constants
   */
  getConstants(): TreasuryConstants {
    const consts = this.api.consts.treasury;

    return {
      proposalBond: codecToNumber(consts.proposalBond) / 1_000_000, // Permill to decimal
      proposalBondMinimum: codecToBigInt(consts.proposalBondMinimum),
      proposalBondMaximum: consts.proposalBondMaximum?.isSome
        ? codecToBigInt(consts.proposalBondMaximum.unwrap())
        : null,
      spendPeriod: codecToNumber(consts.spendPeriod),
      burn: codecToNumber(consts.burn) / 1_000_000, // Permill to decimal
      palletId: consts.palletId.toString(),
      maxApprovals: codecToNumber(consts.maxApprovals),
      payoutPeriod: consts.payoutPeriod
        ? codecToNumber(consts.payoutPeriod)
        : 0,
    };
  }
}
