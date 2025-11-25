/**
 * Operations Pallet Storage Queries
 *
 * Query functions for account state validation
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  AccountConsumers,
  AccountBalanceDetails,
  AccountValidation,
} from "./types.js";

/**
 * Operations pallet queries
 */
export class OperationsQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get account consumers counter
   * @param account - Account address
   * @returns Account consumers info
   */
  async getConsumers(account: string): Promise<AccountConsumers> {
    const accountInfo = await this.api.query.system.account(account);
    const info = accountInfo as any;

    return {
      account,
      currentConsumers: parseInt(info.consumers?.toString() || "0", 10),
    };
  }

  /**
   * Get account balance details
   * @param account - Account address
   * @returns Balance details
   */
  async getBalanceDetails(account: string): Promise<AccountBalanceDetails> {
    const accountInfo = await this.api.query.system.account(account);
    const info = accountInfo as any;
    const data = info.data || {};

    const free = BigInt(data.free?.toString() || "0");
    const reserved = BigInt(data.reserved?.toString() || "0");
    const frozen = BigInt(
      data.frozen?.toString() || data.feeFrozen?.toString() || "0"
    );

    return {
      account,
      free,
      reserved,
      frozen,
      hasReserved: reserved > BigInt(0),
      hasFrozen: frozen > BigInt(0),
    };
  }

  /**
   * Check if account is a contract
   * @param account - Account address
   * @returns True if contract account
   */
  async isContractAccount(account: string): Promise<boolean> {
    try {
      if (this.api.query.contracts?.contractInfoOf) {
        const contractInfo = await this.api.query.contracts.contractInfoOf(
          account
        );
        return !!(contractInfo && !(contractInfo as any).isNone);
      }
    } catch {
      // Contracts pallet may not be available
    }
    return false;
  }

  /**
   * Check if account is bonded for staking
   * @param account - Account address
   * @returns True if bonded
   */
  async isBonded(account: string): Promise<boolean> {
    try {
      if (this.api.query.staking?.bonded) {
        const bonded = await this.api.query.staking.bonded(account);
        return !!(bonded && !(bonded as any).isNone);
      }
    } catch {
      // Staking pallet may not be available
    }
    return false;
  }

  /**
   * Check if account has session keys
   * @param account - Account address
   * @returns True if has session keys
   */
  async hasSessionKeys(account: string): Promise<boolean> {
    try {
      if (this.api.query.session?.nextKeys) {
        const nextKeys = await this.api.query.session.nextKeys(account);
        return !!(nextKeys && !(nextKeys as any).isNone);
      }
    } catch {
      // Session pallet may not be available
    }
    return false;
  }

  /**
   * Validate account consumers counter
   * @param account - Account address
   * @returns Validation result
   */
  async validateAccount(account: string): Promise<AccountValidation> {
    const [consumers, balances, isContract, isBonded, hasKeys] =
      await Promise.all([
        this.getConsumers(account),
        this.getBalanceDetails(account),
        this.isContractAccount(account),
        this.isBonded(account),
        this.hasSessionKeys(account),
      ]);

    const hasReservedOrFrozen = balances.hasReserved || balances.hasFrozen;

    // Calculate expected consumers
    let expectedConsumers = 0;
    if (hasReservedOrFrozen) expectedConsumers += 1;
    if (isContract) expectedConsumers += 1;
    if (isBonded) expectedConsumers += 1;
    if (hasKeys) expectedConsumers += 1;

    const difference = consumers.currentConsumers - expectedConsumers;
    let mismatchType: "none" | "underflow" | "overflow" = "none";
    if (difference < 0) mismatchType = "underflow";
    else if (difference > 0) mismatchType = "overflow";

    return {
      account,
      currentConsumers: consumers.currentConsumers,
      expectedConsumers,
      hasMismatch: difference !== 0,
      mismatchType,
      difference: Math.abs(difference),
      state: {
        hasReservedOrFrozen,
        isContractAccount: isContract,
        isBonded,
        hasSessionKeys: hasKeys,
      },
    };
  }

  /**
   * Find accounts with consumer counter mismatches
   * @param accounts - List of accounts to check
   * @returns Accounts with mismatches
   */
  async findMismatchedAccounts(
    accounts: string[]
  ): Promise<AccountValidation[]> {
    const validations = await Promise.all(
      accounts.map((account) => this.validateAccount(account))
    );

    return validations.filter((v) => v.hasMismatch);
  }

  /**
   * Get nonce for an account
   * @param account - Account address
   * @returns Current nonce
   */
  async getNonce(account: string): Promise<number> {
    const accountInfo = await this.api.query.system.account(account);
    const info = accountInfo as any;
    return parseInt(info.nonce?.toString() || "0", 10);
  }

  /**
   * Check if pallet is available
   * @returns True if available
   */
  isAvailable(): boolean {
    return !!this.api.tx.operations?.fixAccountsConsumersCounter;
  }
}
