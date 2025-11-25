/**
 * Elections Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for Selendra's custom validator elections pallet
 * Note: Most operations require root/admin origin
 */

import type { ApiPromise } from "@polkadot/api";
import type { Signer } from "@polkadot/api/types";
import type {
  CommitteeSeats,
  ElectionOpenness,
  EraValidators,
  ChangeValidatorsParams,
  SetElectionsOpennessParams,
  ValidatorSetInfo,
  ValidatorEligibility,
} from "./types.js";
import { ElectionsQueries } from "./queries.js";

/**
 * Transaction result type
 */
export interface ElectionsTxResult {
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
}

/**
 * Elections Manager - handles elections pallet transactions
 *
 * Note: Most extrinsics in this pallet require AdminOrigin (root or governance).
 * Regular users can only query election state.
 */
export class ElectionsManager {
  private queries: ElectionsQueries;

  constructor(private api: ApiPromise) {
    this.queries = new ElectionsQueries(api);
  }

  // ==========================================================================
  // Admin Extrinsics (Require Root/Governance Origin)
  // ==========================================================================

  /**
   * Change validators configuration for next era
   * Requires admin/root origin
   *
   * @param params - Validator change parameters
   * @param signer - Account signer (must be admin/root)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async changeValidators(
    params: ChangeValidatorsParams,
    signer: Signer,
    signerAddress: string
  ): Promise<ElectionsTxResult> {
    try {
      // Build the extrinsic
      const tx = (this.api.tx as any).elections.changeValidators(
        params.reservedValidators ?? null,
        params.nonReservedValidators ?? null,
        params.committeeSize ?? null
      );

      // Sign and send
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Set elections openness mode
   * Requires admin/root origin
   *
   * @param params - Openness parameters
   * @param signer - Account signer (must be admin/root)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async setElectionsOpenness(
    params: SetElectionsOpennessParams,
    signer: Signer,
    signerAddress: string
  ): Promise<ElectionsTxResult> {
    try {
      const tx = (this.api.tx as any).elections.setElectionsOpenness(
        params.openness
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
  // Batch Operations
  // ==========================================================================

  /**
   * Update committee configuration (validators + committee size + openness)
   * Requires admin/root origin
   *
   * @param config - Full configuration update
   * @param signer - Account signer (must be admin/root)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async updateCommitteeConfig(
    config: {
      reservedValidators?: string[];
      nonReservedValidators?: string[];
      committeeSize?: CommitteeSeats;
      openness?: ElectionOpenness;
    },
    signer: Signer,
    signerAddress: string
  ): Promise<ElectionsTxResult> {
    try {
      const calls: any[] = [];

      // Add change validators call if needed
      if (
        config.reservedValidators !== undefined ||
        config.nonReservedValidators !== undefined ||
        config.committeeSize !== undefined
      ) {
        calls.push(
          (this.api.tx as any).elections.changeValidators(
            config.reservedValidators ?? null,
            config.nonReservedValidators ?? null,
            config.committeeSize ?? null
          )
        );
      }

      // Add openness call if needed
      if (config.openness !== undefined) {
        calls.push(
          (this.api.tx as any).elections.setElectionsOpenness(config.openness)
        );
      }

      if (calls.length === 0) {
        return {
          success: false,
          error: "No configuration changes specified",
        };
      }

      // Batch the calls
      const batchTx = this.api.tx.utility.batchAll(calls);

      return await this.signAndSend(batchTx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Add validators to the non-reserved list
   * Requires admin/root origin
   *
   * @param validators - Validators to add
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async addNonReservedValidators(
    validators: string[],
    signer: Signer,
    signerAddress: string
  ): Promise<ElectionsTxResult> {
    try {
      // Get current non-reserved validators
      const currentNonReserved =
        await this.queries.nextEraNonReservedValidators();

      // Merge and deduplicate
      const newNonReserved = [
        ...new Set([...currentNonReserved, ...validators]),
      ];

      // Update
      return await this.changeValidators(
        { nonReservedValidators: newNonReserved },
        signer,
        signerAddress
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Remove validators from the non-reserved list
   * Requires admin/root origin
   *
   * @param validators - Validators to remove
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async removeNonReservedValidators(
    validators: string[],
    signer: Signer,
    signerAddress: string
  ): Promise<ElectionsTxResult> {
    try {
      // Get current non-reserved validators
      const currentNonReserved =
        await this.queries.nextEraNonReservedValidators();

      // Remove specified validators
      const validatorsToRemove = new Set(validators);
      const newNonReserved = currentNonReserved.filter(
        (v) => !validatorsToRemove.has(v)
      );

      // Update
      return await this.changeValidators(
        { nonReservedValidators: newNonReserved },
        signer,
        signerAddress
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // Query Passthrough (for convenience)
  // ==========================================================================

  /**
   * Get current committee size
   */
  async getCommitteeSize(): Promise<CommitteeSeats> {
    return this.queries.committeeSize();
  }

