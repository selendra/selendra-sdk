/**
 * Staking Pallet Storage Queries
 * 
 * Query functions for Staking pallet storage
 */

import type { ApiPromise } from '@polkadot/api';
import {
  StakingLedger,
  ValidatorPrefs,
  Nominations,
  ActiveEraInfo,
  EraRewardPoints,
  Exposure,
  SlashingSpans,
  RewardDestination,
} from './types.js';

/**
 * Staking storage queries
 */
export class StakingQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get bonded controller for a stash account
   * @param stash - Stash account address
   * @returns Controller account address or null
   */
  async bonded(stash: string): Promise<string | null> {
    const result: any = await this.api.query.staking.bonded(stash);
    if (result.isNone) return null;
    return result.unwrap().toString();
  }

  /**
   * Get staking ledger for a controller account
   * @param controller - Controller account address
   * @returns Staking ledger or null
   */
  async ledger(controller: string): Promise<StakingLedger | null> {
    const result: any = await this.api.query.staking.ledger(controller);
    if (result.isNone) return null;

    const ledger = result.unwrap() as any;
    return {
      stash: ledger.stash.toString(),
      total: BigInt(ledger.total.toString()),
      active: BigInt(ledger.active.toString()),
      unlocking: ledger.unlocking.map((chunk: any) => ({
        value: BigInt(chunk.value.toString()),
        era: chunk.era.toNumber(),
      })),
      claimedRewards: ledger.claimedRewards.map((era: any) => era.toNumber()),
    };
  }

  /**
   * Get validator preferences
   * @param stash - Validator stash account
   * @returns Validator preferences or null
   */
  async validators(stash: string): Promise<ValidatorPrefs | null> {
    const result = await this.api.query.staking.validators(stash);
    const prefs = result as any;
    
    if (!prefs || prefs.isEmpty) return null;

    return {
      commission: BigInt(prefs.commission.toString()),
      blocked: prefs.blocked.isTrue,
    };
  }

  /**
   * Get nominator nominations
   * @param stash - Nominator stash account
   * @returns Nominations or null
   */
  async nominators(stash: string): Promise<Nominations | null> {
    const result: any = await this.api.query.staking.nominators(stash);
    if (result.isNone) return null;

    const nominations = result.unwrap() as any;
    return {
      targets: nominations.targets.map((t: any) => t.toString()),
      submittedIn: nominations.submittedIn.toNumber(),
      suppressed: nominations.suppressed.isTrue,
    };
  }

  /**
   * Get current active era
   * @returns Active era information or null
   */
  async activeEra(): Promise<ActiveEraInfo | null> {
    const result: any = await this.api.query.staking.activeEra();
    if (result.isNone) return null;

    const activeEra = result.unwrap() as any;
    return {
      index: activeEra.index.toNumber(),
      start: activeEra.start.isSome ? BigInt(activeEra.start.unwrap().toString()) : null,
    };
  }

  /**
   * Get current era index
   * @returns Current era index or null
   */
  async currentEra(): Promise<number | null> {
    const result: any = await this.api.query.staking.currentEra();
    if (result.isNone) return null;
    return result.unwrap().toNumber();
  }

  /**
   * Get era reward points
   * @param era - Era index
   * @returns Era reward points
   */
  async erasRewardPoints(era: number): Promise<EraRewardPoints> {
    const result = await this.api.query.staking.erasRewardPoints(era);
    const points = result as any;

    const individual = new Map<string, bigint>();
    points.individual.forEach((value: any, key: any) => {
      individual.set(key.toString(), BigInt(value.toString()));
    });

    return {
      total: BigInt(points.total.toString()),
      individual,
    };
  }

  /**
   * Get validator exposure for an era
   * @param era - Era index
   * @param stash - Validator stash account
   * @returns Exposure information
   */
  async erasStakers(era: number, stash: string): Promise<Exposure> {
    const result = await this.api.query.staking.erasStakers(era, stash);
    const exposure = result as any;

    return {
      total: BigInt(exposure.total.toString()),
      own: BigInt(exposure.own.toString()),
      others: exposure.others.map((other: any) => ({
        who: other.who.toString(),
        value: BigInt(other.value.toString()),
      })),
    };
  }

  /**
   * Get validator preferences for an era
   * @param era - Era index
   * @param stash - Validator stash account
   * @returns Validator preferences
   */
  async erasValidatorPrefs(era: number, stash: string): Promise<ValidatorPrefs> {
    const result = await this.api.query.staking.erasValidatorPrefs(era, stash);
    const prefs = result as any;

    return {
      commission: BigInt(prefs.commission.toString()),
      blocked: prefs.blocked.isTrue,
    };
  }

  /**
   * Get validator reward for an era
   * @param era - Era index
   * @returns Validator reward amount or null
   */
  async erasValidatorReward(era: number): Promise<bigint | null> {
    const result: any = await this.api.query.staking.erasValidatorReward(era);
    if (result.isNone) return null;
    return BigInt(result.unwrap().toString());
  }

  /**
   * Get slashing spans for an account
   * @param stash - Stash account
   * @returns Slashing spans or null
   */
  async slashingSpans(stash: string): Promise<SlashingSpans | null> {
    const result: any = await this.api.query.staking.slashingSpans(stash);
    if (result.isNone) return null;

    const spans = result.unwrap() as any;
    return {
      spanIndex: spans.spanIndex.toNumber(),
      lastStart: spans.lastStart.toNumber(),
      lastNonzeroSlash: spans.lastNonzeroSlash.toNumber(),
      prior: spans.prior.map((era: any) => era.toNumber()),
    };
  }

  /**
   * Get reward destination (payee) for a stash account
   * @param stash - Stash account
   * @returns Reward destination
   */
  async payee(stash: string): Promise<RewardDestination | string> {
    const result = await this.api.query.staking.payee(stash);
    const payee = result as any;

    if (payee.isStaked) return RewardDestination.Staked;
    if (payee.isStash) return RewardDestination.Stash;
    if (payee.isController) return RewardDestination.Controller;
    if (payee.isNone) return RewardDestination.None;
    if (payee.isAccount) return payee.asAccount.toString();

    return RewardDestination.Staked; // default
  }

  /**
   * Get minimum nominator bond
   * @returns Minimum bond amount
   */
  async minNominatorBond(): Promise<bigint> {
    const result = await this.api.query.staking.minNominatorBond();
    return BigInt(result.toString());
  }

  /**
   * Get minimum validator bond
   * @returns Minimum bond amount
   */
  async minValidatorBond(): Promise<bigint> {
    const result = await this.api.query.staking.minValidatorBond();
    return BigInt(result.toString());
  }

  /**
   * Get bonding duration (in eras)
   * @returns Bonding duration
   */
  async bondingDuration(): Promise<number> {
    const result: any = await this.api.consts.staking.bondingDuration;
    return result.toNumber();
  }

  /**
   * Get maximum nominator count
   * @returns Max nominators or null
   */
  async maxNominatorsCount(): Promise<number | null> {
    const result: any = await this.api.query.staking.maxNominatorsCount();
    if (result.isNone) return null;
    return result.unwrap().toNumber();
  }

  /**
   * Get maximum validator count
   * @returns Max validators or null
   */
  async maxValidatorsCount(): Promise<number | null> {
    const result: any = await this.api.query.staking.maxValidatorsCount();
    if (result.isNone) return null;
    return result.unwrap().toNumber();
  }

  /**
   * Get history depth (how many eras are kept)
   * @returns History depth
   */
  async historyDepth(): Promise<number> {
    const result: any = await this.api.consts.staking.historyDepth;
    return result.toNumber();
  }
}
