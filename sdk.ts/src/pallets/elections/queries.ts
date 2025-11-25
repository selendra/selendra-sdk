/**
 * Elections Pallet Queries
 *
 * Query functions for Selendra's custom validator elections pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  CommitteeSeats,
  ElectionOpenness,
  EraValidators,
  ValidatorSetInfo,
  ElectionsConfig,
  ValidatorEligibility,
} from "./types.js";

/**
 * Elections Queries - read-only queries for elections pallet
 */
export class ElectionsQueries {
  constructor(private api: ApiPromise) {}

  // ==========================================================================
  // Storage Queries
  // ==========================================================================

  /**
   * Get current committee size configuration
   * @returns Committee seats configuration
   */
  async committeeSize(): Promise<CommitteeSeats> {
    const result = await (this.api.query as any).elections.committeeSize();
    return this.parseCommitteeSeats(result);
  }

  /**
   * Get next era committee size configuration
   * @returns Next era committee seats configuration
   */
  async nextEraCommitteeSize(): Promise<CommitteeSeats> {
    const result = await (
      this.api.query as any
    ).elections.nextEraCommitteeSize();
    return this.parseCommitteeSeats(result);
  }

  /**
   * Get current era validators
   * @returns Current era validators (reserved and non-reserved)
   */
  async currentEraValidators(): Promise<EraValidators> {
    const result = await (
      this.api.query as any
    ).elections.currentEraValidators();
    return this.parseEraValidators(result);
  }

  /**
   * Get next era reserved validators
   * @returns List of next era reserved validator addresses
   */
  async nextEraReservedValidators(): Promise<string[]> {
    const result = await (
      this.api.query as any
    ).elections.nextEraReservedValidators();
    return (result.toJSON() as string[]) || [];
  }

  /**
   * Get next era non-reserved validators
   * @returns List of next era non-reserved validator addresses
   */
  async nextEraNonReservedValidators(): Promise<string[]> {
    const result = await (
      this.api.query as any
    ).elections.nextEraNonReservedValidators();
    return (result.toJSON() as string[]) || [];
  }

  /**
   * Get elections openness mode
   * @returns Current election openness setting
   */
  async openness(): Promise<ElectionOpenness> {
    const result = await (this.api.query as any).elections.openness();
    const value = result.toString();
    return value as ElectionOpenness;
  }

  // ==========================================================================
  // Derived Queries
  // ==========================================================================

  /**
   * Get full validator set information
   * @returns Complete validator set info
   */
  async getValidatorSetInfo(): Promise<ValidatorSetInfo> {
    const [
      currentValidators,
      nextReserved,
      nextNonReserved,
      committeeSize,
      nextCommitteeSize,
      openness,
    ] = await Promise.all([
      this.currentEraValidators(),
      this.nextEraReservedValidators(),
      this.nextEraNonReservedValidators(),
      this.committeeSize(),
      this.nextEraCommitteeSize(),
      this.openness(),
    ]);

    return {
      currentValidators,
      nextReserved,
      nextNonReserved,
      committeeSize,
      nextCommitteeSize,
      openness,
    };
  }

  /**
   * Get elections configuration
   * @returns Elections pallet configuration
   */
  async getElectionsConfig(): Promise<ElectionsConfig> {
    // Try to get constants
    let maxWinners = 100;
    let maxValidators = 100;

    try {
      const maxWinnersConst = (this.api.consts as any).elections?.maxWinners;
      if (maxWinnersConst) {
        maxWinners = parseInt(maxWinnersConst.toString(), 10);
      }
    } catch {
      // Use default
    }

    try {
      const maxValidatorsConst = (this.api.consts as any).elections
        ?.maxValidators;
      if (maxValidatorsConst) {
        maxValidators = parseInt(maxValidatorsConst.toString(), 10);
      }
    } catch {
      // Use default
    }

    const [committeeSize, openness] = await Promise.all([
      this.committeeSize(),
      this.openness(),
    ]);

    return {
      maxWinners,
      maxValidators,
      committeeSize,
      openness,
    };
  }

  /**
   * Get all current validators (reserved + non-reserved)
   * @returns Array of all current validator addresses
   */
  async getAllCurrentValidators(): Promise<string[]> {
    const validators = await this.currentEraValidators();
    return [...validators.reserved, ...validators.nonReserved];
  }

  /**
   * Get all next era validators (reserved + non-reserved)
   * @returns Array of all next era validator addresses
   */
  async getAllNextEraValidators(): Promise<string[]> {
    const [reserved, nonReserved] = await Promise.all([
      this.nextEraReservedValidators(),
      this.nextEraNonReservedValidators(),
    ]);
    return [...reserved, ...nonReserved];
  }

  /**
   * Check if an account is a current validator
   * @param accountId - Account to check
   * @returns True if the account is a current validator
   */
  async isCurrentValidator(accountId: string): Promise<boolean> {
    const validators = await this.getAllCurrentValidators();
    return validators.includes(accountId);
  }

  /**
   * Check if an account is a reserved validator
   * @param accountId - Account to check
   * @returns True if the account is a reserved validator
   */
  async isReservedValidator(accountId: string): Promise<boolean> {
    const validators = await this.currentEraValidators();
    return validators.reserved.includes(accountId);
  }

