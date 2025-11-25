/**
 * Balances Pallet Storage Queries
 * 
 * Query functions for the Balances pallet storage
 */

import type { ApiPromise } from '@polkadot/api';
import type { AccountData, BalanceLock, ReserveData } from './types';

/**
 * Balances storage queries
 */
export class BalancesQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get total issuance of native token
   * @returns Total issuance amount
   */
  async totalIssuance(): Promise<bigint> {
    const issuance = await this.api.query.balances.totalIssuance();
    return BigInt(issuance.toString());
  }

  /**
   * Get account balance information
   * @param accountId - Account address
   * @returns Account balance data
   */
  async account(accountId: string): Promise<AccountData> {
    const accountData: any = await this.api.query.system.account(accountId);
    const data = accountData.data;

    return {
      free: BigInt(data.free.toString()),
      reserved: BigInt(data.reserved.toString()),
      frozen: BigInt(data.frozen?.toString() || '0'),
      flags: BigInt(data.flags?.toString() || '0'),
    };
  }

  /**
   * Get account locks
   * @param accountId - Account address
   * @returns Array of balance locks
   */
  async locks(accountId: string): Promise<BalanceLock[]> {
    const locks: any = await this.api.query.balances.locks(accountId);
    
    return locks.map((lock: any) => ({
      id: lock.id.toHuman() as string,
      amount: BigInt(lock.amount.toString()),
      reasons: this.parseReasons(lock.reasons),
    }));
  }

  /**
   * Get named reserves
   * @param accountId - Account address
   * @returns Array of named reserves
   */
  async reserves(accountId: string): Promise<ReserveData[]> {
    const reserves: any = await this.api.query.balances.reserves(accountId);
    
    return reserves.map((reserve: any) => ({
      id: reserve.id.toHuman() as string,
      amount: BigInt(reserve.amount.toString()),
    }));
  }

  /**
   * Get free balance
   * @param accountId - Account address
   * @returns Free balance
   */
  async freeBalance(accountId: string): Promise<bigint> {
    const accountData = await this.account(accountId);
    return accountData.free;
  }

  /**
   * Get reserved balance
   * @param accountId - Account address
   * @returns Reserved balance
   */
  async reservedBalance(accountId: string): Promise<bigint> {
    const accountData = await this.account(accountId);
    return accountData.reserved;
  }

  /**
   * Get frozen balance
   * @param accountId - Account address
   * @returns Frozen balance
   */
  async frozenBalance(accountId: string): Promise<bigint> {
    const accountData = await this.account(accountId);
    return accountData.frozen;
  }

  /**
   * Parse lock reasons from chain data
   */
  private parseReasons(reasons: any): any {
    if (reasons.isFee) return 'Fee';
    if (reasons.isMisc) return 'Misc';
    if (reasons.isAll) return 'All';
    return 'All';
  }
}