  /**
   * Get current era validators
   */
  async getCurrentValidators(): Promise<EraValidators> {
    return this.queries.currentEraValidators();
  }

  /**
   * Get full validator set information
   */
  async getValidatorSetInfo(): Promise<ValidatorSetInfo> {
    return this.queries.getValidatorSetInfo();
  }

  /**
   * Get current election openness
   */
  async getOpenness(): Promise<ElectionOpenness> {
    return this.queries.openness();
  }

  /**
   * Check if an account is a current validator
   */
  async isValidator(accountId: string): Promise<boolean> {
    return this.queries.isCurrentValidator(accountId);
  }

  /**
   * Check validator eligibility
   */
  async checkEligibility(accountId: string): Promise<ValidatorEligibility> {
    return this.queries.checkValidatorEligibility(accountId);
  }

  // ==========================================================================
  // Validation Helpers
  // ==========================================================================

  /**
   * Validate proposed validator configuration
   * @param reserved - Proposed reserved validators
   * @param nonReserved - Proposed non-reserved validators
   * @param committeeSize - Proposed committee size
   * @returns Validation result
   */
  async validateConfiguration(
    reserved: string[],
    nonReserved: string[],
    committeeSize: CommitteeSeats
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for unique validators
    const allValidators = [...reserved, ...nonReserved];
    const uniqueValidators = new Set(allValidators);
    if (uniqueValidators.size !== allValidators.length) {
      errors.push("Validator list contains duplicates");
    }

    // Check sufficient reserved validators
    if (reserved.length < committeeSize.reservedSeats) {
      errors.push(
        `Not enough reserved validators: ${reserved.length} < ${committeeSize.reservedSeats}`
      );
    }

    // Check sufficient non-reserved validators
    if (nonReserved.length < committeeSize.nonReservedSeats) {
      errors.push(
        `Not enough non-reserved validators: ${nonReserved.length} < ${committeeSize.nonReservedSeats}`
      );
    }

    // Check finality seats <= non-reserved seats
    if (
      committeeSize.nonReservedFinalitySeats > committeeSize.nonReservedSeats
    ) {
      errors.push(
        "Non-reserved finality seats cannot exceed non-reserved seats"
      );
    }

    // Check total committee size
    const totalSeats =
      committeeSize.reservedSeats + committeeSize.nonReservedSeats;
    const totalValidators = reserved.length + nonReserved.length;
    if (totalSeats > totalValidators) {
      errors.push(
        `Not enough total validators: ${totalValidators} < ${totalSeats} seats`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
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
  ): Promise<ElectionsTxResult> {
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
              resolve({
                success: true,
                txHash: tx.hash.toHex(),
                blockHash:
                  status.asInBlock?.toHex() || status.asFinalized?.toHex(),
                events: events?.map((e: any) => e.toHuman()),
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