  /**
   * Check if an account is a non-reserved validator
   * @param accountId - Account to check
   * @returns True if the account is a non-reserved validator
   */
  async isNonReservedValidator(accountId: string): Promise<boolean> {
    const validators = await this.currentEraValidators();
    return validators.nonReserved.includes(accountId);
  }

  /**
   * Check validator eligibility for next era
   * @param accountId - Account to check
   * @returns Eligibility status and reason
   */
  async checkValidatorEligibility(
    accountId: string
  ): Promise<ValidatorEligibility> {
    const [validators, openness, nextReserved] = await Promise.all([
      this.getValidatorSetInfo(),
      this.openness(),
      this.nextEraReservedValidators(),
    ]);

    const isReserved = nextReserved.includes(accountId);

    // Check if staking (bonded)
    let isStaking = false;
    try {
      const bonded = await this.api.query.staking.bonded(accountId);
      isStaking = !bonded.isEmpty;
    } catch {
      // Not staking
    }

    // Check if banned (via committee management pallet)
    let isBanned = false;
    try {
      const banned = await (
        this.api.query as any
      ).committeeManagement?.banned?.(accountId);
      if (banned && !banned.isEmpty) {
        isBanned = true;
      }
    } catch {
      // Not banned or pallet doesn't exist
    }

    // Determine eligibility
    let isEligible = false;
    let reason: string | undefined;

    if (isBanned) {
      reason = "Validator is banned";
    } else if (!isStaking) {
      reason = "Validator is not staking";
    } else if (openness === "Permissioned" && !isReserved) {
      // In permissioned mode, must be in the approved list
      const nextNonReserved = await this.nextEraNonReservedValidators();
      if (!nextNonReserved.includes(accountId)) {
        reason = "Validator not in approved list (permissioned mode)";
      } else {
        isEligible = true;
      }
    } else {
      isEligible = true;
    }

    return {
      isEligible,
      isStaking,
      isBanned,
      isReserved,
      reason,
    };
  }

  /**
   * Get total committee size (reserved + non-reserved)
   * @returns Total number of committee seats
   */
  async getTotalCommitteeSize(): Promise<number> {
    const seats = await this.committeeSize();
    return seats.reservedSeats + seats.nonReservedSeats;
  }

  /**
   * Get validator count statistics
   * @returns Object with validator counts
   */
  async getValidatorCounts(): Promise<{
    currentReserved: number;
    currentNonReserved: number;
    currentTotal: number;
    nextReserved: number;
    nextNonReserved: number;
    nextTotal: number;
  }> {
    const info = await this.getValidatorSetInfo();

    return {
      currentReserved: info.currentValidators.reserved.length,
      currentNonReserved: info.currentValidators.nonReserved.length,
      currentTotal:
        info.currentValidators.reserved.length +
        info.currentValidators.nonReserved.length,
      nextReserved: info.nextReserved.length,
      nextNonReserved: info.nextNonReserved.length,
      nextTotal: info.nextReserved.length + info.nextNonReserved.length,
    };
  }

  // ==========================================================================
  // Subscription Methods
  // ==========================================================================

  /**
   * Subscribe to committee size changes
   * @param callback - Callback when committee size changes
   * @returns Unsubscribe function
   */
  async subscribeToCommitteeSize(
    callback: (committeeSize: CommitteeSeats) => void
  ): Promise<() => void> {
    const unsub = await (this.api.query as any).elections.committeeSize(
      (result: any) => {
        callback(this.parseCommitteeSeats(result));
      }
    );
    return unsub as unknown as () => void;
  }

  /**
   * Subscribe to elections openness changes
   * @param callback - Callback when openness changes
   * @returns Unsubscribe function
   */
  async subscribeToOpenness(
    callback: (openness: ElectionOpenness) => void
  ): Promise<() => void> {
    const unsub = await (this.api.query as any).elections.openness(
      (result: any) => {
        callback(result.toString() as ElectionOpenness);
      }
    );
    return unsub as unknown as () => void;
  }

  /**
   * Subscribe to current era validators changes
   * @param callback - Callback when validators change
   * @returns Unsubscribe function
   */
  async subscribeToCurrentValidators(
    callback: (validators: EraValidators) => void
  ): Promise<() => void> {
    const unsub = await (this.api.query as any).elections.currentEraValidators(
      (result: any) => {
        callback(this.parseEraValidators(result));
      }
    );
    return unsub as unknown as () => void;
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Parse committee seats from raw result
   */
  private parseCommitteeSeats(result: any): CommitteeSeats {
    const json = result.toJSON() || {};
    return {
      reservedSeats: json.reservedSeats ?? json.reserved_seats ?? 0,
      nonReservedSeats: json.nonReservedSeats ?? json.non_reserved_seats ?? 0,
      nonReservedFinalitySeats:
        json.nonReservedFinalitySeats ?? json.non_reserved_finality_seats ?? 0,
    };
  }

  /**
   * Parse era validators from raw result
   */
  private parseEraValidators(result: any): EraValidators {
    const json = result.toJSON() || {};
    return {
      reserved: json.reserved || [],
      nonReserved: json.nonReserved ?? json.non_reserved ?? [],
    };
  }
}
