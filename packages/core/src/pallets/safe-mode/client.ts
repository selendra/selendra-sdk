/**
 * Safe Mode Pallet Client
 *
 * Transaction building and submission for emergency safe mode operations
 */

import type { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { SafeModeTxResult } from "./types.js";
import { SafeModeQueries } from "./queries.js";

/**
 * Safe mode pallet transaction manager
 */
export class SafeModeManager {
  public readonly queries: SafeModeQueries;

  constructor(private api: ApiPromise) {
    this.queries = new SafeModeQueries(api);
  }

  /**
   * Enter safe mode (requires deposit)
   * @param signer - Account to place deposit
   * @returns Transaction result
   */
  async enter(signer: KeyringPair): Promise<SafeModeTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.safeMode
        .enter()
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
            // Extract activeUntil from Entered event
            const enteredEvent = events.find(
              (e) =>
                e.event.section === "safeMode" && e.event.method === "Entered"
            );

            let activeUntil: number | undefined;
            if (enteredEvent) {
              activeUntil = parseInt(
                (enteredEvent.event.data as any)[0]?.toString() || "0",
                10
              );
            }

            resolve({
              success: true,
              blockHash: status.asFinalized.toString(),
              activeUntil,
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
   * Force enter safe mode (sudo/root only)
   * @param signer - Sudo account
   * @returns Transaction result
   */
  async forceEnter(signer: KeyringPair): Promise<SafeModeTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.safeMode
        .forceEnter()
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
            const enteredEvent = events.find(
              (e) =>
                e.event.section === "safeMode" && e.event.method === "Entered"
            );

            let activeUntil: number | undefined;
            if (enteredEvent) {
              activeUntil = parseInt(
                (enteredEvent.event.data as any)[0]?.toString() || "0",
                10
              );
            }

            resolve({
              success: true,
              blockHash: status.asFinalized.toString(),
              activeUntil,
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
   * Extend safe mode (requires deposit)
   * @param signer - Account to place deposit
   * @returns Transaction result
   */
  async extend(signer: KeyringPair): Promise<SafeModeTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.safeMode
        .extend()
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
            const extendedEvent = events.find(
              (e) =>
                e.event.section === "safeMode" && e.event.method === "Extended"
            );

            let activeUntil: number | undefined;
            if (extendedEvent) {
              activeUntil = parseInt(
                (extendedEvent.event.data as any)[0]?.toString() || "0",
                10
              );
            }

            resolve({
              success: true,
              blockHash: status.asFinalized.toString(),
              activeUntil,
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
   * Force extend safe mode (sudo/root only)
   * @param signer - Sudo account
   * @returns Transaction result
   */
  async forceExtend(signer: KeyringPair): Promise<SafeModeTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.safeMode
        .forceExtend()
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
            const extendedEvent = events.find(
              (e) =>
                e.event.section === "safeMode" && e.event.method === "Extended"
            );

            let activeUntil: number | undefined;
            if (extendedEvent) {
              activeUntil = parseInt(
                (extendedEvent.event.data as any)[0]?.toString() || "0",
                10
              );
            }

            resolve({
              success: true,
              blockHash: status.asFinalized.toString(),
              activeUntil,
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
   * Force exit safe mode (sudo/root only)
   * @param signer - Sudo account
   * @returns Transaction result
   */
  async forceExit(signer: KeyringPair): Promise<SafeModeTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.safeMode
        .forceExit()
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
   * Build unsigned enter transaction
   * @returns Unsigned transaction
   */
  buildEnter(): ReturnType<ApiPromise["tx"]["safeMode"]["enter"]> {
    return this.api.tx.safeMode.enter();
  }

  /**
   * Build unsigned force enter transaction
   * @returns Unsigned transaction
   */
  buildForceEnter(): ReturnType<ApiPromise["tx"]["safeMode"]["forceEnter"]> {
    return this.api.tx.safeMode.forceEnter();
  }

  /**
   * Build unsigned extend transaction
   * @returns Unsigned transaction
   */
  buildExtend(): ReturnType<ApiPromise["tx"]["safeMode"]["extend"]> {
    return this.api.tx.safeMode.extend();
  }

  /**
   * Build unsigned force extend transaction
   * @returns Unsigned transaction
   */
  buildForceExtend(): ReturnType<ApiPromise["tx"]["safeMode"]["forceExtend"]> {
    return this.api.tx.safeMode.forceExtend();
  }

  /**
   * Build unsigned force exit transaction
   * @returns Unsigned transaction
   */
  buildForceExit(): ReturnType<ApiPromise["tx"]["safeMode"]["forceExit"]> {
    return this.api.tx.safeMode.forceExit();
  }
}
