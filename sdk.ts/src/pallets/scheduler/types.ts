/**
 * Scheduler Pallet Types
 *
 * Type definitions for scheduled calls
 */

/**
 * Scheduled call info
 */
export interface ScheduledCall {
  /** Block number when call is scheduled */
  when: number;
  /** Index of the scheduled call in the block's agenda */
  index: number;
  /** Call data (encoded) */
  call: string;
  /** Optional call name/ID */
  maybeName?: string;
  /** Priority of the call */
  priority: number;
  /** Periodic schedule (if any) */
  maybePeriodic?: {
    /** Period in blocks */
    period: number;
    /** Maximum number of executions */
    count: number;
  };
  /** Origin that scheduled the call */
  origin: ScheduleOrigin;
}

/**
 * Schedule origin type
 */
export type ScheduleOrigin =
  | { Root: null }
  | { Signed: string }
  | { None: null };

/**
 * Agenda entry for a block
 */
export interface AgendaEntry {
  /** Block number */
  blockNumber: number;
  /** Scheduled calls for this block */
  calls: ScheduledCall[];
}

/**
 * Parameters for scheduling a call
 */
export interface ScheduleParams {
  /** Block number to execute at */
  when: number;
  /** Optional periodic execution */
  maybePeriodic?: {
    /** Period between executions */
    period: number;
    /** Number of times to repeat */
    count: number;
  };
  /** Priority (lower = higher priority) */
  priority: number;
  /** Call to execute */
  call: {
    /** Pallet section */
    section: string;
    /** Method name */
    method: string;
    /** Arguments */
    args: any[];
  };
}

/**
 * Parameters for named schedule
 */
export interface ScheduleNamedParams extends ScheduleParams {
  /** Unique name/ID for the scheduled call */
  id: string;
}

/**
 * Scheduler pallet constants
 */
export interface SchedulerConstants {
  /** Maximum weight per block for scheduled calls */
  maximumWeight: {
    refTime: bigint;
    proofSize: bigint;
  };
  /** Maximum number of scheduled calls per block */
  maxScheduledPerBlock: number;
}

/**
 * Transaction result
 */
export interface SchedulerTxResult {
  /** Whether transaction succeeded */
  success: boolean;
  /** Block hash */
  blockHash: string;
  /** Transaction hash */
  txHash: string;
  /** Events */
  events: any[];
  /** Index of scheduled call (if scheduling) */
  index?: number;
}
