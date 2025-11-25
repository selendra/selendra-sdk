/**
 * Vesting Pallet Types
 *
 * Type definitions for Substrate's vesting pallet
 */

/**
 * A vesting schedule
 */
export interface VestingSchedule {
  /** Amount locked at start */
  locked: bigint;
  /** Amount that becomes unlocked each block */
  perBlock: bigint;
  /** Starting block of the vesting */
  startingBlock: number;
}

/**
 * Vesting info for an account
 */
export interface VestingInfo {
  /** All vesting schedules */
  schedules: VestingSchedule[];
  /** Total locked amount */
  totalLocked: bigint;
  /** Amount that is already vested */
  vestedAmount: bigint;
  /** Amount still unvested */
  unvestedAmount: bigint;
  /** Block when all vesting completes */
  endBlock: number | null;
}

/**
 * Vesting status at a specific block
 */
export interface VestingStatus {
  /** Current block number */
  currentBlock: number;
  /** Total locked in schedules */
  totalLocked: bigint;
  /** Amount vested so far */
  vested: bigint;
  /** Amount still locked */
  locked: bigint;
  /** Amount that can be unlocked/withdrawn */
  unlockable: bigint;
  /** Whether vesting is complete */
  isComplete: boolean;
}

/**
 * Vesting schedule creation parameters
 */
export interface VestingParams {
  /** Target account */
  target: string;
  /** Schedule to add */
  schedule: VestingSchedule;
}

/**
 * Vesting pallet constants
 */
export interface VestingConstants {
  /** Minimum vesting transfer amount */
  minVestedTransfer: bigint;
  /** Maximum vesting schedules per account */
  maxVestingSchedules: number;
}

/**
 * Vesting schedule with computed info
 */
export interface VestingScheduleWithInfo extends VestingSchedule {
  /** Index of this schedule */
  index: number;
  /** Block when this schedule ends */
  endBlock: number;
  /** Duration in blocks */
  duration: number;
  /** Amount vested so far from this schedule */
  vestedAmount: bigint;
  /** Amount remaining to vest */
  remainingAmount: bigint;
  /** Progress percentage (0-100) */
  progress: number;
}

/**
 * Detailed vesting account info
 */
export interface VestingAccountInfo {
  /** Account address */
  account: string;
  /** All schedules with computed info */
  schedules: VestingScheduleWithInfo[];
  /** Summary status */
  status: VestingStatus;
  /** Next vest event (if any) */
  nextVestBlock: number | null;
  /** Blocks until complete vesting */
  blocksUntilComplete: number | null;
}

/**
 * Merge schedules options
 */
export interface MergeSchedulesParams {
  /** First schedule index */
  schedule1Index: number;
  /** Second schedule index */
  schedule2Index: number;
}

/**
 * Vesting event types
 */
export type VestingEventType =
  | "VestingScheduleAdded"
  | "VestingCompleted"
  | "VestingUpdated";

/**
 * Vesting event
 */
export interface VestingEvent {
  /** Event type */
  type: VestingEventType;
  /** Account affected */
  account: string;
  /** Block number */
  block: number;
  /** Amount involved (if applicable) */
  amount?: bigint;
  /** Schedule index (if applicable) */
  scheduleIndex?: number;
}

/**
 * Vesting transfer parameters
 */
export interface VestedTransferParams {
  /** Target account */
  target: string;
  /** Locked amount */
  locked: bigint;
  /** Per block unlock amount */
  perBlock: bigint;
  /** Starting block (defaults to current) */
  startingBlock?: number;
}

/**
 * Calculate end block for a vesting schedule
 */
export function calculateEndBlock(schedule: VestingSchedule): number {
  if (schedule.perBlock === BigInt(0)) {
    return Number.MAX_SAFE_INTEGER;
  }

  const blocks = Number(schedule.locked / schedule.perBlock);
  return schedule.startingBlock + blocks;
}

/**
 * Calculate vested amount at a specific block
 */
export function calculateVestedAt(
  schedule: VestingSchedule,
  blockNumber: number
): bigint {
  if (blockNumber < schedule.startingBlock) {
    return BigInt(0);
  }

  const blocksSinceStart = BigInt(blockNumber - schedule.startingBlock);
  const vested = blocksSinceStart * schedule.perBlock;

  // Cap at locked amount
  return vested > schedule.locked ? schedule.locked : vested;
}

/**
 * Calculate remaining locked amount at a specific block
 */
export function calculateLockedAt(
  schedule: VestingSchedule,
  blockNumber: number
): bigint {
  const vested = calculateVestedAt(schedule, blockNumber);
  return schedule.locked - vested;
}
