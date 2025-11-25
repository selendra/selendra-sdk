/**
 * XVM Pallet Storage Queries
 *
 * Query functions for Cross-VM pallet
 */

import type { ApiPromise } from "@polkadot/api";
import {
  decodeAddress,
  encodeAddress,
  blake2AsU8a,
} from "@polkadot/util-crypto";
import { hexToU8a, u8aToHex } from "@polkadot/util";
import type { XvmConstants, XvmContext } from "./types.js";

/**
 * XVM storage queries
 */
export class XvmQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get XVM pallet constants
   * @returns XVM constants
   */
  async getConstants(): Promise<XvmConstants> {
    let maxCallDepth = 32;
    let maxInputSize = 65536;

    try {
      const callDepth = (this.api.consts.xvm as any)?.maxCallDepth;
      if (callDepth) {
        maxCallDepth = parseInt(callDepth.toString(), 10);
      }
    } catch {
      // Use default
    }

    try {
      const inputSize = (this.api.consts.xvm as any)?.maxInputSize;
      if (inputSize) {
        maxInputSize = parseInt(inputSize.toString(), 10);
      }
    } catch {
      // Use default
    }

    return {
      maxCallDepth,
      maxInputSize,
    };
  }

  /**
   * Check if XVM pallet is available
   * @returns True if XVM pallet exists
   */
  isAvailable(): boolean {
    return !!(this.api.tx.xvm && this.api.tx.xvm.call);
  }

  /**
   * Validate XVM call parameters
   * @param context - VM context
   * @param target - Target address
   * @param input - Input data
   * @returns Validation result
   */
  async validateCall(
    context: XvmContext,
    target: string,
    input: Uint8Array | string
  ): Promise<{ valid: boolean; error?: string }> {
    const constants = await this.getConstants();

    // Check input size
    const inputBytes =
      typeof input === "string"
        ? input.startsWith("0x")
          ? (input.length - 2) / 2
          : input.length / 2
        : input.length;

    if (inputBytes > constants.maxInputSize) {
      return {
        valid: false,
        error: `Input size ${inputBytes} exceeds maximum ${constants.maxInputSize}`,
      };
    }

    // Validate target address format
    if (context === "Evm") {
      if (!target.startsWith("0x") || target.length !== 42) {
        return {
          valid: false,
          error: "EVM target must be a valid 20-byte hex address (0x...)",
        };
      }
    }

    return { valid: true };
  }

  /**
   * Convert Substrate address to EVM address (H160)
   * @param substrateAddress - SS58 address
   * @returns EVM address (0x...)
   */
  substrateToEvmAddress(substrateAddress: string): string {
    const publicKey = decodeAddress(substrateAddress);
    // Take first 20 bytes of the public key
    const evmBytes = publicKey.slice(0, 20);
    return "0x" + u8aToHex(evmBytes).slice(2);
  }

  /**
   * Convert EVM address to Substrate address
   * @param evmAddress - EVM address (0x...)
   * @param ss58Prefix - SS58 prefix (default 204 for Selendra)
   * @returns SS58 address
   */
  evmToSubstrateAddress(evmAddress: string, ss58Prefix: number = 204): string {
    // Convert EVM address to bytes
    const evmBytes = hexToU8a(evmAddress);

    // Hash the EVM address with blake2_256
    const hashedAddress = blake2AsU8a(evmBytes, 256);

    return encodeAddress(hashedAddress, ss58Prefix);
  }

  /**
   * Encode function call for EVM
   * @param selector - Function selector (4 bytes hex)
   * @param args - ABI-encoded arguments (hex string or Uint8Array)
   * @returns Full calldata as Uint8Array
   */
  encodeEvmCall(
    selector: string,
    args: Uint8Array | string = "0x"
  ): Uint8Array {
    const selectorBytes = hexToU8a(
      selector.startsWith("0x") ? selector : "0x" + selector
    );

    let argsBytes: Uint8Array;
    if (typeof args === "string") {
      argsBytes = hexToU8a(args.startsWith("0x") ? args : "0x" + args);
    } else {
      argsBytes = args;
    }

    // Combine selector and args
    const result = new Uint8Array(selectorBytes.length + argsBytes.length);
    result.set(selectorBytes, 0);
    result.set(argsBytes, selectorBytes.length);

    return result;
  }

  /**
   * Encode function call for WASM/ink!
   * @param selector - ink! message selector (4 bytes)
   * @param args - SCALE-encoded arguments
   * @returns Full call data as Uint8Array
   */
  encodeWasmCall(
    selector: string,
    args: Uint8Array | string = "0x"
  ): Uint8Array {
    const selectorBytes = hexToU8a(
      selector.startsWith("0x") ? selector : "0x" + selector
    );

    let argsBytes: Uint8Array;
    if (typeof args === "string") {
      argsBytes = hexToU8a(args.startsWith("0x") ? args : "0x" + args);
    } else {
      argsBytes = args;
    }

    // Combine selector and args
    const result = new Uint8Array(selectorBytes.length + argsBytes.length);
    result.set(selectorBytes, 0);
    result.set(argsBytes, selectorBytes.length);

    return result;
  }
}
