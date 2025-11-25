/**
 * Preimage Pallet Client
 *
 * Transaction building and submission for preimage management
 */

import type { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import { blake2AsHex } from "@polkadot/util-crypto";
import type { PreimageTxResult, PreimageInfo } from "./types.js";
import { PreimageQueries } from "./queries.js";

/**
 * Preimage transaction manager
 */
export class PreimageManager {
  public readonly queries: PreimageQueries;

  constructor(private api: ApiPromise) {
    this.queries = new PreimageQueries(api);
  }

  /**
   * Register a preimage on-chain
   * @param signer - Account to pay deposit
   * @param bytes - Preimage data
   * @returns Transaction result
   */
  async notePreimage(
    signer: KeyringPair,
    bytes: Uint8Array | string
  ): Promise<PreimageTxResult> {
    const data =
      typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
    const hash = blake2AsHex(data, 256);

    return new Promise((resolve, reject) => {
      this.api.tx.preimage
        .notePreimage(data)
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
              preimageHash: hash,
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
   * Clear a preimage from storage
   * @param signer - Account that registered the preimage
   * @param hash - Preimage hash
   * @returns Transaction result
   */
  async unnotePreimage(
    signer: KeyringPair,
    hash: string
  ): Promise<PreimageTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.preimage
        .unnotePreimage(hash)
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
              preimageHash: hash,
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
   * Request a preimage to be uploaded
   * @param signer - Account making the request
   * @param hash - Preimage hash to request
   * @returns Transaction result
   */
  async requestPreimage(
    signer: KeyringPair,
    hash: string
  ): Promise<PreimageTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.preimage
        .requestPreimage(hash)
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
              preimageHash: hash,
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
   * Cancel a preimage request
   * @param signer - Account that made the request
   * @param hash - Preimage hash to unrequest
   * @returns Transaction result
   */
  async unrequestPreimage(
    signer: KeyringPair,
    hash: string
  ): Promise<PreimageTxResult> {
    return new Promise((resolve, reject) => {
      this.api.tx.preimage
        .unrequestPreimage(hash)
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
              preimageHash: hash,
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
   * Ensure a preimage is available on-chain
   * @param signer - Account to pay deposit if needed
   * @param bytes - Preimage data
   * @returns Hash and info
   */
  async ensurePreimage(
    signer: KeyringPair,
    bytes: Uint8Array | string
  ): Promise<{ hash: string; info: PreimageInfo; uploaded: boolean }> {
    const data =
      typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
    const hash = blake2AsHex(data, 256);

    const info = await this.queries.statusFor(hash);

    if (info.status !== "Unknown") {
      return { hash, info, uploaded: false };
    }

    await this.notePreimage(signer, data);
    const updatedInfo = await this.queries.statusFor(hash);

    return { hash, info: updatedInfo, uploaded: true };
  }

  /**
   * Note preimage from encoded call
   * @param signer - Account to pay deposit
   * @param call - Runtime call to encode and store
   * @returns Transaction result with hash
   */
  async notePreimageFromCall(
    signer: KeyringPair,
    call: ReturnType<ApiPromise["tx"]["system"]["remark"]>
  ): Promise<PreimageTxResult> {
    const encoded = call.method.toU8a();
    return this.notePreimage(signer, encoded);
  }

  /**
   * Build unsigned note preimage transaction
   * @param bytes - Preimage data
   * @returns Unsigned transaction
   */
  buildNotePreimage(
    bytes: Uint8Array | string
  ): ReturnType<ApiPromise["tx"]["preimage"]["notePreimage"]> {
    const data =
      typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
    return this.api.tx.preimage.notePreimage(data);
  }

  /**
   * Build unsigned unnote preimage transaction
   * @param hash - Preimage hash
   * @returns Unsigned transaction
   */
  buildUnnotePreimage(
    hash: string
  ): ReturnType<ApiPromise["tx"]["preimage"]["unnotePreimage"]> {
    return this.api.tx.preimage.unnotePreimage(hash);
  }

  /**
   * Build unsigned request preimage transaction
   * @param hash - Preimage hash
   * @returns Unsigned transaction
   */
  buildRequestPreimage(
    hash: string
  ): ReturnType<ApiPromise["tx"]["preimage"]["requestPreimage"]> {
    return this.api.tx.preimage.requestPreimage(hash);
  }

  /**
   * Build unsigned unrequest preimage transaction
   * @param hash - Preimage hash
   * @returns Unsigned transaction
   */
  buildUnrequestPreimage(
    hash: string
  ): ReturnType<ApiPromise["tx"]["preimage"]["unrequestPreimage"]> {
    return this.api.tx.preimage.unrequestPreimage(hash);
  }

  /**
   * Hash data to get preimage hash
   * @param data - Data to hash
   * @returns Blake2-256 hash
   */
  hashPreimage(data: Uint8Array | string): string {
    return blake2AsHex(data, 256);
  }

  /**
   * Calculate the hash of an encoded call
   * @param call - Runtime call
   * @returns Blake2-256 hash
   */
  hashCall(call: ReturnType<ApiPromise["tx"]["system"]["remark"]>): string {
    return blake2AsHex(call.method.toU8a(), 256);
  }
}
