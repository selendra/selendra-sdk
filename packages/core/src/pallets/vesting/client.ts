/**
 * Vesting Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for Substrate's vesting pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type { Signer } from "@polkadot/api/types";
import type {
  VestingSchedule,
  VestingInfo,
  VestingStatus,
  VestingConstants,
  VestingAccountInfo,
  VestedTransferParams,
} from "./types.js";
import { VestingQueries } from "./queries.js";

/**
 * Transaction result type
 */
export interface VestingTxResult {
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
  /** Amount unlocked (for vest calls) */
  amountUnlocked?: bigint;
}

/**
 * Vesting Manager - handles vesting pallet transactions
 */
export class VestingManager {
  private queries: VestingQueries;

  constructor(private api: ApiPromise) {
    this.queries = new VestingQueries(api);
  }

  // ==========================================================================
  // Core Vesting Extrinsics
  // ==========================================================================

  /**
   * Unlock any vested funds for the signing account
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async vest(signer: Signer, signerAddress: string): Promise<VestingTxResult> {
    try {
      const tx = this.api.tx.vesting.vest();
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Unlock vested funds for another account
   * @param target - Target account to unlock for
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async vestOther(
    target: string,
    signer: Signer,
    signerAddress: string
  ): Promise<VestingTxResult> {
    try {
      const tx = this.api.tx.vesting.vestOther(target);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create a vested transfer to another account
   * @param target - Target account
   * @param schedule - Vesting schedule
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async vestedTransfer(
    target: string,
    schedule: VestingSchedule,
    signer: Signer,
    signerAddress: string
  ): Promise<VestingTxResult> {
    try {
      const vestingSchedule = {
        locked: schedule.locked.toString(),
        perBlock: schedule.perBlock.toString(),
        startingBlock: schedule.startingBlock,
      };

      const tx = this.api.tx.vesting.vestedTransfer(target, vestingSchedule);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Force vested transfer (requires ForceOrigin/root)
   * @param source - Source account to transfer from
   * @param target - Target account
   * @param schedule - Vesting schedule
   * @param signer - Account signer (must be root/governance)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async forceVestedTransfer(
    source: string,
    target: string,
    schedule: VestingSchedule,
    signer: Signer,
    signerAddress: string
  ): Promise<VestingTxResult> {
    try {
      const vestingSchedule = {
        locked: schedule.locked.toString(),
        perBlock: schedule.perBlock.toString(),
        startingBlock: schedule.startingBlock,
      };

      const tx = this.api.tx.vesting.forceVestedTransfer(
        source,
        target,
        vestingSchedule
      );
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Merge two vesting schedules into one
   * @param schedule1Index - Index of first schedule
   * @param schedule2Index - Index of second schedule
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async mergeSchedules(
    schedule1Index: number,
    schedule2Index: number,
    signer: Signer,
    signerAddress: string
  ): Promise<VestingTxResult> {
    try {
      const tx = this.api.tx.vesting.mergeSchedules(
        schedule1Index,
        schedule2Index
      );
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Force remove vesting schedules (requires ForceOrigin/root)
   * @param target - Target account
   * @param scheduleIndex - Index of schedule to remove
   * @param signer - Account signer (must be root/governance)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async forceRemoveVestingSchedule(
    target: string,
    scheduleIndex: number,
    signer: Signer,
    signerAddress: string
  ): Promise<VestingTxResult> {
    try {
      const tx = this.api.tx.vesting.forceRemoveVestingSchedule(
        target,
        scheduleIndex
      );
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
   * Create a simple vested transfer with parameters
   * @param params - Transfer parameters
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async createVestedTransfer(
    params: VestedTransferParams,
    signer: Signer,
    signerAddress: string
  ): Promise<VestingTxResult> {
    const currentBlock = await this.getCurrentBlock();

    const schedule: VestingSchedule = {
      locked: params.locked,
      perBlock: params.perBlock,
      startingBlock: params.startingBlock ?? currentBlock,
    };

    // Validate schedule
    const validation = this.queries.validateSchedule(schedule);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(", "),
      };
    }

    return this.vestedTransfer(params.target, schedule, signer, signerAddress);
  }

  /**
   * Create a vested transfer with duration in blocks
   * @param target - Target account
   * @param totalAmount - Total amount to vest
   * @param durationBlocks - Duration in blocks
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async createVestedTransferWithDuration(
    target: string,
    totalAmount: bigint,
    durationBlocks: number,
    signer: Signer,
    signerAddress: string
  ): Promise<VestingTxResult> {
    if (durationBlocks <= 0) {
      return {
        success: false,
        error: "Duration must be positive",
      };
    }

    const perBlock = totalAmount / BigInt(durationBlocks);

    if (perBlock === BigInt(0)) {
      return {
        success: false,
        error:
          "Per block amount would be zero. Increase total or decrease duration.",
      };
    }

    const currentBlock = await this.getCurrentBlock();

    const schedule: VestingSchedule = {
      locked: totalAmount,
      perBlock,
      startingBlock: currentBlock,
    };

    return this.vestedTransfer(target, schedule, signer, signerAddress);
  }

  /**
   * Create a vested transfer with time duration
   * @param target - Target account
   * @param totalAmount - Total amount to vest
   * @param durationSeconds - Duration in seconds
   * @param blockTime - Block time in seconds (default: 6)
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async createVestedTransferWithTime(
    target: string,
    totalAmount: bigint,
    durationSeconds: number,
    blockTime: number = 6,
    signer: Signer,
    signerAddress: string
  ): Promise<VestingTxResult> {
    const durationBlocks = Math.ceil(durationSeconds / blockTime);
    return this.createVestedTransferWithDuration(
      target,
      totalAmount,
      durationBlocks,
      signer,
      signerAddress
    );
  }

  /**
   * Unlock vested funds and return the unlocked amount
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result with unlocked amount
   */
  async vestAndGetUnlocked(
    signer: Signer,
    signerAddress: string
  ): Promise<VestingTxResult> {
    // Get unlockable amount before vest
    const unlockable = await this.queries.getUnlockableAmount(signerAddress);

    const result = await this.vest(signer, signerAddress);

    if (result.success) {
      result.amountUnlocked = unlockable;
    }

    return result;
  }

