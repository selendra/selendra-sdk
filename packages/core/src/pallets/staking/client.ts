/**
 * Staking Pallet Client
 * 
 * Main client for interacting with the Staking pallet
 */

import type { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { ISubmittableResult } from '@polkadot/types/types';
import { StakingQueries } from './queries.js';
import {
  BondParams,
  BondExtraParams,
  UnbondParams,
  WithdrawUnbondedParams,
  NominateParams,
  ValidateParams,
  SetPayeeParams,
  SetControllerParams,
  PayoutStakersParams,
  RebondParams,
  ChillOtherParams,
  ForceUnstakeParams,
  StakingInfo,
  RewardDestination,
  PendingRewards,
  EraRewards,
} from './types';

/**
 * Staking Manager - Main interface for Staking pallet
 */
export class StakingManager {
  public queries: StakingQueries;

  constructor(private api: ApiPromise) {
    this.queries = new StakingQueries(api);
  }

  // ============================================================================
  // Extrinsics (Transactions)
  // ============================================================================

  /**
   * Bond funds for staking
   * @param params - Bond parameters
   * @returns Submittable extrinsic
   */
  bond(params: BondParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    // In newer Polkadot SDK, controller is deprecated and should be same as stash
    // The API handles this automatically
    return this.api.tx.staking.bond(params.value, params.payee);
  }

  /**
   * Bond additional funds
   * @param params - Bond extra parameters
   * @returns Submittable extrinsic
   */
  bondExtra(params: BondExtraParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.staking.bondExtra(params.maxAdditional);
  }

  /**
   * Schedule unbonding of funds
   * @param params - Unbond parameters
   * @returns Submittable extrinsic
   */
  unbond(params: UnbondParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.staking.unbond(params.value);
  }

  /**
   * Withdraw unbonded funds
   * @param params - Withdraw parameters
   * @returns Submittable extrinsic
   */
  withdrawUnbonded(params: WithdrawUnbondedParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.staking.withdrawUnbonded(params.numSlashingSpans);
  }

  /**
   * Nominate validators
   * @param params - Nominate parameters
   * @returns Submittable extrinsic
   */
  nominate(params: NominateParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.staking.nominate(params.targets);
  }

  /**
   * Declare intent to validate
   * @param params - Validate parameters
   * @returns Submittable extrinsic
   */
  validate(params: ValidateParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.staking.validate(params.prefs);
  }

  /**
   * Stop nominating or validating
   * @returns Submittable extrinsic
   */
  chill(): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.staking.chill();
  }

  /**
   * Set reward destination
   * @param params - Set payee parameters
   * @returns Submittable extrinsic
   */
  setPayee(params: SetPayeeParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.staking.setPayee(params.payee);
  }

  /**
   * Set controller account (deprecated in newer versions)
   * @param params - Set controller parameters
   * @returns Submittable extrinsic
   */
  setController(params: SetControllerParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.staking.setController(params.controller);
  }

  /**
   * Payout staking rewards for a validator
   * @param params - Payout parameters
   * @returns Submittable extrinsic
   */
  payoutStakers(params: PayoutStakersParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.staking.payoutStakers(params.validatorStash, params.era);
  }

  /**
   * Rebond unbonding funds
   * @param params - Rebond parameters
   * @returns Submittable extrinsic
   */
  rebond(params: RebondParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.staking.rebond(params.value);
  }

  /**
   * Force another account to chill (sudo/governance)
   * @param params - Chill other parameters
   * @returns Submittable extrinsic
   */
  chillOther(params: ChillOtherParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.staking.chillOther(params.controller);
  }

  /**
   * Force unstake an account (sudo only)
   * @param params - Force unstake parameters
   * @returns Submittable extrinsic
   */
  forceUnstake(params: ForceUnstakeParams): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.staking.forceUnstake(params.stash, params.numSlashingSpans);
  }

  /**
   * Force a new era (sudo only)
   * @returns Submittable extrinsic
   */
  forceNewEra(): SubmittableExtrinsic<'promise', ISubmittableResult> {
    return this.api.tx.staking.forceNewEra();
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Get complete staking information for an account
   * @param address - Account address (stash or controller)
   * @returns Complete staking info
   */
  async getStakingInfo(address: string): Promise<StakingInfo> {
    // Try as stash first
    let controller = await this.queries.bonded(address);
    let isStash = controller !== null;
    let stash = address;

    // If not a stash, try as controller
    if (!isStash) {
      const ledger = await this.queries.ledger(address);
      if (ledger) {
        stash = ledger.stash;
        controller = address;
        isStash = false;
      }
    }

    // Get ledger
    const ledger = controller ? await this.queries.ledger(controller) : null;

    // Get validator prefs
    const validatorPrefs = await this.queries.validators(stash);

    // Get nominations
    const nominations = await this.queries.nominators(stash);

    // Get payee
    const payee = await this.queries.payee(stash);

    return {
      controller: controller || undefined,
      ledger,
      validatorPrefs,
      nominations,
      payee,
      isBonded: ledger !== null,
      isValidating: validatorPrefs !== null,
      isNominating: nominations !== null,
    };
  }

  /**
   * Calculate pending rewards for an account
   * @param stash - Stash account address
   * @returns Pending rewards
   */
  async getPendingRewards(stash: string): Promise<PendingRewards> {
    const currentEra = await this.queries.currentEra();
    if (currentEra === null) {
      return { total: BigInt(0), eras: [] };
    }

    const ledger = await this.queries.ledger(stash);
    if (!ledger) {
      return { total: BigInt(0), eras: [] };
    }

    const claimedRewards = new Set(ledger.claimedRewards);
    const historyDepth = await this.queries.historyDepth();
    const oldestEra = Math.max(0, currentEra - historyDepth);

    const eras: EraRewards[] = [];
    let total = BigInt(0);

    // Check each era for unclaimed rewards
    for (let era = oldestEra; era < currentEra; era++) {
      if (claimedRewards.has(era)) continue;

      // Get exposure for this era
      const exposure = await this.queries.erasStakers(era, stash);
      if (!exposure || exposure.total === BigInt(0)) continue;

      // Get era reward
      const eraReward = await this.queries.erasValidatorReward(era);
      if (!eraReward) continue;

      // Get reward points
      const rewardPoints = await this.queries.erasRewardPoints(era);
      const validatorPoints = rewardPoints.individual.get(stash) || BigInt(0);
      
      if (validatorPoints === BigInt(0)) continue;

      // Calculate validator's share of rewards
      const validatorReward = (eraReward * validatorPoints) / rewardPoints.total;

      eras.push({ era, amount: validatorReward });
      total += validatorReward;
    }

    return { total, eras };
  }

  /**
   * Check if account is nominating
   * @param address - Account address
   * @returns True if nominating
   */
  async isNominating(address: string): Promise<boolean> {
    const nominations = await this.queries.nominators(address);
    return nominations !== null && !nominations.suppressed;
  }

  /**
   * Check if account is validating
   * @param address - Account address
   * @returns True if validating
   */
  async isValidating(address: string): Promise<boolean> {
    const prefs = await this.queries.validators(address);
    return prefs !== null;
  }

  /**
   * Check if account has bonded funds
   * @param address - Account address
   * @returns True if bonded
   */
  async isBonded(address: string): Promise<boolean> {
    const controller = await this.queries.bonded(address);
    if (controller) return true;

    const ledger = await this.queries.ledger(address);
    return ledger !== null;
  }

  /**
   * Get total bonded amount
   * @param address - Account address
   * @returns Total bonded amount
   */
  async getTotalBonded(address: string): Promise<bigint> {
    const info = await this.getStakingInfo(address);
    return info.ledger?.total || BigInt(0);
  }

  /**
   * Get active bonded amount
   * @param address - Account address
   * @returns Active bonded amount
   */
  async getActiveBonded(address: string): Promise<bigint> {
    const info = await this.getStakingInfo(address);
    return info.ledger?.active || BigInt(0);
  }

  /**
   * Get unbonding amount
   * @param address - Account address
   * @returns Total unbonding amount
   */
  async getUnbonding(address: string): Promise<bigint> {
    const info = await this.getStakingInfo(address);
    if (!info.ledger) return BigInt(0);

    return info.ledger.unlocking.reduce((sum, chunk) => sum + chunk.value, BigInt(0));
  }

  /**
   * Get eras until unbonding completes
   * @param address - Account address
   * @returns Number of eras until next unlock
   */
  async getErasUntilUnbonding(address: string): Promise<number | null> {
    const info = await this.getStakingInfo(address);
    if (!info.ledger || info.ledger.unlocking.length === 0) return null;

    const currentEra = await this.queries.currentEra();
    if (currentEra === null) return null;

    // Find earliest unlock era
    const earliestUnlock = Math.min(...info.ledger.unlocking.map(chunk => chunk.era));
    return Math.max(0, earliestUnlock - currentEra);
  }

  /**
   * Estimate bonding transaction fee
   * @param value - Amount to bond
   * @param payee - Reward destination
   * @param fromAddress - Sender address
   * @returns Estimated fee
   */
  async estimateBondFee(
    value: bigint,
    payee: RewardDestination | { Account: string },
    fromAddress: string
  ): Promise<bigint> {
    const tx = this.bond({ controller: fromAddress, value, payee });
    const info = await tx.paymentInfo(fromAddress);
    return BigInt(info.partialFee.toString());
  }

  /**
   * Estimate nominate transaction fee
   * @param targets - Validators to nominate
   * @param fromAddress - Sender address
   * @returns Estimated fee
   */
  async estimateNominateFee(targets: string[], fromAddress: string): Promise<bigint> {
    const tx = this.nominate({ targets });
    const info = await tx.paymentInfo(fromAddress);
    return BigInt(info.partialFee.toString());
  }

  // ============================================================================
  // Event Listeners
  // ============================================================================

  /**
   * Subscribe to Bonded events
   * @param callback - Event callback
   * @returns Unsubscribe function
   */
  async onBonded(callback: (event: { stash: string; amount: bigint }) => void): Promise<() => void> {
    const unsub: any = await this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (event.section === 'staking' && event.method === 'Bonded') {
          const [stash, amount] = event.data as any;
          callback({
            stash: stash.toString(),
            amount: BigInt(amount.toString()),
          });
        }
      });
    });
    return unsub;
  }

  /**
   * Subscribe to Unbonded events
   * @param callback - Event callback
   * @returns Unsubscribe function
   */
  async onUnbonded(callback: (event: { stash: string; amount: bigint }) => void): Promise<() => void> {
    const unsub: any = await this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (event.section === 'staking' && event.method === 'Unbonded') {
          const [stash, amount] = event.data as any;
          callback({
            stash: stash.toString(),
            amount: BigInt(amount.toString()),
          });
        }
      });
    });
    return unsub;
  }

  /**
   * Subscribe to Rewarded events
   * @param callback - Event callback
   * @returns Unsubscribe function
   */
  async onRewarded(callback: (event: { stash: string; amount: bigint }) => void): Promise<() => void> {
    const unsub: any = await this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (event.section === 'staking' && event.method === 'Rewarded') {
          const [stash, amount] = event.data as any;
          callback({
            stash: stash.toString(),
            amount: BigInt(amount.toString()),
          });
        }
      });
    });
    return unsub;
  }

  /**
   * Subscribe to Slashed events
   * @param callback - Event callback
   * @returns Unsubscribe function
   */
  async onSlashed(callback: (event: { validator: string; amount: bigint }) => void): Promise<() => void> {
    const unsub: any = await this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (event.section === 'staking' && event.method === 'Slashed') {
          const [validator, amount] = event.data as any;
          callback({
            validator: validator.toString(),
            amount: BigInt(amount.toString()),
          });
        }
      });
    });
    return unsub;
  }
}
