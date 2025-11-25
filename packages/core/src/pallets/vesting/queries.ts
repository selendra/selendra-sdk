/**
 * Vesting Pallet Queries
 *
 * Query functions for Substrate's vesting pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  VestingSchedule,
  VestingInfo,
  VestingStatus,
  VestingConstants,
  VestingScheduleWithInfo,
  VestingAccountInfo,
} from "./types.js";
import {
  calculateEndBlock,
  calculateVestedAt,
  calculateLockedAt,
} from "./types.js";

/**
 * Vesting pallet queries
 */
export class VestingQueries {
  constructor(private api: ApiPromise) {}

  // ==========================================================================
  // Core Storage Queries
  // ==========================================================================

  /**
   * Get vesting schedules for an account
   * @param account - Account address
   * @returns Array of vesting schedules or null if no vesting
   */
  async vesting(account: string): Promise<VestingSchedule[] | null> {
    try {
      const result = await this.api.query.vesting.vesting(account);

      if ((result as any).isNone) {
        return null;
      }

      const schedules = (result as any).unwrap();
      return schedules.map((s: any) => ({
        locked: BigInt(s.locked.toString()),
        perBlock: BigInt(s.perBlock.toString()),
        startingBlock: (s.startingBlock as any).toNumber(),
      }));
    } catch (error) {
      console.error("Error querying vesting:", error);
      return null;
    }
  }

  /**
   * Get storage version
   * @returns Storage version
   */
  async storageVersion(): Promise<number> {
    try {
      const result = await this.api.query.vesting.storageVersion();
      return (result as any).toNumber();
    } catch (error) {
      console.error("Error querying storage version:", error);
      return 0;
    }
  }

  // ==========================================================================
  // Constants
  // ==========================================================================

  /**
   * Get vesting pallet constants
   */
  getConstants(): VestingConstants {
    const minVestedTransfer = this.api.consts.vesting.minVestedTransfer;
    const maxVestingSchedules = this.api.consts.vesting.maxVestingSchedules;

    return {
      minVestedTransfer: BigInt(minVestedTransfer?.toString() ?? "0"),
      maxVestingSchedules: (maxVestingSchedules as any)?.toNumber() ?? 28,
    };
  }

  // ==========================================================================
  // High-Level Queries
  // ==========================================================================

  /**
   * Get full vesting info for an account
   * @param account - Account address
   * @returns Vesting info or null if no vesting
   */
  async getVestingInfo(account: string): Promise<VestingInfo | null> {
    const schedules = await this.vesting(account);

    if (!schedules || schedules.length === 0) {
      return null;
    }

    const currentBlock = await this.getCurrentBlock();

    let totalLocked = BigInt(0);
    let vestedAmount = BigInt(0);
    let maxEndBlock = 0;

    for (const schedule of schedules) {
      totalLocked += schedule.locked;
      vestedAmount += calculateVestedAt(schedule, currentBlock);

      const endBlock = calculateEndBlock(schedule);
      if (endBlock > maxEndBlock) {
        maxEndBlock = endBlock;
      }
    }

    const unvestedAmount = totalLocked - vestedAmount;

    return {
      schedules,
      totalLocked,
      vestedAmount,
      unvestedAmount,
      endBlock: maxEndBlock < Number.MAX_SAFE_INTEGER ? maxEndBlock : null,
    };
  }

  /**
   * Get vesting status at current block
   * @param account - Account address
   * @returns Vesting status
   */
  async getVestingStatus(account: string): Promise<VestingStatus | null> {
    const schedules = await this.vesting(account);

    if (!schedules || schedules.length === 0) {
      return null;
    }

    const currentBlock = await this.getCurrentBlock();

    let totalLocked = BigInt(0);
    let vested = BigInt(0);

    for (const schedule of schedules) {
      totalLocked += schedule.locked;
      vested += calculateVestedAt(schedule, currentBlock);
    }

    const locked = totalLocked - vested;
    const unlockable = vested; // Amount that can be freed

    return {
      currentBlock,
      totalLocked,
      vested,
      locked,
      unlockable,
      isComplete: locked === BigInt(0),
    };
  }

  /**
   * Get detailed account vesting info
   * @param account - Account address
   * @returns Detailed vesting account info
   */
  async getAccountVestingInfo(
    account: string
  ): Promise<VestingAccountInfo | null> {
    const schedules = await this.vesting(account);

    if (!schedules || schedules.length === 0) {
      return null;
    }

    const currentBlock = await this.getCurrentBlock();
    const schedulesWithInfo: VestingScheduleWithInfo[] = [];
    let nextVestBlock: number | null = null;
    let maxEndBlock = 0;

    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];
      const endBlock = calculateEndBlock(schedule);
      const vestedAmount = calculateVestedAt(schedule, currentBlock);
      const remainingAmount = schedule.locked - vestedAmount;
      const duration = endBlock - schedule.startingBlock;

      // Calculate progress
      let progress = 0;
      if (schedule.locked > BigInt(0)) {
        progress = Number((vestedAmount * BigInt(100)) / schedule.locked);
      }

