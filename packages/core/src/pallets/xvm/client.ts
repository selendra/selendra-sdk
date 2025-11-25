/**
 * XVM Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for Cross-VM calls
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type {
  XvmContext,
  XvmCallParams,
  XvmTxResult,
  EvmToWasmParams,
  WasmToEvmParams,
} from "./types.js";
import { XvmQueries } from "./queries.js";

/**
 * XVM Manager - handles Cross-VM call operations
 */
export class XvmManager {
  private queries: XvmQueries;

  constructor(private api: ApiPromise) {
    this.queries = new XvmQueries(api);
  }

  // ==========================================================================
  // Core XVM Extrinsics
  // ==========================================================================

  /**
   * Make a cross-VM call
   * @param context - Target VM context (EVM or WASM)
   * @param to - Target contract address
   * @param input - Call input data
   * @param value - Value to transfer
   * @param metadata - Optional metadata
   * @returns Submittable extrinsic
   */
  call(
    context: XvmContext,
    to: string,
    input: Uint8Array | string,
    value: bigint = BigInt(0),
    metadata: Uint8Array | string = "0x"
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    // Convert context to the format expected by the runtime
    const contextEncoded = context === "Evm" ? { Evm: null } : { Wasm: null };

    return this.api.tx.xvm.call(
      contextEncoded,
      to,
      input,
      value.toString(),
      metadata
    );
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Make a cross-VM call and wait for confirmation
   * @param signer - Keyring pair
   * @param params - Call parameters
   * @returns Transaction result
   */
  async callAndWait(
    signer: KeyringPair,
    params: XvmCallParams
  ): Promise<XvmTxResult> {
    // Validate the call first
    const validation = await this.queries.validateCall(
      params.context,
      params.to,
      params.input
    );

    if (!validation.valid) {
      return {
        success: false,
        blockHash: "",
        txHash: "",
        events: [],
        returnData: undefined,
      };
    }

    const extrinsic = this.call(
      params.context,
      params.to,
      params.input,
      params.value,
      params.metadata
    );

    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Call EVM contract from Substrate
   * @param signer - Keyring pair
   * @param evmContract - EVM contract address
   * @param calldata - Function calldata
   * @param value - Value to transfer
   * @param gasLimit - Gas limit (optional)
   * @returns Transaction result
   */
  async callEvmContract(
    signer: KeyringPair,
    evmContract: string,
    calldata: Uint8Array | string,
    value: bigint = BigInt(0)
  ): Promise<XvmTxResult> {
    return this.callAndWait(signer, {
      context: "Evm" as XvmContext,
      to: evmContract,
      input: calldata,
      value,
    });
  }

  /**
   * Call WASM/ink! contract from EVM context
   * @param signer - Keyring pair
   * @param wasmContract - WASM contract address (SS58)
   * @param selector - ink! message selector
   * @param args - Encoded arguments
   * @param value - Value to transfer
   * @returns Transaction result
   */
  async callWasmContract(
    signer: KeyringPair,
    wasmContract: string,
    selector: string,
    args: Uint8Array | string = "0x",
    value: bigint = BigInt(0)
  ): Promise<XvmTxResult> {
    const calldata = this.queries.encodeWasmCall(selector, args);

    return this.callAndWait(signer, {
      context: "Wasm" as XvmContext,
      to: wasmContract,
      input: calldata,
      value,
    });
  }

  /**
   * Execute EVM to WASM call
   * @param signer - Keyring pair
   * @param params - EVM to WASM parameters
   * @returns Transaction result
   */
  async evmToWasm(
    signer: KeyringPair,
    params: EvmToWasmParams
  ): Promise<XvmTxResult> {
    const calldata = this.queries.encodeWasmCall(params.selector, params.args);

    return this.callAndWait(signer, {
      context: "Wasm" as XvmContext,
      to: params.wasmContract,
      input: calldata,
      value: params.value,
    });
  }

  /**
   * Execute WASM to EVM call
   * @param signer - Keyring pair
   * @param params - WASM to EVM parameters
   * @returns Transaction result
   */
  async wasmToEvm(
    signer: KeyringPair,
    params: WasmToEvmParams
  ): Promise<XvmTxResult> {
    return this.callAndWait(signer, {
      context: "Evm" as XvmContext,
      to: params.evmContract,
      input: params.calldata,
      value: params.value,
    });
  }

  /**
   * Build EVM call with function selector and arguments
   * @param selector - Function selector (4 bytes)
   * @param args - ABI-encoded arguments
   * @returns Full calldata
   */
  buildEvmCall(selector: string, args: Uint8Array | string = "0x"): Uint8Array {
    return this.queries.encodeEvmCall(selector, args);
  }

  /**
   * Build WASM/ink! call with message selector and arguments
   * @param selector - Message selector (4 bytes)
   * @param args - SCALE-encoded arguments
   * @returns Full calldata
   */
  buildWasmCall(
    selector: string,
    args: Uint8Array | string = "0x"
  ): Uint8Array {
    return this.queries.encodeWasmCall(selector, args);
  }

  // ==========================================================================
  // Address Conversion Helpers
  // ==========================================================================

  /**
   * Convert Substrate address to EVM format
   * @param substrateAddress - SS58 address
   * @returns EVM address
   */
  substrateToEvmAddress(substrateAddress: string): string {
    return this.queries.substrateToEvmAddress(substrateAddress);
  }

  /**
   * Convert EVM address to Substrate format
   * @param evmAddress - EVM address
   * @param ss58Prefix - SS58 prefix
   * @returns SS58 address
   */
  evmToSubstrateAddress(evmAddress: string, ss58Prefix: number = 204): string {
    return this.queries.evmToSubstrateAddress(evmAddress, ss58Prefix);
  }

  // ==========================================================================
  // Query Passthrough
  // ==========================================================================

  /**
   * Check if XVM is available
   */
  isAvailable(): boolean {
    return this.queries.isAvailable();
  }

  /**
   * Get XVM constants
   */
  async getConstants() {
    return this.queries.getConstants();
  }

  /**
   * Validate XVM call parameters
   */
  async validateCall(
    context: XvmContext,
    target: string,
    input: Uint8Array | string
  ) {
    return this.queries.validateCall(context, target, input);
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
  ): Promise<XvmTxResult> {
    return new Promise((resolve, reject) => {
      extrinsic
        .signAndSend(signer, (result: ISubmittableResult) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            const blockHash = result.status.isInBlock
              ? result.status.asInBlock.toString()
              : result.status.asFinalized.toString();

            const events = result.events.map((e) => e.event);

            // Check for errors
            const hasError = events.some((e) =>
              this.api.events.system.ExtrinsicFailed.is(e)
            );

            // Try to extract return data from XVM events
            let returnData: string | undefined;
            for (const event of events) {
              if ((event as any).section === "xvm") {
                const data = (event as any).data;
                if (data && data[0]) {
                  returnData = data[0].toHex?.() || data[0].toString();
                }
              }
            }

            resolve({
              success: !hasError,
              blockHash,
              txHash: extrinsic.hash.toString(),
              events,
              returnData,
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
