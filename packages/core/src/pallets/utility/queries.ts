/**
 * Utility Pallet Queries
 *
 * Query functions for Substrate's utility pallet
 * Note: Utility pallet has no storage, mainly constants and helpers
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  UtilityConstants,
  BatchCallItem,
  CallInfo,
  BatchSummary,
  DispatchWeight,
} from "./types.js";

/**
 * Utility pallet queries and helpers
 */
export class UtilityQueries {
  constructor(private api: ApiPromise) {}

  // ==========================================================================
  // Constants
  // ==========================================================================

  /**
   * Get utility pallet constants
   */
  getConstants(): UtilityConstants {
    const batchedCallsLimit = this.api.consts.utility.batchedCallsLimit;

    return {
      batchedCallsLimit: (batchedCallsLimit as any)?.toNumber() ?? 10920,
    };
  }

  // ==========================================================================
  // Call Building Helpers
  // ==========================================================================

  /**
   * Encode a call
   * @param section - Pallet name
   * @param method - Method name
   * @param args - Call arguments
   * @returns Encoded call data
   */
  encodeCall(section: string, method: string, args: any[]): string {
    try {
      const tx = (this.api.tx as any)[section][method](...args);
      return tx.method.toHex();
    } catch (error) {
      throw new Error(`Failed to encode call ${section}.${method}: ${error}`);
    }
  }

  /**
   * Decode a call
   * @param callData - Encoded call data
   * @returns Decoded call info or null
   */
  decodeCall(callData: string): {
    section: string;
    method: string;
    args: any[];
  } | null {
    try {
      const call = this.api.registry.createType("Call", callData);
      return {
        section: call.section,
        method: call.method,
        args: call.args.map((arg: any) => arg.toHuman()),
      };
    } catch (error) {
      console.error("Error decoding call:", error);
      return null;
    }
  }

  /**
   * Get call hash
   * @param callData - Encoded call data
   * @returns Call hash
   */
  getCallHash(callData: string): string {
    const bytes = new Uint8Array(
      (callData.match(/.{1,2}/g) || [])
        .slice(1)
        .map((byte) => parseInt(byte, 16))
    );
    return this.api.registry.hash(bytes).toHex();
  }

  /**
   * Build call from BatchCallItem
   * @param item - Batch call item
   * @returns Encoded call
   */
  buildCall(item: BatchCallItem): string {
    return this.encodeCall(item.section, item.method, item.args);
  }

  /**
   * Build multiple calls from BatchCallItems
   * @param items - Array of batch call items
   * @returns Array of encoded calls
   */
  buildCalls(items: BatchCallItem[]): string[] {
    return items.map((item) => this.buildCall(item));
  }

  // ==========================================================================
  // Call Info Helpers
  // ==========================================================================

  /**
   * Get detailed call info
   * @param callData - Encoded call data
   * @returns Call info
   */
  async getCallInfo(callData: string): Promise<CallInfo> {
    const decoded = this.decodeCall(callData);
    const callHash = this.getCallHash(callData);
    const weight = await this.estimateWeight(callData);

    return {
      callData,
      callHash,
      section: decoded?.section ?? "unknown",
      method: decoded?.method ?? "unknown",
      args: decoded?.args,
      weight,
    };
  }

  /**
   * Estimate weight for a call
   * @param callData - Encoded call data
   * @returns Estimated weight
   */
  async estimateWeight(callData: string): Promise<DispatchWeight> {
    try {
      const call = this.api.registry.createType("Call", callData);
      const info = await this.api.call.transactionPaymentApi.queryInfo(
        call.toHex(),
        0
      );

      return {
        refTime: BigInt((info as any).weight.refTime.toString()),
        proofSize: BigInt((info as any).weight.proofSize.toString()),
      };
    } catch (error) {
      // Return default weight on error
      return {
        refTime: BigInt("100000000"),
        proofSize: BigInt("5000"),
      };
    }
  }

  // ==========================================================================
  // Batch Helpers
  // ==========================================================================

