/**
 * Multisig Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for Substrate's multisig pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type { Signer } from "@polkadot/api/types";
import type {
  MultisigInfo,
  Timepoint,
  MultisigAccount,
  MultisigConstants,
  MultisigResult,
  PendingMultisig,
} from "./types.js";
import { MultisigQueries } from "./queries.js";

/**
 * Transaction result type
 */
export interface MultisigTxResult {
  /** Whether the transaction was successful */
  success: boolean;
  /** Transaction hash */
  txHash?: string;
  /** Block hash where tx was included */
  blockHash?: string;
  /** Error message if failed */
  error?: string;
  /** Events emitted */
  events?: any[];
  /** Call hash of the multisig operation */
  callHash?: string;
  /** Timepoint of the operation */
  timepoint?: Timepoint;
  /** Whether the final call was executed */
  executed?: boolean;
}

/**
 * Multisig Manager - handles multisig pallet transactions
 */
export class MultisigManager {
  private queries: MultisigQueries;

  constructor(private api: ApiPromise) {
    this.queries = new MultisigQueries(api);
  }

  // ==========================================================================
  // Core Multisig Extrinsics
  // ==========================================================================

  /**
   * Initiate or approve a multisig operation
   * Use this for threshold > 1 multisigs
   * @param threshold - Threshold of the multisig
   * @param otherSignatories - Other signatories (excluding caller)
   * @param maybeTimepoint - Timepoint if this is an approval (null for initiation)
   * @param call - The call to execute
   * @param maxWeight - Maximum weight for the call
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async asMulti(
    threshold: number,
    otherSignatories: string[],
    maybeTimepoint: Timepoint | null,
    call: string | any,
    maxWeight: { refTime: bigint; proofSize: bigint },
    signer: Signer,
    signerAddress: string
  ): Promise<MultisigTxResult> {
    try {
      // Sort other signatories
      const sortedOthers = [...otherSignatories].sort();

      const tx = this.api.tx.multisig.asMulti(
        threshold,
        sortedOthers,
        maybeTimepoint,
        call,
        maxWeight
      );

      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute a call as threshold 1 multisig (single approval)
   * Use this for threshold = 1 multisigs
   * @param otherSignatories - Other signatories (excluding caller)
   * @param call - The call to execute
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async asMultiThreshold1(
    otherSignatories: string[],
    call: string | any,
    signer: Signer,
    signerAddress: string
  ): Promise<MultisigTxResult> {
    try {
      // Sort other signatories
      const sortedOthers = [...otherSignatories].sort();

      const tx = this.api.tx.multisig.asMultiThreshold1(sortedOthers, call);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Approve a multisig operation (without storing/executing the call)
   * More gas efficient for intermediate approvals
   * @param threshold - Threshold of the multisig
   * @param otherSignatories - Other signatories (excluding caller)
   * @param maybeTimepoint - Timepoint if this is an approval (null for initiation)
   * @param callHash - Hash of the call to approve
   * @param maxWeight - Maximum weight for the call
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async approveAsMulti(
    threshold: number,
    otherSignatories: string[],
    maybeTimepoint: Timepoint | null,
    callHash: string,
    maxWeight: { refTime: bigint; proofSize: bigint },
    signer: Signer,
    signerAddress: string
  ): Promise<MultisigTxResult> {
    try {
      // Sort other signatories
      const sortedOthers = [...otherSignatories].sort();

      const tx = this.api.tx.multisig.approveAsMulti(
        threshold,
        sortedOthers,
        maybeTimepoint,
        callHash,
        maxWeight
      );

      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Cancel a pending multisig operation
   * Can only be called by the depositor
   * @param threshold - Threshold of the multisig
   * @param otherSignatories - Other signatories (excluding caller)
   * @param timepoint - Timepoint when the operation was initiated
   * @param callHash - Hash of the call to cancel
   * @param signer - Account signer (must be depositor)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async cancelAsMulti(
    threshold: number,
    otherSignatories: string[],
    timepoint: Timepoint,
    callHash: string,
    signer: Signer,
    signerAddress: string
  ): Promise<MultisigTxResult> {
    try {
      // Sort other signatories
      const sortedOthers = [...otherSignatories].sort();

      const tx = this.api.tx.multisig.cancelAsMulti(
        threshold,
        sortedOthers,
        timepoint,
        callHash
      );

      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Initiate a new multisig call
   * @param account - Multisig account configuration
   * @param call - The call to execute
   * @param maxWeight - Maximum weight
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async initiateMultisig(
    account: MultisigAccount,
    call: string | any,
    maxWeight: { refTime: bigint; proofSize: bigint },
    signer: Signer,
    signerAddress: string
  ): Promise<MultisigTxResult> {
    // Get other signatories (excluding caller)
    const otherSignatories = account.signatories.filter(
      (s) => s !== signerAddress
    );

    if (account.threshold === 1) {
      return this.asMultiThreshold1(
        otherSignatories,
        call,
        signer,
        signerAddress
      );
    }

    return this.asMulti(
      account.threshold,
      otherSignatories,
      null, // null timepoint for initiation
      call,
      maxWeight,
      signer,
      signerAddress
    );
  }

  /**
   * Approve an existing multisig call
   * @param account - Multisig account configuration
   * @param timepoint - Timepoint of the pending operation
   * @param callHash - Hash of the call to approve
   * @param maxWeight - Maximum weight
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async approveMultisig(
    account: MultisigAccount,
    timepoint: Timepoint,
    callHash: string,
    maxWeight: { refTime: bigint; proofSize: bigint },
    signer: Signer,
    signerAddress: string
  ): Promise<MultisigTxResult> {
    const otherSignatories = account.signatories.filter(
      (s) => s !== signerAddress
    );

    return this.approveAsMulti(
      account.threshold,
      otherSignatories,
      timepoint,
      callHash,
      maxWeight,
      signer,
      signerAddress
    );
  }

  /**
   * Execute a multisig call (final approval with call data)
   * @param account - Multisig account configuration
   * @param timepoint - Timepoint of the pending operation
   * @param call - The full call data
   * @param maxWeight - Maximum weight
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async executeMultisig(
    account: MultisigAccount,
    timepoint: Timepoint,
    call: string | any,
    maxWeight: { refTime: bigint; proofSize: bigint },
    signer: Signer,
    signerAddress: string
  ): Promise<MultisigTxResult> {
    const otherSignatories = account.signatories.filter(
      (s) => s !== signerAddress
    );

    return this.asMulti(
      account.threshold,
      otherSignatories,
      timepoint,
      call,
      maxWeight,
      signer,
      signerAddress
    );
  }

  /**
   * Cancel a multisig operation
   * @param account - Multisig account configuration
   * @param timepoint - Timepoint of the pending operation
   * @param callHash - Hash of the call
   * @param signer - Account signer (must be depositor)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async cancelMultisig(
    account: MultisigAccount,
    timepoint: Timepoint,
    callHash: string,
    signer: Signer,
    signerAddress: string
  ): Promise<MultisigTxResult> {
    const otherSignatories = account.signatories.filter(
      (s) => s !== signerAddress
    );

    return this.cancelAsMulti(
      account.threshold,
      otherSignatories,
      timepoint,
      callHash,
      signer,
      signerAddress
    );
  }

  // ==========================================================================
  // Query Passthrough (for convenience)
  // ==========================================================================

  /**
   * Get multisig operation info
   */
  async getMultisigInfo(
    multisigAddress: string,
    callHash: string
  ): Promise<MultisigInfo | null> {
    return this.queries.multisigs(multisigAddress, callHash);
  }

