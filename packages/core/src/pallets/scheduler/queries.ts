/**
 * Scheduler Pallet Storage Queries
 *
 * Query functions for scheduled calls
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  ScheduledCall,
  AgendaEntry,
  SchedulerConstants,
} from "./types.js";

/**
 * Scheduler storage queries
 */
export class SchedulerQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get the agenda for a specific block
   * @param blockNumber - Block number to query
   * @returns Scheduled calls for that block
   */
  async agenda(blockNumber: number): Promise<AgendaEntry> {
    const result = await this.api.query.scheduler.agenda(blockNumber);
    const agenda = result as any;

    const calls: ScheduledCall[] = [];

    if (Array.isArray(agenda)) {
      for (let i = 0; i < agenda.length; i++) {
        const item = agenda[i];
        if (item && !item.isNone) {
          const call = item.unwrap ? item.unwrap() : item;
          calls.push(this.parseScheduledCall(call, blockNumber, i));
        }
      }
    }

    return {
      blockNumber,
      calls,
    };
  }

  /**
   * Lookup a named scheduled call
   * @param id - Name/ID of the scheduled call
   * @returns Block number and index if found
   */
  async lookup(id: string): Promise<{ when: number; index: number } | null> {
    try {
      const result = await this.api.query.scheduler.lookup(id);

      if (!result || (result as any).isNone) {
        return null;
      }

      const data = (result as any).unwrap ? (result as any).unwrap() : result;

      return {
        when: parseInt(data[0]?.toString() || "0", 10),
        index: parseInt(data[1]?.toString() || "0", 10),
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if a named schedule exists
   * @param id - Schedule ID/name
   * @returns True if exists
   */
  async hasSchedule(id: string): Promise<boolean> {
    const lookup = await this.lookup(id);
    return lookup !== null;
  }

  /**
   * Get pallet constants
   * @returns Scheduler constants
   */
  async getConstants(): Promise<SchedulerConstants> {
    let maximumWeight = {
      refTime: BigInt("10000000000000"), // 10s
      proofSize: BigInt("5242880"), // 5MB
    };
    let maxScheduledPerBlock = 50;

    try {
      const weight = this.api.consts.scheduler?.maximumWeight;
      if (weight) {
        const w = weight as any;
        maximumWeight = {
          refTime: BigInt(w.refTime?.toString() || "10000000000000"),
          proofSize: BigInt(w.proofSize?.toString() || "5242880"),
        };
      }
    } catch {
      // Use default
    }

    try {
      const maxScheduled = this.api.consts.scheduler?.maxScheduledPerBlock;
      if (maxScheduled) {
        maxScheduledPerBlock = parseInt(maxScheduled.toString(), 10);
      }
    } catch {
      // Use default
    }

    return {
      maximumWeight,
      maxScheduledPerBlock,
    };
  }

  /**
   * Get all scheduled calls within a block range
   * @param startBlock - Start block number
   * @param endBlock - End block number
   * @returns All scheduled calls
   */
  async getScheduledInRange(
    startBlock: number,
    endBlock: number
  ): Promise<AgendaEntry[]> {
    const entries: AgendaEntry[] = [];

    for (let block = startBlock; block <= endBlock; block++) {
      const agenda = await this.agenda(block);
      if (agenda.calls.length > 0) {
        entries.push(agenda);
      }
    }

    return entries;
  }

  /**
   * Get upcoming scheduled calls
   * @param blocksAhead - How many blocks ahead to look
   * @returns Upcoming scheduled calls
   */
  async getUpcoming(blocksAhead: number = 100): Promise<AgendaEntry[]> {
    const currentBlock = await this.api.rpc.chain.getHeader();
    const currentNumber = currentBlock.number.toNumber();

    return this.getScheduledInRange(
      currentNumber + 1,
      currentNumber + blocksAhead
    );
  }

  /**
   * Get total number of scheduled calls in range
   * @param startBlock - Start block
   * @param endBlock - End block
   * @returns Count of scheduled calls
   */
  async countScheduled(startBlock: number, endBlock: number): Promise<number> {
    const entries = await this.getScheduledInRange(startBlock, endBlock);
    return entries.reduce((sum, e) => sum + e.calls.length, 0);
  }

  /**
   * Check if the scheduler pallet is available
   * @returns True if available
   */
  isAvailable(): boolean {
    return !!(this.api.query.scheduler && this.api.tx.scheduler);
  }

  /**
   * Parse a scheduled call from chain format
   */
  private parseScheduledCall(
    call: any,
    when: number,
    index: number
  ): ScheduledCall {
    let maybeName: string | undefined;
    let priority = 0;
    let maybePeriodic: { period: number; count: number } | undefined;
    let callData = "";
    let origin: ScheduledCall["origin"] = { None: null };

    try {
      // Extract name if present
      if (call.maybeName && !call.maybeName.isNone) {
        const name = call.maybeName.unwrap
          ? call.maybeName.unwrap()
          : call.maybeName;
        maybeName = name.toHex?.() || name.toString();
      }

      // Extract priority
      if (call.priority !== undefined) {
        priority = parseInt(call.priority.toString(), 10);
      }

      // Extract periodic info
      if (call.maybePeriodic && !call.maybePeriodic.isNone) {
        const periodic = call.maybePeriodic.unwrap
          ? call.maybePeriodic.unwrap()
          : call.maybePeriodic;
        maybePeriodic = {
          period: parseInt(periodic[0]?.toString() || "0", 10),
          count: parseInt(periodic[1]?.toString() || "0", 10),
        };
      }

      // Extract call data
      if (call.call) {
        callData = call.call.toHex?.() || call.call.toString();
      }

      // Extract origin
      if (call.origin) {
        if (call.origin.isRoot) {
          origin = { Root: null };
        } else if (call.origin.isSigned) {
          origin = { Signed: call.origin.asSigned.toString() };
        }
      }
    } catch {
      // Use defaults
    }

    return {
      when,
      index,
      call: callData,
      maybeName,
      priority,
      maybePeriodic,
      origin,
    };
  }
}
