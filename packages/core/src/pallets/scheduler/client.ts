/**
 * Scheduler Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for scheduling calls
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type {
  ScheduleParams,
  ScheduleNamedParams,
  SchedulerTxResult,
} from "./types.js";
import { SchedulerQueries } from "./queries.js";

/**
 * Scheduler Manager - handles scheduled call operations
 */
export class SchedulerManager {
  private queries: SchedulerQueries;

  constructor(private api: ApiPromise) {
    this.queries = new SchedulerQueries(api);
  }

  // ==========================================================================
  // Core Scheduler Extrinsics
  // ==========================================================================

  /**
   * Schedule a call for future execution
   * @param when - Block number to execute at
   * @param maybePeriodic - Optional periodic execution [period, count]
   * @param priority - Priority (0-255, lower = higher priority)
   * @param call - Call to execute
   * @returns Submittable extrinsic
   */
  schedule(
    when: number,
    maybePeriodic: [number, number] | null,
    priority: number,
    call: any
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.scheduler.schedule(when, maybePeriodic, priority, call);
  }

  /**
   * Cancel a scheduled call
   * @param when - Block number of the scheduled call
   * @param index - Index in the block's agenda
   * @returns Submittable extrinsic
   */
  cancel(
    when: number,
    index: number
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.scheduler.cancel(when, index);
  }

  /**
   * Schedule a named call
   * @param id - Unique identifier for the scheduled call
   * @param when - Block number to execute at
   * @param maybePeriodic - Optional periodic execution
   * @param priority - Priority
   * @param call - Call to execute
   * @returns Submittable extrinsic
   */
  scheduleNamed(
    id: string,
    when: number,
    maybePeriodic: [number, number] | null,
    priority: number,
    call: any
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.scheduler.scheduleNamed(
      id,
      when,
      maybePeriodic,
      priority,
      call
    );
  }

