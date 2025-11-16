/**
 * Substrate Staking API for the Selendra SDK
 * Provides comprehensive staking operations including bonding, nominating, and reward management
 */

import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult, Codec } from '@polkadot/types/types';
import { BN } from '@polkadot/util';
import type { SubstrateAddress, Balance } from '../types/common';

/**
 * Helper to check if Codec is an Option and is None
 */
function isOptionNone(codec: Codec): boolean {
  return 'isNone' in codec && (codec as any).isNone === true;
}

/**
 * Helper to unwrap an Option Codec
 */
function unwrapOption<T = any>(codec: Codec): T {
  if ('unwrap' in codec) {
    return (codec as any).unwrap() as T;
  }
  return codec as any;
}

/**
 * Helper to check if Codec is an Option and is Some
 */
function isOptionSome(codec: Codec): boolean {
  return 'isSome' in codec && (codec as any).isSome === true;
}

/**
 * Helper to convert Codec to number
 */
function codecToNumber(codec: Codec): number {
  if ('toNumber' in codec) {
    return (codec as any).toNumber();
  }
  return Number(codec.toString());
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  /** Keyring pair to sign with */
  signer?: KeyringPair;
  /** Wait for transaction to be included in block */
  waitForInclusion?: boolean;
  /** Wait for transaction finalization */
  waitForFinalization?: boolean;
  /** Nonce override */
  nonce?: number;
}

/**
 * Staking transaction result
 */
export interface StakingTransactionResult {
  /** Transaction hash */
  hash: string;
  /** Block hash (if waitForInclusion or waitForFinalization) */
  blockHash?: string;
  /** Block number (if available) */
  blockNumber?: number;
  /** Transaction events */
  events?: any[];
}

/**
 * Account staking information
 */
export interface AccountStakingInfo {
  totalStake: Balance;
  activeStake: Balance;
  ownStake: Balance;
  nominators: NominatorInfo[];
  validatorPrefs: ValidatorPreferences;
  rewardDestination: RewardDestination;
  era: number;
  sessionIndex: number;
}

/**
 * Nominator information
 */
export interface NominatorInfo {
  address: SubstrateAddress;
  stake: Balance;
}

/**
 * Validator preferences
 */
export interface ValidatorPreferences {
  commission: number; // Perbill (0-1000000000)
  blocked: boolean;
}

/**
 * Reward destination options
 */
export enum RewardDestination {
  Staked = 'Staked',
  Stash = 'Stash',
  Controller = 'Controller',
  Account = 'Account',
  None = 'None',
}

/**
 * Era reward points
 */
export interface EraRewardPoints {
  total: number;
  individual: Map<SubstrateAddress, number>;
}

/**
 * Staking ledger information
 */
export interface StakingLedger {
  stash: SubstrateAddress;
  total: Balance;
  active: Balance;
  unlocking: UnlockChunk[];
  claimedRewards: number[];
}

/**
 * Unlock chunk
 */
export interface UnlockChunk {
  value: Balance;
  era: number;
}

/**
 * Staking client for Substrate operations
 */
export class StakingClient {
  private api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  /**
   * Sign and send a transaction
   * @private
   */
  private async signAndSend(
    tx: SubmittableExtrinsic<'promise', ISubmittableResult>,
    options: TransactionOptions = {},
  ): Promise<StakingTransactionResult> {
    const { signer, waitForInclusion, waitForFinalization, nonce } = options;

    if (!signer) {
      // Just send without signing (requires pre-signed transaction)
      const hash = await tx.send();
      return { hash: hash.toHex() };
    }

    return new Promise((resolve, reject) => {
      let unsub: () => void;

      tx.signAndSend(
        signer,
        { nonce: nonce !== undefined ? nonce : -1 },
        (result: ISubmittableResult) => {
          const { status, events } = result;

          if (status.isInBlock && waitForInclusion) {
            if (unsub) unsub();
            resolve({
              hash: tx.hash.toHex(),
              blockHash: status.asInBlock.toHex(),
              events: events.map((e) => e.toHuman()),
            });
          } else if (status.isFinalized && (waitForFinalization || !waitForInclusion)) {
            if (unsub) unsub();
            resolve({
              hash: tx.hash.toHex(),
              blockHash: status.asFinalized.toHex(),
              events: events.map((e) => e.toHuman()),
            });
          } else if (status.isInvalid || status.isDropped || status.isUsurped) {
            if (unsub) unsub();
            reject(new Error(`Transaction failed: ${status.type}`));
          }

          // If not waiting, resolve immediately after broadcast
          if (!waitForInclusion && !waitForFinalization && status.isReady) {
            if (unsub) unsub();
            resolve({ hash: tx.hash.toHex() });
          }
        },
      )
        .then((unsubFn) => {
          unsub = unsubFn;
        })
        .catch(reject);
    });
  }

