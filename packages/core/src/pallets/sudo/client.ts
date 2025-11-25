/**
 * Sudo Pallet Client
 *
 * Transaction building and submission for superuser operations
 */

import type { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { SudoTxResult } from "./types.js";
import { SudoQueries } from "./queries.js";

/**
 * Sudo pallet transaction manager
 */
export class SudoManager {
  public readonly queries: SudoQueries;

  constructor(private api: ApiPromise) {
    this.queries = new SudoQueries(api);
  }

  /**
   * Execute a call as sudo
   * @param signer - Sudo account
   * @param call - Call to execute
   * @returns Transaction result
   */
  async sudo(
    signer: KeyringPair,
    call: ReturnType<ApiPromise["tx"]["system"]["remark"]>
  ): Promise<SudoTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.sudo
        .sudo(call)
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
            // Check for Sudid event to get result
            const sudidEvent = events.find(
              (e) => e.event.section === "sudo" && e.event.method === "Sudid"
            );

            let sudoResult: { ok: boolean; error?: string } | undefined;
            if (sudidEvent) {
              const result = (sudidEvent.event.data as any)[0];
              if (result.isOk) {
                sudoResult = { ok: true };
              } else {
                sudoResult = {
                  ok: false,
                  error: result.asErr?.toString() || "Unknown error",
                };
              }
            }

            resolve({
              success: true,
              blockHash: status.asFinalized.toString(),
              sudoResult,
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
   * Execute a call as sudo with custom weight
   * @param signer - Sudo account
   * @param call - Call to execute
   * @param weight - Custom weight
   * @returns Transaction result
   */
  async sudoUncheckedWeight(
    signer: KeyringPair,
    call: ReturnType<ApiPromise["tx"]["system"]["remark"]>,
    weight: { refTime: bigint; proofSize: bigint }
  ): Promise<SudoTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.sudo
        .sudoUncheckedWeight(call, weight)
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
            const sudidEvent = events.find(
              (e) => e.event.section === "sudo" && e.event.method === "Sudid"
            );

            let sudoResult: { ok: boolean; error?: string } | undefined;
            if (sudidEvent) {
              const result = (sudidEvent.event.data as any)[0];
              sudoResult = result.isOk
                ? { ok: true }
                : { ok: false, error: result.asErr?.toString() };
            }

            resolve({
              success: true,
              blockHash: status.asFinalized.toString(),
              sudoResult,
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
   * Change the sudo key
   * @param signer - Current sudo account
   * @param newKey - New sudo account address
   * @returns Transaction result
   */
  async setKey(signer: KeyringPair, newKey: string): Promise<SudoTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.sudo
        .setKey(newKey)
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
   * Execute a call as another account (via sudo)
   * @param signer - Sudo account
   * @param who - Account to dispatch as
   * @param call - Call to execute
   * @returns Transaction result
   */
  async sudoAs(
    signer: KeyringPair,
    who: string,
    call: ReturnType<ApiPromise["tx"]["system"]["remark"]>
  ): Promise<SudoTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.sudo
        .sudoAs(who, call)
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
            const sudoAsDoneEvent = events.find(
              (e) =>
                e.event.section === "sudo" && e.event.method === "SudoAsDone"
            );

            let sudoResult: { ok: boolean; error?: string } | undefined;
            if (sudoAsDoneEvent) {
              const result = (sudoAsDoneEvent.event.data as any)[0];
              sudoResult = result.isOk
                ? { ok: true }
                : { ok: false, error: result.asErr?.toString() };
            }

            resolve({
              success: true,
              blockHash: status.asFinalized.toString(),
              sudoResult,
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
   * Build unsigned sudo call
   * @param call - Call to wrap
   * @returns Unsigned sudo transaction
   */
  buildSudo(
    call: ReturnType<ApiPromise["tx"]["system"]["remark"]>
  ): ReturnType<ApiPromise["tx"]["sudo"]["sudo"]> {
    return this.api.tx.sudo.sudo(call);
  }

  /**
   * Build unsigned sudo unchecked weight call
   * @param call - Call to wrap
   * @param weight - Custom weight
   * @returns Unsigned transaction
   */
  buildSudoUncheckedWeight(
    call: ReturnType<ApiPromise["tx"]["system"]["remark"]>,
    weight: { refTime: bigint; proofSize: bigint }
  ): ReturnType<ApiPromise["tx"]["sudo"]["sudoUncheckedWeight"]> {
    return this.api.tx.sudo.sudoUncheckedWeight(call, weight);
  }

  /**
   * Build unsigned set key transaction
   * @param newKey - New sudo key
   * @returns Unsigned transaction
   */
  buildSetKey(newKey: string): ReturnType<ApiPromise["tx"]["sudo"]["setKey"]> {
    return this.api.tx.sudo.setKey(newKey);
  }

  /**
   * Build unsigned sudo as transaction
   * @param who - Account to dispatch as
   * @param call - Call to execute
   * @returns Unsigned transaction
   */
  buildSudoAs(
    who: string,
    call: ReturnType<ApiPromise["tx"]["system"]["remark"]>
  ): ReturnType<ApiPromise["tx"]["sudo"]["sudoAs"]> {
    return this.api.tx.sudo.sudoAs(who, call);
  }

  /**
   * Verify caller is sudo before executing
   * @param signer - Account to verify
   * @returns True if signer is sudo
   */
  async verifySudo(signer: KeyringPair): Promise<boolean> {
    return this.queries.isSudoKey(signer.address);
  }
}
