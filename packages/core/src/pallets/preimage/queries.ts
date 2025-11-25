/**
 * Preimage Pallet Storage Queries
 *
 * Query functions for stored preimages
 */

import type { ApiPromise } from "@polkadot/api";
import { blake2AsHex } from "@polkadot/util-crypto";
import type { PreimageInfo, PreimageData, PreimageConstants } from "./types.js";

/**
 * Preimage storage queries
 */
export class PreimageQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get preimage status for a hash
   * @param hash - Preimage hash
   * @returns Preimage info
   */
  async statusFor(hash: string): Promise<PreimageInfo> {
    try {
      const result = await this.api.query.preimage.statusFor(hash);

      if (!result || (result as any).isNone) {
        return {
          hash,
          status: "Unknown",
        };
      }

      const status = (result as any).unwrap ? (result as any).unwrap() : result;

      if (status.isUnrequested) {
        const unrequested = status.asUnrequested;
        return {
          hash,
          status: "Unrequested",
          length: parseInt(unrequested.len?.toString() || "0", 10),
          deposit: unrequested.ticket
            ? {
                account: unrequested.ticket[0]?.toString() || "",
                amount: BigInt(unrequested.ticket[1]?.toString() || "0"),
              }
            : undefined,
        };
      } else if (status.isRequested) {
        const requested = status.asRequested;
        return {
          hash,
          status: "Requested",
          length: requested.maybeLen
            ? parseInt(requested.maybeLen.toString(), 10)
            : undefined,
          requestCount: parseInt(requested.count?.toString() || "1", 10),
          deposit: requested.maybeTicket
            ? {
                account: requested.maybeTicket[0]?.toString() || "",
                amount: BigInt(requested.maybeTicket[1]?.toString() || "0"),
              }
            : undefined,
        };
      }

      return {
        hash,
        status: "Unknown",
      };
    } catch {
      return {
        hash,
        status: "Unknown",
      };
    }
  }

  /**
   * Get preimage data for a hash
   * @param hash - Preimage hash
   * @param len - Known length (optional, improves lookup)
   * @returns Preimage data or null
   */
  async preimageFor(hash: string, len?: number): Promise<PreimageData | null> {
    try {
      let result;

      if (len !== undefined) {
        // Use bounded fetch if length is known
        result = await this.api.query.preimage.preimageFor([hash, len]);
      } else {
        // Try to get status first to find length
        const status = await this.statusFor(hash);
        if (status.length) {
          result = await this.api.query.preimage.preimageFor([
            hash,
            status.length,
          ]);
        } else {
          // Try common lengths
          for (const tryLen of [32, 64, 128, 256, 512, 1024, 2048, 4096]) {
            result = await this.api.query.preimage.preimageFor([hash, tryLen]);
            if (result && !(result as any).isNone) {
              break;
            }
          }
        }
      }

      if (!result || (result as any).isNone) {
        return null;
      }

      const data = (result as any).unwrap ? (result as any).unwrap() : result;

      const bytes = data.toU8a ? data.toU8a() : new Uint8Array(data);

      return {
        hash,
        data: bytes,
        length: bytes.length,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if a preimage exists
   * @param hash - Preimage hash
   * @returns True if preimage exists
   */
  async hasPreimage(hash: string): Promise<boolean> {
    const status = await this.statusFor(hash);
    return status.status !== "Unknown";
  }

  /**
   * Get pallet constants
   * @returns Preimage constants
   */
  async getConstants(): Promise<PreimageConstants> {
    let baseDeposit = BigInt("0");
    let byteDeposit = BigInt("0");

    try {
      const base = this.api.consts.preimage?.baseDeposit;
      if (base) {
        baseDeposit = BigInt(base.toString());
      }
    } catch {
      // Use default
    }

    try {
      const perByte = this.api.consts.preimage?.byteDeposit;
      if (perByte) {
        byteDeposit = BigInt(perByte.toString());
      }
    } catch {
      // Use default
    }

    return {
      baseDeposit,
      byteDeposit,
    };
  }

  /**
   * Calculate deposit required for a preimage
   * @param bytes - Preimage size in bytes
   * @returns Required deposit
   */
  async calculateDeposit(bytes: number): Promise<bigint> {
    const constants = await this.getConstants();
    return constants.baseDeposit + constants.byteDeposit * BigInt(bytes);
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
   * Check if pallet is available
   * @returns True if available
   */
  isAvailable(): boolean {
    return !!(this.api.query.preimage && this.api.tx.preimage);
  }

  /**
   * Get all stored preimage hashes
   * @param limit - Maximum number to return
   * @returns List of preimage hashes
   */
  async getAllPreimages(limit: number = 100): Promise<string[]> {
    const hashes: string[] = [];

    try {
      const entries = await this.api.query.preimage.statusFor.entries();

      for (const [key] of entries) {
        if (hashes.length >= limit) break;
        const hash = key.args[0]?.toHex() || key.args[0]?.toString();
        if (hash) {
          hashes.push(hash);
        }
      }
    } catch {
      // Storage iteration may not be available
    }

    return hashes;
  }
}
