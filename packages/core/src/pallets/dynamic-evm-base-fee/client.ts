/**
 * Dynamic EVM Base Fee Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for dynamic EVM base fee
 * Note: This pallet is mostly read-only, base fee is calculated automatically
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type { DynamicBaseFeeTxResult } from "./types.js";
import { DynamicEvmBaseFeeQueries } from "./queries.js";

/**
 * Dynamic EVM Base Fee Manager
 * Note: The base fee is calculated automatically based on block fullness
 * These methods are primarily for governance/sudo operations
 */
export class DynamicEvmBaseFeeManager {
  private queries: DynamicEvmBaseFeeQueries;

  constructor(private api: ApiPromise) {
    this.queries = new DynamicEvmBaseFeeQueries(api);
  }

  // ==========================================================================
  // Admin/Governance Extrinsics (if available)
  // ==========================================================================

  /**
   * Set the base fee per gas (governance/sudo only)
   * @param baseFee - New base fee value
   * @returns Submittable extrinsic
   */
  setBaseFeePerGas(
    baseFee: bigint
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    if (this.api.tx.dynamicEvmBaseFee?.setBaseFeePerGas) {
      return this.api.tx.dynamicEvmBaseFee.setBaseFeePerGas(baseFee.toString());
    }

    // Try alternative pallet name
    if ((this.api.tx as any).baseFee?.setBaseFeePerGas) {
      return (this.api.tx as any).baseFee.setBaseFeePerGas(baseFee.toString());
    }

    throw new Error("setBaseFeePerGas not available");
  }

  /**
   * Set the elasticity multiplier (governance/sudo only)
   * @param elasticity - New elasticity value
   * @returns Submittable extrinsic
   */
  setElasticity(
    elasticity: bigint
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    if (this.api.tx.dynamicEvmBaseFee?.setElasticity) {
      return this.api.tx.dynamicEvmBaseFee.setElasticity(elasticity.toString());
    }

    // Try alternative pallet name
    if ((this.api.tx as any).baseFee?.setElasticity) {
      return (this.api.tx as any).baseFee.setElasticity(elasticity.toString());
    }

    throw new Error("setElasticity not available");
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Set base fee and wait for confirmation (sudo/governance)
   * @param signer - Keyring pair with governance permissions
   * @param baseFee - New base fee value
   * @returns Transaction result
   */
  async setBaseFeePerGasAndWait(
    signer: KeyringPair,
    baseFee: bigint
  ): Promise<DynamicBaseFeeTxResult> {
    const extrinsic = this.setBaseFeePerGas(baseFee);
    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Set elasticity and wait for confirmation (sudo/governance)
   * @param signer - Keyring pair with governance permissions
   * @param elasticity - New elasticity value
   * @returns Transaction result
   */
  async setElasticityAndWait(
    signer: KeyringPair,
    elasticity: bigint
  ): Promise<DynamicBaseFeeTxResult> {
    const extrinsic = this.setElasticity(elasticity);
    return this.signAndSend(extrinsic, signer);
  }

  // ==========================================================================
  // Query Passthrough
  // ==========================================================================

  /**
   * Get current base fee per gas
   */
  async getBaseFeePerGas() {
    return this.queries.baseFeePerGas();
  }

  /**
   * Get base fee configuration
   */
  async getBaseFeeConfig() {
    return this.queries.getBaseFeeConfig();
  }

  /**
   * Get pallet constants
   */
  async getConstants() {
    return this.queries.getConstants();
  }

  /**
   * Check if dynamic base fee is available
   */
  isAvailable(): boolean {
    return this.queries.isAvailable();
  }

  /**
   * Get fee history
   */
  async getFeeHistory(blockCount?: number) {
    return this.queries.getFeeHistory(blockCount);
  }

  /**
   * Estimate next base fee
   */
  async estimateNextBaseFee(gasUsed: bigint, gasLimit: bigint) {
    return this.queries.estimateNextBaseFee(gasUsed, gasLimit);
  }

  /**
   * Format base fee for display
   */
  formatBaseFee(baseFee: bigint): string {
    return this.queries.formatBaseFee(baseFee);
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
  ): Promise<DynamicBaseFeeTxResult> {
    return new Promise((resolve, reject) => {
      extrinsic
        .signAndSend(signer, (result: ISubmittableResult) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            const blockHash = result.status.isInBlock
              ? result.status.asInBlock.toString()
              : result.status.asFinalized.toString();

            const events = result.events.map((e: any) => e.event);

            const hasError = events.some((e: any) =>
              this.api.events.system.ExtrinsicFailed.is(e)
            );

            resolve({
              success: !hasError,
              blockHash,
              txHash: extrinsic.hash.toString(),
              events,
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