  /**
   * Get pending multisig operations
   */
  async getPendingMultisigs(
    multisigAddress: string,
    threshold: number
  ): Promise<PendingMultisig[]> {
    return this.queries.getPendingMultisigs(multisigAddress, threshold);
  }

  /**
   * Derive multisig address
   */
  deriveMultisigAddress(
    signatories: string[],
    threshold: number,
    ss58Prefix?: number
  ): string {
    return this.queries.deriveMultisigAddress(
      signatories,
      threshold,
      ss58Prefix
    );
  }

  /**
   * Create multisig account configuration
   */
  createMultisigAccount(
    signatories: string[],
    threshold: number
  ): MultisigAccount {
    return this.queries.createMultisigAccount(signatories, threshold);
  }

  /**
   * Get call hash
   */
  getCallHash(callData: string): string {
    return this.queries.getCallHash(callData);
  }

  /**
   * Calculate deposit
   */
  calculateDeposit(callLength: number): bigint {
    return this.queries.calculateDeposit(callLength);
  }

  /**
   * Get constants
   */
  getConstants(): MultisigConstants {
    return this.queries.getConstants();
  }

  /**
   * Validate configuration
   */
  validateConfig(
    signatories: string[],
    threshold: number
  ): { valid: boolean; errors: string[] } {
    return this.queries.validateConfig(signatories, threshold);
  }

