/**
 * Nomination Pools Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for Nomination Pools pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type {
  PoolState,
  BondExtraSource,
  CreatePoolParams,
  JoinPoolParams,
  UnbondParams,
  WithdrawUnbondedParams,
  PoolWithdrawUnbondedParams,
  SetMetadataParams,
  NominatePoolParams,
  SetStateParams,
  ChillPoolParams,
  UpdateRolesParams,
  SetCommissionParams,
  ClaimCommissionParams,
  BondedPoolInfo,
  PoolMemberInfo,
} from "./types.js";
import { NominationPoolsQueries } from "./queries.js";

/** Pool transaction result */
export interface PoolTxResult {
  success: boolean;
  blockHash: string;
  txHash: string;
  events: any[];
  poolId?: number;
}

/**
 * Nomination Pools Manager - handles Nomination Pools pallet extrinsics
 */
export class NominationPoolsManager {
  public queries: NominationPoolsQueries;

  constructor(private api: ApiPromise) {
    this.queries = new NominationPoolsQueries(api);
  }

  // ==========================================================================
  // Pool Creation & Membership
  // ==========================================================================

  /**
   * Create a new nomination pool
   * @param params - Create pool parameters
   * @returns Submittable extrinsic
   */
  create(
    params: CreatePoolParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.nominationPools.create(
      params.amount.toString(),
      params.root,
      params.nominator,
      params.bouncer
    );
  }

  /**
   * Join an existing pool
   * @param params - Join pool parameters
   * @returns Submittable extrinsic
   */
  join(
    params: JoinPoolParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.nominationPools.join(
      params.amount.toString(),
      params.poolId
    );
  }

  /**
   * Bond extra funds to the pool
   * @param extra - Extra bond source
   * @returns Submittable extrinsic
   */
  bondExtra(
    extra: BondExtraSource
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    if (extra.type === "Rewards") {
      return this.api.tx.nominationPools.bondExtra({ Rewards: null });
    }
    return this.api.tx.nominationPools.bondExtra({
      FreeBalance: extra.amount.toString(),
    });
  }

