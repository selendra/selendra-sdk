/**
 * Operations Pallet Client
 *
 * Transaction building and submission for account maintenance operations
 */

import type { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import type {
  FixConsumersResult,
  BatchFixResult,
  AccountValidation,
} from "./types.js";
import { OperationsQueries } from "./queries.js";

/**
 * Operations pallet transaction manager
 */
export class OperationsManager {
  public readonly queries: OperationsQueries;

  constructor(private api: ApiPromise) {
    this.queries = new OperationsQueries(api);
  }

  /**
   * Fix account consumers counter
   *
   * This extrinsic calculates the expected consumers counter and compares
   * it with the current counter. If there's an underflow, it increments
   * the counter. If there's an overflow, it decrements the counter.
   *
   * @param signer - Account to sign the transaction
   * @param account - Account to fix
   * @returns Transaction result
   */
  async fixAccountsConsumersCounter(
    signer: KeyringPair,
    account: string
  ): Promise<FixConsumersResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.operations
        .fixAccountsConsumersCounter(account)
        .signAndSend(signer, ({ status, events, dispatchError }) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = this.api.registry.findMetaError(
                dispatchError.asModule
              );
              reject(new Error(`${decoded.section}.${decoded.name}`));
            } else {
              reject(new Error(dispatchError.toString()));
            }
            return;
          }

          if (status.isFinalized) {
            const resultEvents = events.map((e) => ({
              section: e.event.section,
              method: e.event.method,
              data: e.event.data.toString(),
            }));

            // Check for specific events
            const incremented = events.some(
              (e) =>
                e.event.section === "operations" &&
                e.event.method === "ConsumersCounterIncremented"
            );
            const decremented = events.some(
              (e) =>
                e.event.section === "operations" &&
                e.event.method === "ConsumersCounterDecremented"
            );

            resolve({
              success: true,
              blockHash: status.asFinalized.toString(),
              incremented,
              decremented,
              noChange: !incremented && !decremented,
              events: resultEvents,
            });
          }
        })
        .catch(reject);
    });
  }

  /**
   * Fix account consumers counter with validation
   *
   * First validates if fix is needed, then submits transaction
   *
   * @param signer - Account to sign the transaction
   * @param account - Account to fix
   * @returns Transaction result with validation info
   */
  async fixWithValidation(
    signer: KeyringPair,
    account: string
  ): Promise<FixConsumersResult & { validation: AccountValidation }> {
    const validation = await this.queries.validateAccount(account);

    if (!validation.hasMismatch) {
      return {
        success: true,
        noChange: true,
        events: [],
        validation,
      };
    }

    const result = await this.fixAccountsConsumersCounter(signer, account);
    return {
      ...result,
      validation,
    };
  }

  /**
   * Fix multiple accounts in batch
   *
   * @param signer - Account to sign the transactions
   * @param accounts - List of accounts to fix
   * @param options - Batch options
   * @returns Batch results
   */
  async batchFix(
    signer: KeyringPair,
    accounts: string[],
    options: {
      skipValidation?: boolean;
      continueOnError?: boolean;
    } = {}
  ): Promise<BatchFixResult> {
    const result: BatchFixResult = {
      processed: 0,
      fixed: 0,
      skipped: 0,
      failed: 0,
      results: [],
    };

    for (const account of accounts) {
      result.processed++;

      try {
        // Validate first if not skipping
        if (!options.skipValidation) {
          const validation = await this.queries.validateAccount(account);
          if (!validation.hasMismatch) {
            result.skipped++;
            result.results.push({
              account,
              success: true,
              action: "none",
            });
            continue;
          }
        }

        const fixResult = await this.fixAccountsConsumersCounter(
          signer,
          account
        );

        if (fixResult.success) {
          if (fixResult.incremented) {
            result.fixed++;
            result.results.push({
              account,
              success: true,
              action: "incremented",
            });
          } else if (fixResult.decremented) {
            result.fixed++;
            result.results.push({
              account,
              success: true,
              action: "decremented",
            });
          } else {
            result.skipped++;
            result.results.push({
              account,
              success: true,
              action: "none",
            });
          }
        }
      } catch (error) {
        result.failed++;
        result.results.push({
          account,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });

        if (!options.continueOnError) {
          break;
        }
      }
    }

    return result;
  }

  /**
   * Build unsigned fix consumers counter transaction
   * @param account - Account to fix
   * @returns Unsigned transaction
   */
  buildFixAccountsConsumersCounter(
    account: string
  ): ReturnType<ApiPromise["tx"]["operations"]["fixAccountsConsumersCounter"]> {
    return this.api.tx.operations.fixAccountsConsumersCounter(account);
  }

  /**
   * Build batch utility call with multiple fix operations
   * @param accounts - Accounts to fix
   * @returns Batch call
   */
  buildBatchFix(
    accounts: string[]
  ): ReturnType<ApiPromise["tx"]["utility"]["batch"]> {
    const calls = accounts.map((account) =>
      this.api.tx.operations.fixAccountsConsumersCounter(account)
    );
    return this.api.tx.utility.batch(calls);
  }

  /**
   * Build batchAll utility call (all or nothing)
   * @param accounts - Accounts to fix
   * @returns BatchAll call
   */
  buildBatchAllFix(
    accounts: string[]
  ): ReturnType<ApiPromise["tx"]["utility"]["batchAll"]> {
    const calls = accounts.map((account) =>
      this.api.tx.operations.fixAccountsConsumersCounter(account)
    );
    return this.api.tx.utility.batchAll(calls);
  }

  /**
   * Estimate fee for fixing an account
   * @param signer - Signer address or keypair
   * @param account - Account to fix
   * @returns Estimated fee
   */
  async estimateFee(
    signer: string | KeyringPair,
    account: string
  ): Promise<bigint> {
    const address = typeof signer === "string" ? signer : signer.address;
    const tx = this.api.tx.operations.fixAccountsConsumersCounter(account);
    const info = await tx.paymentInfo(address);
    return BigInt(info.partialFee.toString());
  }

  /**
   * Find and report all accounts with consumer counter issues
   * @param accounts - Accounts to check
   * @returns Accounts needing fix
   */
  async findAccountsNeedingFix(
    accounts: string[]
  ): Promise<AccountValidation[]> {
    return this.queries.findMismatchedAccounts(accounts);
  }
}
