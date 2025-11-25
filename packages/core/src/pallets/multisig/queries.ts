/**
 * Multisig Pallet Queries
 *
 * Query functions for Substrate's multisig pallet
 */

import type { ApiPromise } from "@polkadot/api";
import {
  blake2AsHex,
  encodeAddress,
  decodeAddress,
} from "@polkadot/util-crypto";
import { u8aConcat, stringToU8a, bnToU8a, u8aSorted } from "@polkadot/util";
import type {
  MultisigInfo,
  Timepoint,
  MultisigAccount,
  MultisigConstants,
  PendingMultisig,
  ApprovalStatus,
  MultisigOperationDetails,
  MultisigStatus,
} from "./types.js";

/**
 * Multisig pallet queries
 */
export class MultisigQueries {
  constructor(private api: ApiPromise) {}

  // ==========================================================================
  // Core Storage Queries
  // ==========================================================================

  /**
   * Get multisig operation info
   * @param multisigAddress - The multisig account address
   * @param callHash - Hash of the call
   * @returns Multisig info or null
   */
  async multisigs(
    multisigAddress: string,
    callHash: string
  ): Promise<MultisigInfo | null> {
    try {
      const result = await this.api.query.multisig.multisigs(
        multisigAddress,
        callHash
      );

      if (result.isNone) {
        return null;
      }

      const data = result.unwrap();
      return {
        when: {
          height: data.when.height.toNumber(),
          index: data.when.index.toNumber(),
        },
        depositor: data.depositor.toString(),
        deposit: BigInt(data.deposit.toString()),
        approvals: data.approvals.map((a: any) => a.toString()),
      };
    } catch (error) {
      console.error("Error querying multisig info:", error);
      return null;
    }
  }

  // ==========================================================================
  // Constants
  // ==========================================================================

  /**
   * Get multisig pallet constants
   */
  getConstants(): MultisigConstants {
    const depositBase = this.api.consts.multisig.depositBase;
    const depositFactor = this.api.consts.multisig.depositFactor;
    const maxSignatories = this.api.consts.multisig.maxSignatories;

    return {
      depositBase: BigInt(depositBase?.toString() ?? "0"),
      depositFactor: BigInt(depositFactor?.toString() ?? "0"),
      maxSignatories: maxSignatories?.toNumber() ?? 100,
    };
  }

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Derive multisig address from signatories and threshold
   * @param signatories - List of signatory addresses
   * @param threshold - Minimum approvals needed
   * @param ss58Prefix - SS58 prefix (default: 204 for Selendra)
   * @returns Derived multisig address
   */
  deriveMultisigAddress(
    signatories: string[],
    threshold: number,
    ss58Prefix: number = 204
  ): string {
    if (signatories.length < 2) {
      throw new Error("Multisig requires at least 2 signatories");
    }

    if (threshold < 1 || threshold > signatories.length) {
      throw new Error("Invalid threshold");
    }

    // Sort signatories by their public keys
    const pubkeys = signatories.map((addr) => decodeAddress(addr));
    const sortedPubkeys = u8aSorted(pubkeys);

    // Create the multisig address
    const prefix = stringToU8a("modlpy/teleMultiSig");
    const thresholdU8a = bnToU8a(threshold, { bitLength: 16, isLe: true });

    const payload = u8aConcat(prefix, thresholdU8a, ...sortedPubkeys);

    const hash = blake2AsHex(payload, 256);
    return encodeAddress(hash, ss58Prefix);
  }

  /**
   * Create a multisig account configuration
   * @param signatories - List of signatory addresses
   * @param threshold - Minimum approvals needed
   * @returns Multisig account configuration
   */
  createMultisigAccount(
    signatories: string[],
    threshold: number
  ): MultisigAccount {
    // Sort signatories (required for consistency)
    const sortedSignatories = [...signatories].sort();
    const address = this.deriveMultisigAddress(signatories, threshold);

    return {
      threshold,
      signatories: sortedSignatories,
      address,
    };
  }

  /**
   * Calculate deposit required for multisig call
   * @param callLength - Length of the encoded call in bytes
   * @returns Required deposit
   */
  calculateDeposit(callLength: number): bigint {
    const constants = this.getConstants();
    return constants.depositBase + constants.depositFactor * BigInt(callLength);
  }

  /**
   * Get call hash from encoded call data
   * @param callData - Encoded call data (hex string)
   * @returns Call hash
   */
  getCallHash(callData: string): string {
    return blake2AsHex(callData, 256);
  }

  // ==========================================================================
  // High-Level Queries
  // ==========================================================================

  /**
   * Get all pending multisig operations for a multisig address
   * @param multisigAddress - The multisig account address
   * @param threshold - The threshold for this multisig
   * @returns Array of pending operations
   */
  async getPendingMultisigs(
    multisigAddress: string,
    threshold: number
  ): Promise<PendingMultisig[]> {
    try {
      const entries = await this.api.query.multisig.multisigs.entries(
        multisigAddress
      );

      return entries.map(([key, value]) => {
        const callHash = key.args[1].toHex();
        const info = value.unwrap();
        const approvalCount = info.approvals.length;

        return {
          multisigAddress,
          callHash,
          info: {
            when: {
              height: info.when.height.toNumber(),
              index: info.when.index.toNumber(),
            },
            depositor: info.depositor.toString(),
            deposit: BigInt(info.deposit.toString()),
            approvals: info.approvals.map((a: any) => a.toString()),
          },
          approvalCount,
          approvalsNeeded: threshold - approvalCount,
          canExecute: approvalCount >= threshold,
        };
      });
    } catch (error) {
      console.error("Error getting pending multisigs:", error);
      return [];
    }
  }

