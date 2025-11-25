/**
 * Vesting Pallet Module
 *
 * Provides token vesting functionality for Selendra
 */

// Export types
export type {
  VestingSchedule,
  VestingInfo,
  VestingStatus,
  VestingParams,
  VestingConstants,
  VestingScheduleWithInfo,
  VestingAccountInfo,
  MergeSchedulesParams,
  VestingEventType,
  VestingEvent,
  VestedTransferParams,
} from "./types.js";

export {
  calculateEndBlock,
  calculateVestedAt,
  calculateLockedAt,
} from "./types.js";

// Export queries
export { VestingQueries } from "./queries.js";

// Export client/manager
export { VestingManager } from "./client.js";
export type { VestingTxResult } from "./client.js";