  /**
   * Bond tokens for staking
   * @param controller - Controller account address
   * @param value - Amount to bond
   * @param payee - Where to send rewards
   * @param options - Transaction options
   * @returns Transaction result
   */
  async bond(
    controller: SubstrateAddress,
    value: string | number | BN,
    payee: RewardDestination,
    options: TransactionOptions = {},
  ): Promise<StakingTransactionResult> {
    const tx = this.api.tx.staking.bond(controller, value, payee);
    return this.signAndSend(tx, options);
  }

  /**
   * Add extra tokens to existing stake
   * @param value - Amount to bond
   * @param options - Transaction options
   * @returns Transaction result
   */
  async bondExtra(
    value: string | number | BN,
    options: TransactionOptions = {},
  ): Promise<StakingTransactionResult> {
    const tx = this.api.tx.staking.bondExtra(value);
    return this.signAndSend(tx, options);
  }

  /**
   * Schedule tokens to be unlocked
   * @param value - Amount to unbond
   * @param options - Transaction options
   * @returns Transaction result
   */
  async unbond(
    value: string | number | BN,
    options: TransactionOptions = {},
  ): Promise<StakingTransactionResult> {
    const tx = this.api.tx.staking.unbond(value);
    return this.signAndSend(tx, options);
  }

  /**
   * Withdraw unlocked tokens
   * @param numSlashingSpans - Number of slashing spans
   * @param options - Transaction options
   * @returns Transaction result
   */
  async withdrawUnbonded(
    numSlashingSpans: number,
    options: TransactionOptions = {},
  ): Promise<StakingTransactionResult> {
    const tx = this.api.tx.staking.withdrawUnbonded(numSlashingSpans);
    return this.signAndSend(tx, options);
  }

  /**
   * Nominate validators
   * @param targets - Validator addresses to nominate
   * @param options - Transaction options
   * @returns Transaction result
   */
  async nominate(
    targets: SubstrateAddress[],
    options: TransactionOptions = {},
  ): Promise<StakingTransactionResult> {
    const tx = this.api.tx.staking.nominate(targets);
    return this.signAndSend(tx, options);
  }

  /**
   * Stop nominating and remove stake from active validator set
   * @param options - Transaction options
   * @returns Transaction result
   */
  async chill(options: TransactionOptions = {}): Promise<StakingTransactionResult> {
    const tx = this.api.tx.staking.chill();
    return this.signAndSend(tx, options);
  }

  /**
   * Declare intention to validate
   * @param commission - Commission rate (0-1000000000)
   * @param blocked - Whether validator is blocked
   * @param options - Transaction options
   * @returns Transaction result
   */
  async validate(
    commission: number,
    blocked: boolean = false,
    options: TransactionOptions = {},
  ): Promise<StakingTransactionResult> {
    const prefs = {
      commission: commission,
      blocked: blocked,
    };
    const tx = this.api.tx.staking.validate(prefs);
    return this.signAndSend(tx, options);
  }

  /**
   * Change reward destination
   * @param payee - New reward destination
   * @param options - Transaction options
   * @returns Transaction result
   */
  async setPayee(
    payee: RewardDestination,
    options: TransactionOptions = {},
  ): Promise<StakingTransactionResult> {
    const tx = this.api.tx.staking.setPayee(payee);
    return this.signAndSend(tx, options);
  }

  /**
   * Rebond previously unbonded tokens
   * @param value - Amount to rebond
   * @param options - Transaction options
   * @returns Transaction result
   */
  async rebond(
    value: string | number | BN,
    options: TransactionOptions = {},
  ): Promise<StakingTransactionResult> {
    const tx = this.api.tx.staking.rebond(value);
    return this.signAndSend(tx, options);
  }

  /**
   * Payout staking rewards for a validator and era
   * @param validatorStash - Validator stash address
   * @param era - Era to payout
   * @param options - Transaction options
   * @returns Transaction result
   */
  async payoutStakers(
    validatorStash: SubstrateAddress,
    era: number,
    options: TransactionOptions = {},
  ): Promise<StakingTransactionResult> {
    const tx = this.api.tx.staking.payoutStakers(validatorStash, era);
    return this.signAndSend(tx, options);
  }

