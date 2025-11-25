/**
 * Balances Pallet Client
 *
 * Main client for interacting with the Balances pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import { BalancesQueries } from "./queries.js";
import {
  TransferParams,
  TransferAllParams,
  ForceTransferParams,
  SetBalanceParams,
  ForceUnreserveParams,
  BalanceInfo,
  FeeEstimate,
  TransferEvent,
  BalanceSetEvent,
  ReservedEvent,
  UnreservedEvent,
  DepositEvent,
  WithdrawEvent,
} from "./types.js";

/**
 * Balances Manager - Main interface for Balances pallet
 */
export class BalancesManager {
  public queries: BalancesQueries;

  constructor(private api: ApiPromise) {
    this.queries = new BalancesQueries(api);
  }

  // ============================================================================
  // Extrinsics (Transactions)
  // ============================================================================

  /**
   * Transfer balance to another account
   * @param params - Transfer parameters
   * @returns Submittable extrinsic
   */
  transfer(
    params: TransferParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    // Use transferAllowDeath (newer API) or transfer (older API)
    const transferFn =
      this.api.tx.balances.transferAllowDeath || this.api.tx.balances.transfer;
    return transferFn(params.dest, params.value);
  }

  /**
   * Transfer balance, ensuring sender stays above existential deposit
   * @param params - Transfer parameters
   * @returns Submittable extrinsic
   */
  transferKeepAlive(
    params: TransferParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.balances.transferKeepAlive(params.dest, params.value);
  }

  /**
   * Transfer all free balance to another account
   * @param params - Transfer all parameters
   * @returns Submittable extrinsic
   */
  transferAll(
    params: TransferAllParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.balances.transferAll(params.dest, params.keepAlive);
  }

  /**
   * Force transfer from one account to another (sudo only)
   * @param params - Force transfer parameters
   * @returns Submittable extrinsic
   */
  forceTransfer(
    params: ForceTransferParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.balances.forceTransfer(
      params.source,
      params.dest,
      params.value
    );
  }

  /**
   * Force unreserve balance (sudo only)
   * @param params - Force unreserve parameters
   * @returns Submittable extrinsic
   */
  forceUnreserve(
    params: ForceUnreserveParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.balances.forceUnreserve(params.who, params.amount);
  }