      schedulesWithInfo.push({
        ...schedule,
        index: i,
        endBlock,
        duration,
        vestedAmount,
        remainingAmount,
        progress,
      });

      // Track next vest event
      if (
        endBlock > currentBlock &&
        (!nextVestBlock || endBlock < nextVestBlock)
      ) {
        nextVestBlock = currentBlock + 1; // Next block will have more vested
      }

      if (endBlock > maxEndBlock) {
        maxEndBlock = endBlock;
      }
    }

    const status = await this.getVestingStatus(account);

    return {
      account,
      schedules: schedulesWithInfo,
      status: status!,
      nextVestBlock,
      blocksUntilComplete:
        maxEndBlock > currentBlock ? maxEndBlock - currentBlock : null,
    };
  }

  /**
   * Check if account has vesting
   * @param account - Account address
   * @returns Whether account has vesting schedules
   */
  async hasVesting(account: string): Promise<boolean> {
    const schedules = await this.vesting(account);
    return schedules !== null && schedules.length > 0;
  }

  /**
   * Get total locked amount for an account
   * @param account - Account address
   * @returns Total locked amount or 0
   */
  async getTotalLocked(account: string): Promise<bigint> {
    const info = await this.getVestingInfo(account);
    return info?.totalLocked ?? BigInt(0);
  }

  /**
   * Get amount that can be unlocked (already vested)
   * @param account - Account address
   * @returns Unlockable amount
   */
  async getUnlockableAmount(account: string): Promise<bigint> {
    const status = await this.getVestingStatus(account);
    return status?.unlockable ?? BigInt(0);
  }

  /**
   * Get number of vesting schedules
   * @param account - Account address
   * @returns Number of schedules
   */
  async getScheduleCount(account: string): Promise<number> {
    const schedules = await this.vesting(account);
    return schedules?.length ?? 0;
  }

  /**
   * Check if can add more schedules
   * @param account - Account address
   * @returns Whether more schedules can be added
   */
  async canAddSchedule(account: string): Promise<boolean> {
    const count = await this.getScheduleCount(account);
    const constants = this.getConstants();
    return count < constants.maxVestingSchedules;
  }

  /**
   * Get all accounts with vesting (expensive query)
   * @param limit - Maximum accounts to return
   * @returns List of accounts with vesting
   */
  async getAllVestingAccounts(
    limit?: number
  ): Promise<Array<{ account: string; scheduleCount: number }>> {
    try {
      const entries = await this.api.query.vesting.vesting.entries();
      const result: Array<{ account: string; scheduleCount: number }> = [];

      for (const [key, value] of entries) {
        if (limit && result.length >= limit) break;

        const account = key.args[0].toString();

        if ((value as any).isSome) {
          const schedules = (value as any).unwrap();
          result.push({
            account,
            scheduleCount: schedules.length,
          });
        }
      }

      return result;
    } catch (error) {
      console.error("Error getting all vesting accounts:", error);
      return [];
    }
  }

  /**
   * Calculate when vesting will complete
   * @param account - Account address
   * @returns Block number when complete, or null
   */
  async getCompletionBlock(account: string): Promise<number | null> {
    const schedules = await this.vesting(account);

    if (!schedules || schedules.length === 0) {
      return null;
    }

    let maxEndBlock = 0;
    for (const schedule of schedules) {
      const endBlock = calculateEndBlock(schedule);
      if (endBlock > maxEndBlock && endBlock < Number.MAX_SAFE_INTEGER) {
        maxEndBlock = endBlock;
      }
    }

    return maxEndBlock > 0 ? maxEndBlock : null;
  }

  /**
   * Estimate time until vesting completes
   * @param account - Account address
   * @param blockTime - Block time in seconds (default: 6)
   * @returns Time in seconds, or null
   */
  async getTimeUntilComplete(
    account: string,
    blockTime: number = 6
  ): Promise<number | null> {
    const completionBlock = await this.getCompletionBlock(account);

    if (!completionBlock) {
      return null;
    }

    const currentBlock = await this.getCurrentBlock();
    const blocksRemaining = completionBlock - currentBlock;

    if (blocksRemaining <= 0) {
      return 0;
    }

    return blocksRemaining * blockTime;
  }

  /**
   * Validate vesting schedule parameters
   * @param schedule - Schedule to validate
   * @returns Validation result
   */
  validateSchedule(schedule: VestingSchedule): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const constants = this.getConstants();

    if (schedule.locked < constants.minVestedTransfer) {
      errors.push(
        `Locked amount must be at least ${constants.minVestedTransfer.toString()}`
      );
    }

    if (schedule.perBlock === BigInt(0)) {
      errors.push("Per block amount cannot be zero");
    }

    if (schedule.perBlock > schedule.locked) {
      errors.push("Per block amount cannot exceed locked amount");
    }

    if (schedule.startingBlock < 0) {
      errors.push("Starting block cannot be negative");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Get current block number
   */
  private async getCurrentBlock(): Promise<number> {
    const header = await this.api.rpc.chain.getHeader();
    return header.number.toNumber();
  }
}