  /**
   * Check if account has approved
   */
  async hasApproved(
    multisigAddress: string,
    callHash: string,
    account: string
  ): Promise<boolean> {
    return this.queries.hasApproved(multisigAddress, callHash, account);
  }

  /**
   * Decode call data
   */
  decodeCall(
    callData: string
  ): { section: string; method: string; args: any } | null {
    return this.queries.decodeCall(callData);
  }

  // ==========================================================================
  // Call Building Helpers
  // ==========================================================================

  /**
   * Encode a call for use with multisig
   * @param section - Pallet name (e.g., 'balances')
   * @param method - Method name (e.g., 'transfer')
   * @param args - Call arguments
   * @returns Encoded call data
   */
  encodeCall(section: string, method: string, args: any[]): string {
    const tx = (this.api.tx as any)[section][method](...args);
    return tx.method.toHex();
  }

  /**
   * Get max weight for a call
   * @param callData - Encoded call data
   * @returns Weight estimate
   */
  async getMaxWeight(
    callData: string
  ): Promise<{ refTime: bigint; proofSize: bigint }> {
    try {
      const call = this.api.registry.createType("Call", callData);
      const info = await this.api.call.transactionPaymentApi.queryInfo(
        call.toHex(),
        0
      );

      return {
        refTime: BigInt(info.weight.refTime.toString()),
        proofSize: BigInt(info.weight.proofSize.toString()),
      };
    } catch (error) {
      // Return a default safe weight
      return {
        refTime: BigInt("1000000000"),
        proofSize: BigInt("50000"),
      };
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Sign and send a transaction
   */
  private async signAndSend(
    tx: any,
    signer: Signer,
    signerAddress: string
  ): Promise<MultisigTxResult> {
    return new Promise((resolve) => {
      tx.signAndSend(
        signerAddress,
        { signer },
        ({ status, events, dispatchError }: any) => {
          if (status.isInBlock || status.isFinalized) {
            if (dispatchError) {
              let errorMessage = "Transaction failed";

              if (dispatchError.isModule) {
                const decoded = this.api.registry.findMetaError(
                  dispatchError.asModule
                );
                errorMessage = `${decoded.section}.${
                  decoded.name
                }: ${decoded.docs.join(" ")}`;
              } else {
                errorMessage = dispatchError.toString();
              }

              resolve({
                success: false,
                txHash: tx.hash.toHex(),
                blockHash:
                  status.asInBlock?.toHex() || status.asFinalized?.toHex(),
                error: errorMessage,
                events: events?.map((e: any) => e.toHuman()),
              });
            } else {
              // Extract multisig-specific events
              const multisigEvents = events?.filter(
                (e: any) => e.event.section === "multisig"
              );

              let callHash: string | undefined;
              let timepoint: Timepoint | undefined;
              let executed = false;

              for (const event of multisigEvents || []) {
                const data = event.event.data;
                if (event.event.method === "NewMultisig") {
                  callHash = data.callHash?.toHex();
                } else if (event.event.method === "MultisigApproval") {
                  callHash = data.callHash?.toHex();
                  if (data.timepoint) {
                    timepoint = {
                      height: data.timepoint.height.toNumber(),
                      index: data.timepoint.index.toNumber(),
                    };
                  }
                } else if (event.event.method === "MultisigExecuted") {
                  callHash = data.callHash?.toHex();
                  executed = true;
                  if (data.timepoint) {
                    timepoint = {
                      height: data.timepoint.height.toNumber(),
                      index: data.timepoint.index.toNumber(),
                    };
                  }
                }
              }

              resolve({
                success: true,
                txHash: tx.hash.toHex(),
                blockHash:
                  status.asInBlock?.toHex() || status.asFinalized?.toHex(),
                events: events?.map((e: any) => e.toHuman()),
                callHash,
                timepoint,
                executed,
              });
            }
          }
        }
      ).catch((error: Error) => {
        resolve({
          success: false,
          error: error.message,
        });
      });
    });
  }
}