  // Query methods below use Codec types and need casting
  /**
   * Get staking info for an account
   * @param address - Account address
   * @returns Staking information or null if not staking
   */
  async getStakingInfo(address: SubstrateAddress): Promise<AccountStakingInfo | null> {
    const [ledger, payee, nominators, validators] = await Promise.all([
      this.api.query.staking.ledger(address),
      this.api.query.staking.payee(address),
      this.api.query.staking.nominators(address),
      this.api.query.staking.validators(address),
    ]);

    if (isOptionNone(ledger)) {
      return null;
    }

    const ledgerData = unwrapOption(ledger);
    const currentEra = await this.api.query.staking.currentEra();
    const sessionIndex = await this.api.query.session.currentIndex();

    return {
      totalStake: ledgerData.total.toString(),
      activeStake: ledgerData.active.toString(),
      ownStake: ledgerData.total.toString(),
      nominators: [], // Parse from nominators if available
      validatorPrefs: isOptionSome(validators)
        ? {
            commission: codecToNumber(unwrapOption(validators).commission),
            blocked: unwrapOption(validators).blocked.isTrue,
          }
        : { commission: 0, blocked: false },
      rewardDestination: payee.toString() as RewardDestination,
      era: codecToNumber(unwrapOption(currentEra)),
      sessionIndex: codecToNumber(sessionIndex),
    };
  }

  /**
   * Get staking ledger for an account
   * @param address - Account address
   * @returns Staking ledger or null
   */
  async getStakingLedger(address: SubstrateAddress): Promise<StakingLedger | null> {
    const ledger = await this.api.query.staking.ledger(address);

    if (isOptionNone(ledger)) {
      return null;
    }

    const data = unwrapOption(ledger);
    return {
      stash: data.stash.toString(),
      total: data.total.toString(),
      active: data.active.toString(),
      unlocking: data.unlocking.map((chunk: any) => ({
        value: chunk.value.toString(),
        era: chunk.era.toNumber(),
      })),
      claimedRewards: data.claimedRewards.map((era: any) => era.toNumber()),
    };
  }

  /**
   * Get current era
   * @returns Current era number
   */
  async getCurrentEra(): Promise<number> {
    const era = await this.api.query.staking.currentEra();
    return codecToNumber(unwrapOption(era));
  }

  /**
   * Get active era information
   * @returns Active era index and start time
   */
  async getActiveEra(): Promise<{ index: number; start: number }> {
    const activeEra = await this.api.query.staking.activeEra();
    const data = unwrapOption(activeEra);
    return {
      index: codecToNumber(data.index),
      start: codecToNumber(unwrapOption(data.start)),
    };
  }

  /**
   * Get validator count
   * @returns Number of validators
   */
  async getValidatorCount(): Promise<number> {
    const count = await this.api.query.staking.validatorCount();
    return codecToNumber(count);
  }

  /**
   * Get minimum nominator bond
   * @returns Minimum amount required to be a nominator
   */
  async getMinNominatorBond(): Promise<string> {
    const bond = await this.api.query.staking.minNominatorBond();
    return bond.toString();
  }

  /**
   * Get minimum validator bond
   * @returns Minimum amount required to be a validator
   */
  async getMinValidatorBond(): Promise<string> {
    const bond = await this.api.query.staking.minValidatorBond();
    return bond.toString();
  }

  /**
   * Get era reward points
   * @param era - Era number
   * @returns Reward points for the era
   */
  async getEraRewardPoints(era: number): Promise<EraRewardPoints> {
    const points = await this.api.query.staking.erasRewardPoints(era);
    const pointsData = points as any;
    return {
      total: codecToNumber(pointsData.total),
      individual: new Map(
        pointsData.individual
          .entries()
          .map(([validator, pts]: [any, any]) => [validator.toString(), pts.toNumber()]),
      ),
    };
  }

  /**
   * Get pending rewards for an address
   * Note: This is a simplified implementation
   * @param address - Account address
   * @returns Pending rewards amount
   */
  async getPendingRewards(address: SubstrateAddress): Promise<string> {
    // Implementation depends on runtime API availability
    // This is a placeholder - production code needs more logic
    const currentEra = await this.getCurrentEra();
    const ledger = await this.getStakingLedger(address);

    if (!ledger) {
      return '0';
    }

    // Calculate based on claimed rewards vs current era
    // This is simplified - production code needs full calculation
    return '0';
  }
}