  /**
   * Get batch summary (preview)
   * @param items - Batch call items
   * @returns Batch summary
   */
  async getBatchSummary(items: BatchCallItem[]): Promise<BatchSummary> {
    const constants = this.getConstants();
    const errors: string[] = [];

    if (items.length === 0) {
      errors.push("Batch cannot be empty");
    }

    if (items.length > constants.batchedCallsLimit) {
      errors.push(
        `Batch exceeds limit of ${constants.batchedCallsLimit} calls`
      );
    }

    const calls: CallInfo[] = [];
    let totalRefTime = BigInt(0);
    let totalProofSize = BigInt(0);

    for (let i = 0; i < items.length; i++) {
      try {
        const callData = this.buildCall(items[i]);
        const info = await this.getCallInfo(callData);
        calls.push(info);

        if (info.weight) {
          totalRefTime += info.weight.refTime;
          totalProofSize += info.weight.proofSize;
        }
      } catch (error) {
        errors.push(
          `Call ${i} (${items[i].section}.${items[i].method}): ${error}`
        );
      }
    }

    return {
      callCount: items.length,
      calls,
      totalWeight: {
        refTime: totalRefTime,
        proofSize: totalProofSize,
      },
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate batch configuration
   * @param items - Batch call items
   * @returns Validation result
   */
  validateBatch(items: BatchCallItem[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const constants = this.getConstants();

    if (items.length === 0) {
      errors.push("Batch cannot be empty");
    }

    if (items.length > constants.batchedCallsLimit) {
      errors.push(
        `Batch exceeds limit of ${constants.batchedCallsLimit} calls`
      );
    }

    // Validate each call can be built
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        // Check pallet exists
        if (!(this.api.tx as any)[item.section]) {
          errors.push(`Call ${i}: Pallet '${item.section}' not found`);
          continue;
        }

        // Check method exists
        if (!(this.api.tx as any)[item.section][item.method]) {
          errors.push(
            `Call ${i}: Method '${item.method}' not found in pallet '${item.section}'`
          );
          continue;
        }

        // Try to build the call
        this.buildCall(item);
      } catch (error) {
        errors.push(`Call ${i}: ${error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if a call is available (pallet and method exist)
   * @param section - Pallet name
   * @param method - Method name
   * @returns Whether the call is available
   */
  isCallAvailable(section: string, method: string): boolean {
    try {
      return !!(this.api.tx as any)[section]?.[method];
    } catch {
      return false;
    }
  }

  /**
   * Get available methods for a pallet
   * @param section - Pallet name
   * @returns List of method names
   */
  getPalletMethods(section: string): string[] {
    try {
      const pallet = (this.api.tx as any)[section];
      if (!pallet) return [];

      return Object.keys(pallet).filter(
        (key) => typeof pallet[key] === "function"
      );
    } catch {
      return [];
    }
  }

  /**
   * Get all available pallets
   * @returns List of pallet names
   */
  getAvailablePallets(): string[] {
    try {
      return Object.keys(this.api.tx);
    } catch {
      return [];
    }
  }

  // ==========================================================================
  // Derivative Helpers
  // ==========================================================================

  /**
   * Calculate derivative account address
   * Note: This is a simplified version, actual implementation
   * depends on the runtime's derivation method
   * @param sender - Sender address
   * @param index - Derivative index
   * @returns Derived address (approximate)
   */
  async deriveAccount(sender: string, index: number): Promise<string> {
    // The actual derivation is done on-chain
    // This is a placeholder - real derivation depends on runtime
    console.warn(
      "deriveAccount is a placeholder. Actual derivation happens on-chain."
    );
    return sender; // Return sender as placeholder
  }

  // ==========================================================================
  // Utility Analysis
  // ==========================================================================

  /**
   * Analyze a batch for optimization opportunities
   * @param items - Batch call items
   * @returns Analysis results
   */
  analyzeBatch(items: BatchCallItem[]): {
    canOptimize: boolean;
    suggestions: string[];
  } {
    const suggestions: string[] = [];

    // Check for duplicate calls
    const callKeys = items.map((i) => `${i.section}.${i.method}`);
    const duplicates = callKeys.filter(
      (key, index) => callKeys.indexOf(key) !== index
    );

    if (duplicates.length > 0) {
      suggestions.push(
        `Consider combining duplicate calls: ${[...new Set(duplicates)].join(
          ", "
        )}`
      );
    }

    // Check for common patterns
    const hasMultipleTransfers =
      items.filter((i) => i.section === "balances" && i.method === "transfer")
        .length > 1;

    if (hasMultipleTransfers) {
      suggestions.push(
        "Multiple balance transfers detected. Consider using batch for efficiency."
      );
    }

    return {
      canOptimize: suggestions.length > 0,
      suggestions,
    };
  }
}