  /**
   * Check if an account is a signatory of a pending operation
   * @param multisigAddress - The multisig account address
   * @param callHash - The call hash
   * @param account - Account to check
   * @returns Whether the account has approved
   */
  async hasApproved(
    multisigAddress: string,
    callHash: string,
    account: string
  ): Promise<boolean> {
    const info = await this.multisigs(multisigAddress, callHash);
    if (!info) {
      return false;
    }

    return info.approvals.includes(account);
  }

  /**
   * Get approval status for all signatories
   * @param multisigAddress - The multisig account address
   * @param callHash - The call hash
   * @param signatories - List of all signatories
   * @returns Approval status per signatory
   */
  async getApprovalStatuses(
    multisigAddress: string,
    callHash: string,
    signatories: string[]
  ): Promise<ApprovalStatus[]> {
    const info = await this.multisigs(multisigAddress, callHash);

    return signatories.map((signatory) => ({
      signatory,
      hasApproved: info ? info.approvals.includes(signatory) : false,
    }));
  }

  /**
   * Get detailed operation information
   * @param account - Multisig account configuration
   * @param callHash - Call hash
   * @param callerAddress - Optional caller address to check if they can approve
   * @returns Full operation details
   */
  async getOperationDetails(
    account: MultisigAccount,
    callHash: string,
    callerAddress?: string
  ): Promise<MultisigOperationDetails> {
    const info = await this.multisigs(account.address, callHash);
    const approvalStatuses = await this.getApprovalStatuses(
      account.address,
      callHash,
      account.signatories
    );

    let status: MultisigStatus = "pending";
    let canApprove = false;
    let canExecute = false;

    if (!info) {
      // No info means either new or already executed
      status = "pending";
      canApprove = callerAddress
        ? account.signatories.includes(callerAddress)
        : false;
    } else {
      const approvedCount = info.approvals.length;
      const isReady = approvedCount >= account.threshold;

      if (isReady) {
        status = "ready_to_execute";
      } else {
        status = "pending";
      }

      if (callerAddress) {
        const isSignatory = account.signatories.includes(callerAddress);
        const hasApproved = info.approvals.includes(callerAddress);

        canApprove = isSignatory && !hasApproved;
        canExecute = isSignatory && isReady && !hasApproved;
      }
    }

    return {
      account,
      callHash,
      info,
      status,
      approvalStatuses,
      canApprove,
      canExecute,
    };
  }

  /**
   * Check if an account is a valid signatory (can participate in multisig)
   * @param signatories - List of all signatories
   * @param account - Account to check
   * @returns Whether the account is a signatory
   */
  isSignatory(signatories: string[], account: string): boolean {
    return signatories.includes(account);
  }

  /**
   * Get remaining signatories (those who haven't approved yet)
   * @param multisigAddress - The multisig account address
   * @param callHash - The call hash
   * @param signatories - All signatories
   * @returns Signatories who haven't approved
   */
  async getRemainingSignatories(
    multisigAddress: string,
    callHash: string,
    signatories: string[]
  ): Promise<string[]> {
    const info = await this.multisigs(multisigAddress, callHash);
    if (!info) {
      return signatories;
    }

    return signatories.filter((s) => !info.approvals.includes(s));
  }

  /**
   * Get all multisig operations across all known multisig addresses
   * This is expensive and should be used sparingly
   * @param multisigAddresses - Known multisig addresses to check
   * @param threshold - Threshold for each (assume same for simplicity)
   * @returns All pending operations
   */
  async getAllPendingOperations(
    multisigAddresses: string[],
    threshold: number
  ): Promise<PendingMultisig[]> {
    const allPending: PendingMultisig[] = [];

    for (const address of multisigAddresses) {
      const pending = await this.getPendingMultisigs(address, threshold);
      allPending.push(...pending);
    }

    return allPending;
  }

  /**
   * Decode a call data to get section and method
   * @param callData - Encoded call data
   * @returns Decoded call info or null
   */
  decodeCall(
    callData: string
  ): { section: string; method: string; args: any } | null {
    try {
      const decoded = this.api.registry.createType("Call", callData);
      return {
        section: decoded.section,
        method: decoded.method,
        args: decoded.args.map((arg: any) => arg.toHuman()),
      };
    } catch (error) {
      console.error("Error decoding call:", error);
      return null;
    }
  }

  /**
   * Validate multisig configuration
   * @param signatories - Proposed signatories
   * @param threshold - Proposed threshold
   * @returns Validation result with any errors
   */
  validateConfig(
    signatories: string[],
    threshold: number
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const constants = this.getConstants();

    if (signatories.length < 2) {
      errors.push("At least 2 signatories required");
    }

    if (signatories.length > constants.maxSignatories) {
      errors.push(`Maximum ${constants.maxSignatories} signatories allowed`);
    }

    if (threshold < 1) {
      errors.push("Threshold must be at least 1");
    }

    if (threshold > signatories.length) {
      errors.push("Threshold cannot exceed number of signatories");
    }

    // Check for duplicates
    const uniqueSignatories = new Set(signatories);
    if (uniqueSignatories.size !== signatories.length) {
      errors.push("Duplicate signatories not allowed");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
