/**
 * Utility Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for Substrate's utility pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type { Signer } from "@polkadot/api/types";
import type {
  BatchCallItem,
  BatchResult,
  BatchCallResult,
  UtilityConstants,
  DispatchWeight,
  DispatchOrigin,
  BatchSummary,
  CallInfo,
} from "./types.js";
import { UtilityQueries } from "./queries.js";

/**
 * Transaction result type
 */
export interface UtilityTxResult {
  /** Whether the transaction was successful */
  success: boolean;
  /** Transaction hash */
  txHash?: string;
  /** Block hash where tx was included */
  blockHash?: string;
  /** Error message if failed */
  error?: string;
  /** Events emitted */
  events?: any[];
}

/**
 * Utility Manager - handles utility pallet transactions
 */
export class UtilityManager {
  private queries: UtilityQueries;

  constructor(private api: ApiPromise) {
    this.queries = new UtilityQueries(api);
  }

  // ==========================================================================
  // Core Batch Extrinsics
  // ==========================================================================

  /**
   * Execute multiple calls in a batch
   * Continues execution even if individual calls fail
   * @param calls - Array of encoded calls or extrinsics
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result with batch details
   */
  async batch(
    calls: (string | any)[],
    signer: Signer,
    signerAddress: string
  ): Promise<UtilityTxResult & BatchResult> {
    try {
      const tx = this.api.tx.utility.batch(calls);
      return await this.signAndSendBatch(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        successCount: 0,
        failCount: calls.length,
        results: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute multiple calls in an atomic batch
   * All calls succeed or all fail (reverts on error)
   * @param calls - Array of encoded calls or extrinsics
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async batchAll(
    calls: (string | any)[],
    signer: Signer,
    signerAddress: string
  ): Promise<UtilityTxResult & BatchResult> {
    try {
      const tx = this.api.tx.utility.batchAll(calls);
      return await this.signAndSendBatch(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        successCount: 0,
        failCount: calls.length,
        results: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute multiple calls, continuing on failure
   * Same as batch but emits events for each call result
   * @param calls - Array of encoded calls or extrinsics
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result with batch details
   */
  async forceBatch(
    calls: (string | any)[],
    signer: Signer,
    signerAddress: string
  ): Promise<UtilityTxResult & BatchResult> {
    try {
      const tx = this.api.tx.utility.forceBatch(calls);
      return await this.signAndSendBatch(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        successCount: 0,
        failCount: calls.length,
        results: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // Other Utility Extrinsics
  // ==========================================================================

  /**
   * Execute a call as a derivative account
   * @param index - Derivative index (0-65535)
   * @param call - Call to execute
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async asDerivative(
    index: number,
    call: string | any,
    signer: Signer,
    signerAddress: string
  ): Promise<UtilityTxResult> {
    try {
      const tx = this.api.tx.utility.asDerivative(index, call);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Dispatch a call with a specified origin (requires root)
   * @param asOrigin - Origin to dispatch as
   * @param call - Call to execute
   * @param signer - Account signer (must be root)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async dispatchAs(
    asOrigin: DispatchOrigin,
    call: string | any,
    signer: Signer,
    signerAddress: string
  ): Promise<UtilityTxResult> {
    try {
      let origin: any;

      switch (asOrigin.type) {
        case "Root":
          origin = { system: { Root: null } };
          break;
        case "Signed":
          origin = { system: { Signed: asOrigin.account } };
          break;
        case "None":
          origin = { system: { None: null } };
          break;
      }

      const tx = this.api.tx.utility.dispatchAs(origin, call);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute a call with a specified weight
   * @param call - Call to execute
   * @param weight - Weight to use for the call
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async withWeight(
    call: string | any,
    weight: DispatchWeight,
    signer: Signer,
    signerAddress: string
  ): Promise<UtilityTxResult> {
    try {
      const tx = this.api.tx.utility.withWeight(call, {
        refTime: weight.refTime.toString(),
        proofSize: weight.proofSize.toString(),
      });
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Execute batch from BatchCallItems
   * @param items - Array of batch call items
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result with batch details
   */
  async batchItems(
    items: BatchCallItem[],
    signer: Signer,
    signerAddress: string
  ): Promise<UtilityTxResult & BatchResult> {
    const calls = items.map((item) =>
      (this.api.tx as any)[item.section][item.method](...item.args)
    );

    return this.batch(calls, signer, signerAddress);
  }

  /**
   * Execute atomic batch from BatchCallItems
   * @param items - Array of batch call items
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async batchAllItems(
    items: BatchCallItem[],
    signer: Signer,
    signerAddress: string
  ): Promise<UtilityTxResult & BatchResult> {
    const calls = items.map((item) =>
      (this.api.tx as any)[item.section][item.method](...item.args)
    );

    return this.batchAll(calls, signer, signerAddress);
  }

  /**
   * Execute multiple balance transfers in a batch
   * @param transfers - Array of [recipient, amount] tuples
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async batchTransfers(
    transfers: Array<[string, bigint]>,
    signer: Signer,
    signerAddress: string
  ): Promise<UtilityTxResult & BatchResult> {
    const calls = transfers.map(([dest, amount]) =>
      this.api.tx.balances.transferKeepAlive(dest, amount.toString())
    );

    return this.batchAll(calls, signer, signerAddress);
  }

  /**
   * Execute multiple staking operations in a batch
   * @param operations - Array of staking operations
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async batchStakingOperations(
    operations: Array<
      | { type: "bond"; value: bigint; payee: string }
      | { type: "bondExtra"; value: bigint }
      | { type: "unbond"; value: bigint }
      | { type: "withdrawUnbonded"; numSlashingSpans: number }
      | { type: "nominate"; targets: string[] }
      | { type: "chill" }
    >,
    signer: Signer,
    signerAddress: string
  ): Promise<UtilityTxResult & BatchResult> {
    const calls = operations.map((op) => {
      switch (op.type) {
        case "bond":
          return this.api.tx.staking.bond(op.value.toString(), op.payee);
        case "bondExtra":
          return this.api.tx.staking.bondExtra(op.value.toString());
        case "unbond":
          return this.api.tx.staking.unbond(op.value.toString());
        case "withdrawUnbonded":
          return this.api.tx.staking.withdrawUnbonded(op.numSlashingSpans);
        case "nominate":
          return this.api.tx.staking.nominate(op.targets);
        case "chill":
          return this.api.tx.staking.chill();
      }
    });

    return this.batchAll(calls, signer, signerAddress);
  }

  /**
   * Create a nested batch (batch within batch)
   * @param batches - Array of call arrays
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async nestedBatch(
    batches: Array<(string | any)[]>,
    signer: Signer,
    signerAddress: string
  ): Promise<UtilityTxResult & BatchResult> {
    const nestedCalls = batches.map((calls) =>
      this.api.tx.utility.batch(calls)
    );

    return this.batch(nestedCalls, signer, signerAddress);
  }

  // ==========================================================================
  // Query Passthrough (for convenience)
  // ==========================================================================

  /**
   * Get constants
   */
  getConstants(): UtilityConstants {
    return this.queries.getConstants();
  }

  /**
   * Encode a call
   */
  encodeCall(section: string, method: string, args: any[]): string {
    return this.queries.encodeCall(section, method, args);
  }

  /**
   * Decode a call
   */
  decodeCall(callData: string): {
    section: string;
    method: string;
    args: any[];
  } | null {
    return this.queries.decodeCall(callData);
  }

  /**
   * Get call hash
   */
  getCallHash(callData: string): string {
    return this.queries.getCallHash(callData);
  }

  /**
   * Get call info
   */
  async getCallInfo(callData: string): Promise<CallInfo> {
    return this.queries.getCallInfo(callData);
  }

  /**
   * Get batch summary
   */
  async getBatchSummary(items: BatchCallItem[]): Promise<BatchSummary> {
    return this.queries.getBatchSummary(items);
  }

  /**
   * Validate batch
   */
  validateBatch(items: BatchCallItem[]): {
    valid: boolean;
    errors: string[];
  } {
    return this.queries.validateBatch(items);
  }

  /**
   * Check if call is available
   */
  isCallAvailable(section: string, method: string): boolean {
    return this.queries.isCallAvailable(section, method);
  }

  /**
   * Get pallet methods
   */
  getPalletMethods(section: string): string[] {
    return this.queries.getPalletMethods(section);
  }

  /**
   * Get available pallets
   */
  getAvailablePallets(): string[] {
    return this.queries.getAvailablePallets();
  }

  /**
   * Estimate weight
   */
  async estimateWeight(callData: string): Promise<DispatchWeight> {
    return this.queries.estimateWeight(callData);
  }

  // ==========================================================================
  // Call Building Helpers
  // ==========================================================================

  /**
   * Build a transfer call
   */
  buildTransferCall(dest: string, amount: bigint): any {
    return this.api.tx.balances.transferKeepAlive(dest, amount.toString());
  }

  /**
   * Build a remark call (for testing)
   */
  buildRemarkCall(remark: string): any {
    return this.api.tx.system.remark(remark);
  }

  /**
   * Build a remarkWithEvent call
   */
  buildRemarkWithEventCall(remark: string): any {
    return this.api.tx.system.remarkWithEvent(remark);
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Sign and send a transaction
   */
  private async signAndSend(
    tx: any,
    signer: Signer,
    signerAddress: string
  ): Promise<UtilityTxResult> {
    return new Promise((resolve) => {
      tx.signAndSend(
        signerAddress,
        { signer },
        ({ status, events, dispatchError }: any) => {
          if (status.isInBlock || status.isFinalized) {
            if (dispatchError) {
              let errorMessage = "Transaction failed";

              if (dispatchError.isModule) {
                const decoded = this.api.registry.findMetaError(
                  dispatchError.asModule
                );
                errorMessage = `${decoded.section}.${
                  decoded.name
                }: ${decoded.docs.join(" ")}`;
              } else {
                errorMessage = dispatchError.toString();
              }

              resolve({
                success: false,
                txHash: tx.hash.toHex(),
                blockHash:
                  status.asInBlock?.toHex() || status.asFinalized?.toHex(),
                error: errorMessage,
                events: events?.map((e: any) => e.toHuman()),
              });
            } else {
              resolve({
                success: true,
                txHash: tx.hash.toHex(),
                blockHash:
                  status.asInBlock?.toHex() || status.asFinalized?.toHex(),
                events: events?.map((e: any) => e.toHuman()),
              });
            }
          }
        }
      ).catch((error: Error) => {
        resolve({
          success: false,
          error: error.message,
        });
      });
    });
  }

  /**
   * Sign and send a batch transaction with detailed results
   */
  private async signAndSendBatch(
    tx: any,
    signer: Signer,
    signerAddress: string
  ): Promise<UtilityTxResult & BatchResult> {
    return new Promise((resolve) => {
      tx.signAndSend(
        signerAddress,
        { signer },
        ({ status, events, dispatchError }: any) => {
          if (status.isInBlock || status.isFinalized) {
            const results: BatchCallResult[] = [];
            let successCount = 0;
            let failCount = 0;
            let failedAtIndex: number | undefined;

            // Parse batch events
            if (events) {
              let itemIndex = 0;

              for (const event of events) {
                const { section, method, data } = event.event;

                if (section === "utility") {
                  if (method === "ItemCompleted") {
                    results.push({
                      index: itemIndex,
                      success: true,
                    });
                    successCount++;
                    itemIndex++;
                  } else if (method === "ItemFailed") {
                    const error = data[0]?.toString() ?? "Unknown error";
                    results.push({
                      index: itemIndex,
                      success: false,
                      error,
                    });
                    failCount++;

                    if (failedAtIndex === undefined) {
                      failedAtIndex = itemIndex;
                    }
                    itemIndex++;
                  } else if (method === "BatchInterrupted") {
                    failedAtIndex = data[0]?.toNumber();
                  }
                }
              }
            }

            if (dispatchError) {
              let errorMessage = "Batch failed";

              if (dispatchError.isModule) {
                const decoded = this.api.registry.findMetaError(
                  dispatchError.asModule
                );
                errorMessage = `${decoded.section}.${
                  decoded.name
                }: ${decoded.docs.join(" ")}`;
              } else {
                errorMessage = dispatchError.toString();
              }

              resolve({
                success: false,
                txHash: tx.hash.toHex(),
                blockHash:
                  status.asInBlock?.toHex() || status.asFinalized?.toHex(),
                error: errorMessage,
                events: events?.map((e: any) => e.toHuman()),
                successCount,
                failCount,
                failedAtIndex,
                results,
              });
            } else {
              resolve({
                success: true,
                txHash: tx.hash.toHex(),
                blockHash:
                  status.asInBlock?.toHex() || status.asFinalized?.toHex(),
                events: events?.map((e: any) => e.toHuman()),
                successCount,
                failCount,
                failedAtIndex,
                results,
              });
            }
          }
        }
      ).catch((error: Error) => {
        resolve({
          success: false,
          error: error.message,
          successCount: 0,
          failCount: 0,
          results: [],
        });
      });
    });
  }
}