  /**
   * Cancel a named scheduled call
   * @param id - Name/ID of the scheduled call
   * @returns Submittable extrinsic
   */
  cancelNamed(id: string): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.scheduler.cancelNamed(id);
  }

  /**
   * Schedule a call for N blocks after current
   * @param after - Blocks after current
   * @param maybePeriodic - Optional periodic execution
   * @param priority - Priority
   * @param call - Call to execute
   * @returns Submittable extrinsic
   */
  scheduleAfter(
    after: number,
    maybePeriodic: [number, number] | null,
    priority: number,
    call: any
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.scheduler.scheduleAfter(
      after,
      maybePeriodic,
      priority,
      call
    );
  }

  /**
   * Schedule a named call for N blocks after current
   * @param id - Unique identifier
   * @param after - Blocks after current
   * @param maybePeriodic - Optional periodic execution
   * @param priority - Priority
   * @param call - Call to execute
   * @returns Submittable extrinsic
   */
  scheduleNamedAfter(
    id: string,
    after: number,
    maybePeriodic: [number, number] | null,
    priority: number,
    call: any
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.scheduler.scheduleNamedAfter(
      id,
      after,
      maybePeriodic,
      priority,
      call
    );
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Schedule a call and wait for confirmation
   * @param signer - Keyring pair
   * @param params - Schedule parameters
   * @returns Transaction result
   */
  async scheduleAndWait(
    signer: KeyringPair,
    params: ScheduleParams
  ): Promise<SchedulerTxResult> {
    const call = this.api.tx[params.call.section][params.call.method](
      ...params.call.args
    );

    const periodic = params.maybePeriodic
      ? ([params.maybePeriodic.period, params.maybePeriodic.count] as [
          number,
          number
        ])
      : null;

    const extrinsic = this.schedule(
      params.when,
      periodic,
      params.priority,
      call
    );

    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Schedule a named call and wait
   * @param signer - Keyring pair
   * @param params - Named schedule parameters
   * @returns Transaction result
   */
  async scheduleNamedAndWait(
    signer: KeyringPair,
    params: ScheduleNamedParams
  ): Promise<SchedulerTxResult> {
    const call = this.api.tx[params.call.section][params.call.method](
      ...params.call.args
    );

    const periodic = params.maybePeriodic
      ? ([params.maybePeriodic.period, params.maybePeriodic.count] as [
          number,
          number
        ])
      : null;

    const extrinsic = this.scheduleNamed(
      params.id,
      params.when,
      periodic,
      params.priority,
      call
    );

    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Cancel a scheduled call and wait
   * @param signer - Keyring pair
   * @param when - Block number
   * @param index - Index in agenda
   * @returns Transaction result
   */
  async cancelAndWait(
    signer: KeyringPair,
    when: number,
    index: number
  ): Promise<SchedulerTxResult> {
    const extrinsic = this.cancel(when, index);
    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Cancel a named scheduled call and wait
   * @param signer - Keyring pair
   * @param id - Schedule name/ID
   * @returns Transaction result
   */
  async cancelNamedAndWait(
    signer: KeyringPair,
    id: string
  ): Promise<SchedulerTxResult> {
    const extrinsic = this.cancelNamed(id);
    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Schedule a one-time call for a specific block
   * @param signer - Keyring pair
   * @param when - Target block number
   * @param section - Pallet name
   * @param method - Method name
   * @param args - Call arguments
   * @param priority - Priority (default 0)
   * @returns Transaction result
   */
  async scheduleOnce(
    signer: KeyringPair,
    when: number,
    section: string,
    method: string,
    args: any[],
    priority: number = 0
  ): Promise<SchedulerTxResult> {
    return this.scheduleAndWait(signer, {
      when,
      priority,
      call: { section, method, args },
    });
  }

  /**
   * Schedule a recurring call
   * @param signer - Keyring pair
   * @param id - Unique name for the schedule
   * @param startBlock - First execution block
   * @param period - Blocks between executions
   * @param count - Number of times to execute (0 = infinite)
   * @param section - Pallet name
   * @param method - Method name
   * @param args - Call arguments
   * @param priority - Priority (default 0)
   * @returns Transaction result
   */
  async scheduleRecurring(
    signer: KeyringPair,
    id: string,
    startBlock: number,
    period: number,
    count: number,
    section: string,
    method: string,
    args: any[],
    priority: number = 0
  ): Promise<SchedulerTxResult> {
    return this.scheduleNamedAndWait(signer, {
      id,
      when: startBlock,
      maybePeriodic: { period, count },
      priority,
      call: { section, method, args },
    });
  }

  // ==========================================================================
  // Query Passthrough
  // ==========================================================================

  /**
   * Get agenda for a block
   */
  async agenda(blockNumber: number) {
    return this.queries.agenda(blockNumber);
  }

  /**
   * Lookup a named schedule
   */
  async lookup(id: string) {
    return this.queries.lookup(id);
  }

  /**
   * Check if schedule exists
   */
  async hasSchedule(id: string) {
    return this.queries.hasSchedule(id);
  }

  /**
   * Get pallet constants
   */
  async getConstants() {
    return this.queries.getConstants();
  }

  /**
   * Get upcoming scheduled calls
   */
  async getUpcoming(blocksAhead?: number) {
    return this.queries.getUpcoming(blocksAhead);
  }

  /**
   * Check if pallet is available
   */
  isAvailable(): boolean {
    return this.queries.isAvailable();
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Sign and send an extrinsic
   */
  private async signAndSend(
    extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>,
    signer: KeyringPair
  ): Promise<SchedulerTxResult> {
    return new Promise((resolve, reject) => {
      extrinsic
        .signAndSend(signer, (result: ISubmittableResult) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            const blockHash = result.status.isInBlock
              ? result.status.asInBlock.toString()
              : result.status.asFinalized.toString();

            const events = result.events.map((e: any) => e.event);

            const hasError = events.some((e: any) =>
              this.api.events.system.ExtrinsicFailed.is(e)
            );

            // Extract scheduled index from events
            let index: number | undefined;
            for (const event of events) {
              if (
                this.api.events.scheduler?.Scheduled &&
                this.api.events.scheduler.Scheduled.is(event)
              ) {
                index = parseInt((event as any).data[1]?.toString() || "0", 10);
              }
            }

            resolve({
              success: !hasError,
              blockHash,
              txHash: extrinsic.hash.toString(),
              events,
              index,
            });
          }

          if (result.status.isInvalid) {
            reject(new Error("Transaction invalid"));
          }
        })
        .catch(reject);
    });
  }
}