  /**
   * Set balance for account (sudo only)
   * @param params - Set balance parameters
   * @returns Submittable extrinsic
   */
  setBalance(
    params: SetBalanceParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    // Use forceSetBalance (newer API) or setBalance (older API)
    const setBalanceFn =
      this.api.tx.balances.forceSetBalance || this.api.tx.balances.setBalance;
    return setBalanceFn(params.who, params.newFree, params.newReserved);
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Get complete balance information for an account
   * @param address - Account address
   * @returns Complete balance info
   */
  async getBalance(address: string): Promise<BalanceInfo> {
    const accountData = await this.queries.account(address);
    const locks = await this.queries.locks(address);

    // Calculate locked balance (max of all locks)
    const locked = locks.reduce((max, lock) => {
      return lock.amount > max ? lock.amount : max;
    }, 0n);

    // Transferable = free - max(frozen, locked)
    const frozenOrLocked =
      accountData.frozen > locked ? accountData.frozen : locked;
    const transferable =
      accountData.free > frozenOrLocked
        ? accountData.free - frozenOrLocked
        : 0n;

    return {
      free: accountData.free,
      reserved: accountData.reserved,
      frozen: accountData.frozen,
      locked,
      transferable,
      total: accountData.free + accountData.reserved,
    };
  }

  /**
   * Get locked balance
   * @param address - Account address
   * @returns Total locked balance
   */
  async getLockedBalance(address: string): Promise<bigint> {
    const locks = await this.queries.locks(address);
    return locks.reduce((max, lock) => {
      return lock.amount > max ? lock.amount : max;
    }, 0n);
  }

  /**
   * Get reserved balance
   * @param address - Account address
   * @returns Reserved balance
   */
  async getReservedBalance(address: string): Promise<bigint> {
    const accountData = await this.queries.account(address);
    return accountData.reserved;
  }

  /**
   * Get transferable balance
   * @param address - Account address
   * @returns Transferable balance
   */
  async getTransferableBalance(address: string): Promise<bigint> {
    const balanceInfo = await this.getBalance(address);
    return balanceInfo.transferable;
  }

  /**
   * Estimate transfer fee
   * @param from - Sender address
   * @param to - Recipient address
   * @param amount - Amount to transfer
   * @returns Fee estimate
   */
  async estimateTransferFee(
    from: string,
    to: string,
    amount: bigint
  ): Promise<FeeEstimate> {
    const tx = this.transfer({ dest: to, value: amount });
    const paymentInfo = await tx.paymentInfo(from);

    return {
      partialFee: BigInt(paymentInfo.partialFee.toString()),
      weight: {
        refTime: BigInt(paymentInfo.weight.refTime.toString()),
        proofSize: BigInt(paymentInfo.weight.proofSize.toString()),
      },
      class: paymentInfo.class.toString() as any,
    };
  }

  /**
   * Get existential deposit
   * @returns Existential deposit amount
   */
  async getExistentialDeposit(): Promise<bigint> {
    const ed = this.api.consts.balances.existentialDeposit;
    return BigInt(ed.toString());
  }

  /**
   * Check if account exists (has balance above ED)
   * @param address - Account address
   * @returns True if account exists
   */
  async accountExists(address: string): Promise<boolean> {
    const accountData = await this.queries.account(address);
    const ed = await this.getExistentialDeposit();
    return accountData.free >= ed;
  }

  /**
   * Calculate maximum transferable amount
   * @param from - Sender address
   * @param keepAlive - Whether to keep account alive
   * @returns Maximum transferable amount
   */
  async getMaxTransferable(
    from: string,
    keepAlive: boolean = true
  ): Promise<bigint> {
    const balanceInfo = await this.getBalance(from);

    if (!keepAlive) {
      return balanceInfo.transferable;
    }

    const ed = await this.getExistentialDeposit();
    const fee = await this.estimateTransferFee(
      from,
      from,
      balanceInfo.transferable
    );

    // Max = transferable - fee - ED (to keep alive)
    const required = fee.partialFee + ed;
    return balanceInfo.transferable > required
      ? balanceInfo.transferable - required
      : 0n;
  }

  // ============================================================================
  // Event Monitoring
  // ============================================================================

  /**
   * Subscribe to Transfer events
   * @param callback - Callback function for transfer events
   * @returns Unsubscribe function
   */
  async onTransfer(
    callback: (event: TransferEvent) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.balances.Transfer.is(event)) {
          const [from, to, amount] = event.data;
          callback({
            from: from.toString(),
            to: to.toString(),
            amount: BigInt(amount.toString()),
          });
        }
      });
    }) as any;
  }

  /**
   * Subscribe to BalanceSet events
   * @param callback - Callback function for balance set events
   * @returns Unsubscribe function
   */
  async onBalanceSet(
    callback: (event: BalanceSetEvent) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.balances.BalanceSet.is(event)) {
          const [who, free, reserved] = event.data;
          callback({
            who: who.toString(),
            free: BigInt(free.toString()),
            reserved: BigInt(reserved.toString()),
          });
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Reserved events
   * @param callback - Callback function for reserved events
   * @returns Unsubscribe function
   */
  async onReserved(
    callback: (event: ReservedEvent) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.balances.Reserved.is(event)) {
          const [who, amount] = event.data;
          callback({
            who: who.toString(),
            amount: BigInt(amount.toString()),
          });
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Unreserved events
   * @param callback - Callback function for unreserved events
   * @returns Unsubscribe function
   */
  async onUnreserved(
    callback: (event: UnreservedEvent) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.balances.Unreserved.is(event)) {
          const [who, amount] = event.data;
          callback({
            who: who.toString(),
            amount: BigInt(amount.toString()),
          });
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Deposit events
   * @param callback - Callback function for deposit events
   * @returns Unsubscribe function
   */
  async onDeposit(
    callback: (event: DepositEvent) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.balances.Deposit.is(event)) {
          const [who, amount] = event.data;
          callback({
            who: who.toString(),
            amount: BigInt(amount.toString()),
          });
        }
      });
    }) as any;
  }

  /**
   * Subscribe to Withdraw events
   * @param callback - Callback function for withdraw events
   * @returns Unsubscribe function
   */
  async onWithdraw(
    callback: (event: WithdrawEvent) => void
  ): Promise<() => void> {
    return this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        if (this.api.events.balances.Withdraw.is(event)) {
          const [who, amount] = event.data;
          callback({
            who: who.toString(),
            amount: BigInt(amount.toString()),
          });
        }
      });
    }) as any;
  }
}
