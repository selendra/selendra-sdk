/**
 * Tx Pause Pallet Storage Queries
 *
 * Query functions for paused transactions
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  FullTransactionName,
  PausedTransaction,
  TxPauseConstants,
  PauseStatusBatch,
} from "./types.js";

/**
 * Tx pause storage queries
 */
export class TxPauseQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Check if a transaction is paused
   * @param palletName - Pallet name
   * @param callName - Call name
   * @returns True if paused
   */
  async isPaused(palletName: string, callName: string): Promise<boolean> {
    try {
      const result = await this.api.query.txPause.pausedCalls([
        palletName,
        callName,
      ]);

      // If the entry exists and is Some, the call is paused
      if (!result) return false;
      if ((result as any).isSome !== undefined) {
        return (result as any).isSome;
      }
      // For storage items that just return unit/null if exists
      return !!result.toString();
    } catch {
      return false;
    }
  }

  /**
   * Get paused transaction info
   * @param palletName - Pallet name
   * @param callName - Call name
   * @returns Paused transaction info
   */
  async getPausedTransaction(
    palletName: string,
    callName: string
  ): Promise<PausedTransaction> {
    const isPaused = await this.isPaused(palletName, callName);
    return {
      fullName: { palletName, callName },
      isPaused,
    };
  }

  /**
   * Get all paused transactions
   * @returns List of paused transactions
   */
  async getAllPaused(): Promise<FullTransactionName[]> {
    const paused: FullTransactionName[] = [];

    try {
      const entries = await this.api.query.txPause.pausedCalls.entries();

      for (const [key] of entries) {
        const args = key.args[0] as any;
        if (args && args.length >= 2) {
          paused.push({
            palletName: args[0]?.toString() || "",
            callName: args[1]?.toString() || "",
          });
        }
      }
    } catch {
      // Storage iteration may not be available
    }

    return paused;
  }

  /**
   * Check pause status for multiple transactions
   * @param transactions - Transactions to check
   * @returns Batch status
   */
  async checkBatch(
    transactions: FullTransactionName[]
  ): Promise<PauseStatusBatch> {
    const paused: FullTransactionName[] = [];
    const notPaused: FullTransactionName[] = [];

    for (const tx of transactions) {
      const isPaused = await this.isPaused(tx.palletName, tx.callName);
      if (isPaused) {
        paused.push(tx);
      } else {
        notPaused.push(tx);
      }
    }

    return { paused, notPaused };
  }

  /**
   * Get pallet constants
   * @returns Tx pause constants
   */
  async getConstants(): Promise<TxPauseConstants> {
    let maxNameLen = 256; // Default

    try {
      const len = this.api.consts.txPause?.maxNameLen;
      if (len) {
        maxNameLen = parseInt(len.toString(), 10);
      }
    } catch {
      // Use default
    }

    return {
      maxNameLen,
    };
  }

  /**
   * Check if pallet is available
   * @returns True if available
   */
  isAvailable(): boolean {
    return !!(this.api.query.txPause && this.api.tx.txPause);
  }

  /**
   * Get all available pallets and their calls
   * @returns Map of pallet name to call names
   */
  getAvailableCalls(): Map<string, string[]> {
    const calls = new Map<string, string[]>();

    try {
      const metadata = this.api.runtimeMetadata;
      const pallets = (metadata as any).asLatest?.pallets || [];

      for (const pallet of pallets) {
        const palletName = pallet.name.toString();
        const palletCalls: string[] = [];

        if (pallet.calls && (pallet.calls as any).isSome) {
          const callsType = (pallet.calls as any).unwrap();
          const callTypeId = callsType.type?.toNumber();

          if (callTypeId !== undefined) {
            const types = (metadata as any).asLatest?.lookup?.types || [];
            const callType = types.find(
              (t: any) => t.id?.toNumber() === callTypeId
            );

            if (callType?.type?.def?.isVariant) {
              const variants = callType.type.def.asVariant.variants || [];
              for (const variant of variants) {
                palletCalls.push(variant.name.toString());
              }
            }
          }
        }

        if (palletCalls.length > 0) {
          calls.set(palletName, palletCalls);
        }
      }
    } catch {
      // Metadata parsing may fail
    }

    return calls;
  }
}