  /**
   * Claim pending rewards
   * @returns Submittable extrinsic
   */
  claimPayout(): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.nominationPools.claimPayout();
  }

  /**
   * Unbond from the pool
   * @param params - Unbond parameters
   * @returns Submittable extrinsic
   */
  unbond(
    params: UnbondParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.nominationPools.unbond(
      params.memberAccount,
      params.unbondingPoints.toString()
    );
  }

  /**
   * Withdraw unbonded funds
   * @param params - Withdraw parameters
   * @returns Submittable extrinsic
   */
  withdrawUnbonded(
    params: WithdrawUnbondedParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.nominationPools.withdrawUnbonded(
      params.memberAccount,
      params.numSlashingSpans
    );
  }

  /**
   * Withdraw unbonded funds for the pool
   * @param params - Pool withdraw parameters
   * @returns Submittable extrinsic
   */
  poolWithdrawUnbonded(
    params: PoolWithdrawUnbondedParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.nominationPools.poolWithdrawUnbonded(
      params.poolId,
      params.numSlashingSpans
    );
  }

  // ==========================================================================
  // Pool Management
  // ==========================================================================

  /**
   * Set pool metadata
   * @param params - Set metadata parameters
   * @returns Submittable extrinsic
   */
  setMetadata(
    params: SetMetadataParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.nominationPools.setMetadata(
      params.poolId,
      params.metadata
    );
  }

  /**
   * Nominate validators for the pool
   * @param params - Nominate parameters
   * @returns Submittable extrinsic
   */
  nominate(
    params: NominatePoolParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.nominationPools.nominate(
      params.poolId,
      params.validators
    );
  }

  /**
   * Set pool state
   * @param params - Set state parameters
   * @returns Submittable extrinsic
   */
  setState(
    params: SetStateParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.nominationPools.setState(params.poolId, params.state);
  }

  /**
   * Chill the pool (stop nominating)
   * @param params - Chill parameters
   * @returns Submittable extrinsic
   */
  chill(
    params: ChillPoolParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.nominationPools.chill(params.poolId);
  }

  /**
   * Update pool roles
   * @param params - Update roles parameters
   * @returns Submittable extrinsic
   */
  updateRoles(
    params: UpdateRolesParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    const newRoot = this.parseRoleUpdate(params.newRoot);
    const newNominator = this.parseRoleUpdate(params.newNominator);
    const newBouncer = this.parseRoleUpdate(params.newBouncer);

    return this.api.tx.nominationPools.updateRoles(
      params.poolId,
      newRoot,
      newNominator,
      newBouncer
    );
  }

  /**
   * Set pool commission
   * @param params - Set commission parameters
   * @returns Submittable extrinsic
   */
  setCommission(
    params: SetCommissionParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    const commission = params.newCommission
      ? [params.newCommission.commission, params.newCommission.payee]
      : null;

    return this.api.tx.nominationPools.setCommission(params.poolId, commission);
  }

  /**
   * Claim pool commission
   * @param params - Claim commission parameters
   * @returns Submittable extrinsic
   */
  claimCommission(
    params: ClaimCommissionParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.nominationPools.claimCommission(params.poolId);
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Create a pool and wait for confirmation
   * @param signer - Keyring pair
   * @param params - Create pool parameters
   * @returns Transaction result with pool ID
   */
  async createPool(
    signer: KeyringPair,
    params: CreatePoolParams
  ): Promise<PoolTxResult> {
    const extrinsic = this.create(params);
    const result = await this.signAndSend(extrinsic, signer);

    // Extract pool ID from events
    const poolCreatedEvent = result.events.find(
      (e: any) => e.section === "nominationPools" && e.method === "Created"
    );

    return {
      ...result,
      poolId: poolCreatedEvent
        ? parseInt(poolCreatedEvent.data[1]?.toString() || "0", 10)
        : undefined,
    };
  }

  /**
   * Join a pool and wait for confirmation
   * @param signer - Keyring pair
   * @param params - Join pool parameters
   * @returns Transaction result
   */
  async joinPool(
    signer: KeyringPair,
    params: JoinPoolParams
  ): Promise<PoolTxResult> {
    const extrinsic = this.join(params);
    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Bond extra and wait for confirmation
   * @param signer - Keyring pair
   * @param extra - Extra bond source
   * @returns Transaction result
   */
  async bondExtraAndWait(
    signer: KeyringPair,
    extra: BondExtraSource
  ): Promise<PoolTxResult> {
    const extrinsic = this.bondExtra(extra);
    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Claim rewards and wait for confirmation
   * @param signer - Keyring pair
   * @returns Transaction result
   */
  async claimRewards(signer: KeyringPair): Promise<PoolTxResult> {
    const extrinsic = this.claimPayout();
    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Unbond and wait for confirmation
   * @param signer - Keyring pair
   * @param params - Unbond parameters
   * @returns Transaction result
   */
  async unbondAndWait(
    signer: KeyringPair,
    params: UnbondParams
  ): Promise<PoolTxResult> {
    const extrinsic = this.unbond(params);
    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Withdraw unbonded and wait for confirmation
   * @param signer - Keyring pair
   * @param params - Withdraw parameters
   * @returns Transaction result
   */
  async withdrawUnbondedAndWait(
    signer: KeyringPair,
    params: WithdrawUnbondedParams
  ): Promise<PoolTxResult> {
    const extrinsic = this.withdrawUnbonded(params);
    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Get pool info
   * @param poolId - Pool ID
   * @returns Pool info
   */
  async getPoolInfo(poolId: number) {
    return this.queries.getPoolInfo(poolId);
  }

  /**
   * Get member info
   * @param account - Member account
   * @returns Member info
   */
  async getMemberInfo(account: string) {
    return this.queries.getMemberInfo(account);
  }

  /**
   * Get all pools
   */
  async getAllPools() {
    return this.queries.getAllPools();
  }

  /**
   * Get open pools
   */
  async getOpenPools() {
    return this.queries.getOpenPools();
  }

  /**
   * Get pending rewards for an account
   * @param account - Account
   * @returns Pending rewards
   */
  async getPendingRewards(account: string): Promise<bigint> {
    return this.queries.calculatePendingRewards(account);
  }

  /**
   * Get pool constants
   */
  async getConstants() {
    return this.queries.getConstants();
  }

  /**
   * Check if an account is a pool member
   * @param account - Account to check
   * @returns True if member
   */
  async isPoolMember(account: string): Promise<boolean> {
    const member = await this.queries.getPoolMember(account);
    return member !== null;
  }

  /**
   * Get the pool an account is in
   * @param account - Account
   * @returns Pool ID or null
   */
  async getAccountPool(account: string): Promise<number | null> {
    const member = await this.queries.getPoolMember(account);
    return member?.poolId || null;
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Parse role update value
   */
  private parseRoleUpdate(
    value?: string | "Remove" | "Noop"
  ): { Set: string } | { Remove: null } | { Noop: null } {
    if (!value || value === "Noop") {
      return { Noop: null };
    }
    if (value === "Remove") {
      return { Remove: null };
    }
    return { Set: value };
  }

  /**
   * Sign and send an extrinsic
   */
  private async signAndSend(
    extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>,
    signer: KeyringPair
  ): Promise<PoolTxResult> {
    return new Promise((resolve, reject) => {
      extrinsic
        .signAndSend(signer, (result: ISubmittableResult) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            const blockHash = result.status.isInBlock
              ? result.status.asInBlock.toString()
              : result.status.asFinalized.toString();

            const events = result.events.map((e: any) => e.event);

            // Check for errors
            const hasError = events.some((e: any) =>
              this.api.events.system.ExtrinsicFailed.is(e)
            );

            resolve({
              success: !hasError,
              blockHash,
              txHash: extrinsic.hash.toString(),
              events,
            });
          }

          if (result.status.isInvalid) {
            reject(new Error("Transaction invalid"));
          }
        })
        .catch(reject);
    });
  }
}
