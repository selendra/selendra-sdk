/**
 * Safe Mode Pallet Storage Queries
 *
 * Query functions for safe mode state
 */

import type { ApiPromise } from "@polkadot/api";
import type { SafeModeStatus, SafeModeConstants } from "./types.js";

/**
 * Safe mode storage queries
 */
export class SafeModeQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get safe mode status
   * @returns Safe mode status
   */
  async getStatus(): Promise<SafeModeStatus> {
    try {
      const result = await this.api.query.safeMode.enteredUntil();

      if (!result || (result as any).isNone) {
        return {
          isActive: false,
        };
      }

      const enteredUntil = parseInt(
        (result as any).unwrap
          ? (result as any).unwrap().toString()
          : result.toString(),
        10
      );

      // Get current block to calculate remaining
      const currentBlock = await this.api.query.system.number();
      const currentBlockNum = parseInt(currentBlock.toString(), 10);
      const remainingBlocks = Math.max(0, enteredUntil - currentBlockNum);

      return {
        isActive: remainingBlocks > 0,
        enteredUntil,
        remainingBlocks,
      };
    } catch {
      return {
        isActive: false,
      };
    }
  }

  /**
   * Get the block until safe mode is active
   * @returns Block number or null if not active
   */
  async enteredUntil(): Promise<number | null> {
    try {
      const result = await this.api.query.safeMode.enteredUntil();

      if (!result || (result as any).isNone) {
        return null;
      }

      return parseInt(
        (result as any).unwrap
          ? (result as any).unwrap().toString()
          : result.toString(),
        10
      );
    } catch {
      return null;
    }
  }

  /**
   * Check if safe mode is currently active
   * @returns True if active
   */
  async isActive(): Promise<boolean> {
    const status = await this.getStatus();
    return status.isActive;
  }

  /**
   * Get pallet constants
   * @returns Safe mode constants
   */
  async getConstants(): Promise<SafeModeConstants> {
    let enterDuration = 0;
    let extendDuration = 0;
    let enterDepositAmount = BigInt(0);
    let extendDepositAmount = BigInt(0);
    let releaseDelay = 0;

    try {
      const enter = this.api.consts.safeMode?.enterDuration;
      if (enter) {
        enterDuration = parseInt(enter.toString(), 10);
      }
    } catch {
      // Use default
    }

    try {
      const extend = this.api.consts.safeMode?.extendDuration;
      if (extend) {
        extendDuration = parseInt(extend.toString(), 10);
      }
    } catch {
      // Use default
    }

    try {
      const enterDeposit = this.api.consts.safeMode?.enterDepositAmount;
      if (enterDeposit) {
        enterDepositAmount = BigInt(enterDeposit.toString());
      }
    } catch {
      // Use default
    }

    try {
      const extendDeposit = this.api.consts.safeMode?.extendDepositAmount;
      if (extendDeposit) {
        extendDepositAmount = BigInt(extendDeposit.toString());
      }
    } catch {
      // Use default
    }

    try {
      const delay = this.api.consts.safeMode?.releaseDelay;
      if (delay) {
        releaseDelay = parseInt(delay.toString(), 10);
      }
    } catch {
      // Use default
    }

    return {
      enterDuration,
      extendDuration,
      enterDepositAmount,
      extendDepositAmount,
      releaseDelay,
    };
  }

  /**
   * Check if pallet is available
   * @returns True if available
   */
  isAvailable(): boolean {
    return !!(this.api.query.safeMode && this.api.tx.safeMode);
  }
}