  /**
   * Merge all schedules into one (if possible)
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async mergeAllSchedules(
    signer: Signer,
    signerAddress: string
  ): Promise<VestingTxResult> {
    const schedules = await this.queries.vesting(signerAddress);

    if (!schedules || schedules.length < 2) {
      return {
        success: false,
        error: "Need at least 2 schedules to merge",
      };
    }

    // Merge schedules pairwise
    // Note: This creates multiple transactions
    let currentCount = schedules.length;

    while (currentCount > 1) {
      const result = await this.mergeSchedules(0, 1, signer, signerAddress);

      if (!result.success) {
        return result;
      }

      currentCount--;
    }

    return {
      success: true,
    };
  }

  // ==========================================================================
  // Query Passthrough (for convenience)
  // ==========================================================================

  /**
   * Get vesting schedules
   */
  async getVestingSchedules(
    account: string
  ): Promise<VestingSchedule[] | null> {
    return this.queries.vesting(account);
  }

  /**
   * Get vesting info
   */
  async getVestingInfo(account: string): Promise<VestingInfo | null> {
    return this.queries.getVestingInfo(account);
  }

  /**
   * Get vesting status
   */
  async getVestingStatus(account: string): Promise<VestingStatus | null> {
    return this.queries.getVestingStatus(account);
  }

  /**
   * Get detailed account vesting info
   */
  async getAccountVestingInfo(
    account: string
  ): Promise<VestingAccountInfo | null> {
    return this.queries.getAccountVestingInfo(account);
  }

  /**
   * Check if account has vesting
   */
  async hasVesting(account: string): Promise<boolean> {
    return this.queries.hasVesting(account);
  }

  /**
   * Get unlockable amount
   */
  async getUnlockableAmount(account: string): Promise<bigint> {
    return this.queries.getUnlockableAmount(account);
  }

  /**
   * Get total locked amount
   */
  async getTotalLocked(account: string): Promise<bigint> {
    return this.queries.getTotalLocked(account);
  }

  /**
   * Check if can add more schedules
   */
  async canAddSchedule(account: string): Promise<boolean> {
    return this.queries.canAddSchedule(account);
  }

  /**
   * Get constants
   */
  getConstants(): VestingConstants {
    return this.queries.getConstants();
  }

  /**
   * Validate schedule
   */
  validateSchedule(schedule: VestingSchedule): {
    valid: boolean;
    errors: string[];
  } {
    return this.queries.validateSchedule(schedule);
  }

  /**
   * Get completion block
   */
  async getCompletionBlock(account: string): Promise<number | null> {
    return this.queries.getCompletionBlock(account);
  }

  /**
   * Get time until complete
   */
  async getTimeUntilComplete(
    account: string,
    blockTime?: number
  ): Promise<number | null> {
    return this.queries.getTimeUntilComplete(account, blockTime);
  }

  // ==========================================================================
  // Schedule Creation Helpers
  // ==========================================================================

  /**
   * Create a linear vesting schedule
   * @param totalAmount - Total amount to vest
   * @param durationBlocks - Duration in blocks
   * @param startingBlock - Starting block (defaults to current)
   * @returns Vesting schedule
   */
  async createLinearSchedule(
    totalAmount: bigint,
    durationBlocks: number,
    startingBlock?: number
  ): Promise<VestingSchedule> {
    const currentBlock = await this.getCurrentBlock();

    return {
      locked: totalAmount,
      perBlock: totalAmount / BigInt(durationBlocks),
      startingBlock: startingBlock ?? currentBlock,
    };
  }

  /**
   * Create a cliff vesting schedule (nothing vests until cliff)
   * @param totalAmount - Total amount to vest
   * @param cliffBlocks - Cliff period in blocks
   * @param vestingBlocks - Vesting period after cliff
   * @returns Vesting schedule
   */
  async createCliffSchedule(
    totalAmount: bigint,
    cliffBlocks: number,
    vestingBlocks: number
  ): Promise<VestingSchedule> {
    const currentBlock = await this.getCurrentBlock();

    return {
      locked: totalAmount,
      perBlock: totalAmount / BigInt(vestingBlocks),
      startingBlock: currentBlock + cliffBlocks,
    };
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Get current block number
   */
  private async getCurrentBlock(): Promise<number> {
    const header = await this.api.rpc.chain.getHeader();
    return header.number.toNumber();
  }

  /**
   * Sign and send a transaction
   */
  private async signAndSend(
    tx: any,
    signer: Signer,
    signerAddress: string
  ): Promise<VestingTxResult> {
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
}
