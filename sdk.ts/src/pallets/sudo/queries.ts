/**
 * Sudo Pallet Storage Queries
 *
 * Query functions for sudo state
 */

import type { ApiPromise } from "@polkadot/api";
import type { SudoKey } from "./types.js";

/**
 * Sudo storage queries
 */
export class SudoQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get the current sudo key
   * @returns Sudo key info
   */
  async key(): Promise<SudoKey> {
    try {
      const result = await this.api.query.sudo.key();

      if (!result || (result as any).isNone) {
        return {
          account: "",
          isSet: false,
        };
      }

      const account = (result as any).unwrap
        ? (result as any).unwrap().toString()
        : result.toString();

      return {
        account,
        isSet: true,
      };
    } catch {
      return {
        account: "",
        isSet: false,
      };
    }
  }

  /**
   * Check if an account is the sudo key
   * @param account - Account to check
   * @returns True if account is sudo
   */
  async isSudoKey(account: string): Promise<boolean> {
    const key = await this.key();
    return key.isSet && key.account === account;
  }

  /**
   * Check if pallet is available
   * @returns True if available
   */
  isAvailable(): boolean {
    return !!(this.api.query.sudo && this.api.tx.sudo);
  }

  /**
   * Check if sudo key is set
   * @returns True if set
   */
  async hasSudoKey(): Promise<boolean> {
    const key = await this.key();
    return key.isSet;
  }
}
