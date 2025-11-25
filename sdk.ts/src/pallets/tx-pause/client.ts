/**
 * Tx Pause Pallet Client
 *
 * Transaction building and submission for pausing transactions
 */

import type { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { TxPauseTxResult, FullTransactionName } from "./types.js";
import { TxPauseQueries } from "./queries.js";

/**
 * Tx pause pallet transaction manager
 */
export class TxPauseManager {
  public readonly queries: TxPauseQueries;

  constructor(private api: ApiPromise) {
    this.queries = new TxPauseQueries(api);
  }

  /**
   * Pause a transaction (admin only)
   * @param signer - Admin/sudo account
   * @param palletName - Pallet name
   * @param callName - Call name
   * @returns Transaction result
   */
  async pause(
    signer: KeyringPair,
    palletName: string,
    callName: string
  ): Promise<TxPauseTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.txPause
        .pause([palletName, callName])
        .signAndSend(signer, ({ status, events, dispatchError }) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = this.api.registry.findMetaError(
                dispatchError.asModule
              );
              reject(new Error(`${decoded.section}.${decoded.name}`));
            } else {
              reject(new Error(dispatchError.toString()));
            }
            return;
          }

          if (status.isFinalized) {
            resolve({
              success: true,
              blockHash: status.asFinalized.toString(),
              transaction: { palletName, callName },
              events: events.map((e) => ({
                section: e.event.section,
                method: e.event.method,
                data: e.event.data.toString(),
              })),
            });
          }
        })
        .catch(reject);
    });
  }

  /**
   * Unpause a transaction (admin only)
   * @param signer - Admin/sudo account
   * @param palletName - Pallet name
   * @param callName - Call name
   * @returns Transaction result
   */
  async unpause(
    signer: KeyringPair,
    palletName: string,
    callName: string
  ): Promise<TxPauseTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.txPause
        .unpause([palletName, callName])
        .signAndSend(signer, ({ status, events, dispatchError }) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = this.api.registry.findMetaError(
                dispatchError.asModule
              );
              reject(new Error(`${decoded.section}.${decoded.name}`));
            } else {
              reject(new Error(dispatchError.toString()));
            }
            return;
          }

          if (status.isFinalized) {
            resolve({
              success: true,
              blockHash: status.asFinalized.toString(),
              transaction: { palletName, callName },
              events: events.map((e) => ({
                section: e.event.section,
                method: e.event.method,
                data: e.event.data.toString(),
              })),
            });
          }
        })
        .catch(reject);
    });
  }

  /**
   * Pause multiple transactions in a batch
   * @param signer - Admin/sudo account
   * @param transactions - Transactions to pause
   * @returns Transaction result
   */
  async pauseBatch(
    signer: KeyringPair,
    transactions: FullTransactionName[]
  ): Promise<TxPauseTxResult> {
    const calls = transactions.map((tx) =>
      this.api.tx.txPause.pause([tx.palletName, tx.callName])
    );

    return new Promise((resolve, reject) => {
      this.api.tx.utility
        .batchAll(calls)
        .signAndSend(signer, ({ status, events, dispatchError }) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = this.api.registry.findMetaError(
                dispatchError.asModule
              );
              reject(new Error(`${decoded.section}.${decoded.name}`));
            } else {
              reject(new Error(dispatchError.toString()));
            }
            return;
          }

          if (status.isFinalized) {
            resolve({
              success: true,
              blockHash: status.asFinalized.toString(),
              events: events.map((e) => ({
                section: e.event.section,
                method: e.event.method,
                data: e.event.data.toString(),
              })),
            });
          }
        })
        .catch(reject);
    });
  }

  /**
   * Unpause multiple transactions in a batch
   * @param signer - Admin/sudo account
   * @param transactions - Transactions to unpause
   * @returns Transaction result
   */
  async unpauseBatch(
    signer: KeyringPair,
    transactions: FullTransactionName[]
  ): Promise<TxPauseTxResult> {
    const calls = transactions.map((tx) =>
      this.api.tx.txPause.unpause([tx.palletName, tx.callName])
    );

    return new Promise((resolve, reject) => {
      this.api.tx.utility
        .batchAll(calls)
        .signAndSend(signer, ({ status, events, dispatchError }) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = this.api.registry.findMetaError(
                dispatchError.asModule
              );
              reject(new Error(`${decoded.section}.${decoded.name}`));
            } else {
              reject(new Error(dispatchError.toString()));
            }
            return;
          }

          if (status.isFinalized) {
            resolve({
              success: true,
              blockHash: status.asFinalized.toString(),
              events: events.map((e) => ({
                section: e.event.section,
                method: e.event.method,
                data: e.event.data.toString(),
              })),
            });
          }
        })
        .catch(reject);
    });
  }

  /**
   * Build unsigned pause transaction
   * @param palletName - Pallet name
   * @param callName - Call name
   * @returns Unsigned transaction
   */
  buildPause(
    palletName: string,
    callName: string
  ): ReturnType<ApiPromise["tx"]["txPause"]["pause"]> {
    return this.api.tx.txPause.pause([palletName, callName]);
  }

  /**
   * Build unsigned unpause transaction
   * @param palletName - Pallet name
   * @param callName - Call name
   * @returns Unsigned transaction
   */
  buildUnpause(
    palletName: string,
    callName: string
  ): ReturnType<ApiPromise["tx"]["txPause"]["unpause"]> {
    return this.api.tx.txPause.unpause([palletName, callName]);
  }

  /**
   * Pause all calls in a pallet
   * @param signer - Admin/sudo account
   * @param palletName - Pallet name
   * @returns Transaction result
   */
  async pauseAllInPallet(
    signer: KeyringPair,
    palletName: string
  ): Promise<TxPauseTxResult> {
    const availableCalls = this.queries.getAvailableCalls();
    const palletCalls = availableCalls.get(palletName) || [];

    if (palletCalls.length === 0) {
      throw new Error(`No calls found for pallet: ${palletName}`);
    }

    const transactions = palletCalls.map((callName) => ({
      palletName,
      callName,
    }));

    return this.pauseBatch(signer, transactions);
  }

  /**
   * Unpause all paused transactions
   * @param signer - Admin/sudo account
   * @returns Transaction result
   */
  async unpauseAll(signer: KeyringPair): Promise<TxPauseTxResult> {
    const allPaused = await this.queries.getAllPaused();

    if (allPaused.length === 0) {
      return {
        success: true,
        events: [],
      };
    }

    return this.unpauseBatch(signer, allPaused);
  }
}
