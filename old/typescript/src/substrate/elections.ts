/**
 * Elections Pallet Client
 *
 * Provides APIs for interacting with Selendra's Elections pallet.
 * Manages validator elections, committee seats, and validator sets.
 *
 * @module substrate/elections
 */

import { ApiPromise } from '@polkadot/api';

/**
 * Committee seat configuration
 */
export interface CommitteeSeats {
  reserved: number;
  nonReserved: number;
  nonReservedFinality: number;
}

/**
 * Era validators structure
 */
export interface EraValidators {
  reserved: string[];
  nonReserved: string[];
}

/**
 * Election openness mode
 */
export enum ElectionOpenness {
  Permissioned = 'Permissioned',
  Permissionless = 'Permissionless',
}

/**
 * Client for interacting with Selendra's Elections pallet
 *
 * @example
 * ```typescript
 * const elections = sdk.substrate.elections;
 *
 * // Get committee configuration
 * const seats = await elections.getCommitteeSeats();
 * console.log(`Reserved: ${seats.reserved}, Non-reserved: ${seats.nonReserved}`);
 *
 * // Get next era validators
 * const validators = await elections.getNextEraValidators();
 * console.log(`Reserved validators: ${validators.reserved.length}`);
 *
 * // Check election openness
 * const openness = await elections.getElectionOpenness();
 * ```
 */
export class ElectionsClient {
  private api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  /**
   * Get current committee seat configuration
   *
   * @returns Committee seats distribution
   */
  async getCommitteeSeats(): Promise<CommitteeSeats> {
    const seats = await this.api.query.elections.committeeSize();
    const data = seats as any;

    return {
      reserved: data.reserved.toNumber(),
      nonReserved: data.nonReserved.toNumber(),
      nonReservedFinality: data.nonReservedFinality.toNumber(),
    };
  }

  /**
   * Get next era committee seat configuration
   *
   * @returns Next era committee seats
   */
  async getNextEraCommitteeSeats(): Promise<CommitteeSeats> {
    const seats = await this.api.query.elections.nextEraCommitteeSize();
    const data = seats as any;

    return {
      reserved: data.reserved.toNumber(),
      nonReserved: data.nonReserved.toNumber(),
      nonReservedFinality: data.nonReservedFinality.toNumber(),
    };
  }

  /**
   * Get reserved validators for next era
   *
   * @returns Array of reserved validator addresses
   */
  async getNextEraReservedValidators(): Promise<string[]> {
    const validators = await this.api.query.elections.nextEraReservedValidators();
    return (validators as any).map((v: any) => v.toString());
  }

  /**
   * Get non-reserved validators for next era
   *
   * @returns Array of non-reserved validator addresses
   */
  async getNextEraNonReservedValidators(): Promise<string[]> {
    const validators = await this.api.query.elections.nextEraNonReservedValidators();
    return (validators as any).map((v: any) => v.toString());
  }

  /**
   * Get all validators for next era (reserved and non-reserved)
   *
   * @returns Validator sets
   */
  async getNextEraValidators(): Promise<EraValidators> {
    const [reserved, nonReserved] = await Promise.all([
      this.getNextEraReservedValidators(),
      this.getNextEraNonReservedValidators(),
    ]);

    return { reserved, nonReserved };
  }

  /**
   * Get current election openness mode
   *
   * @returns Permissioned or Permissionless
   */
  async getElectionOpenness(): Promise<ElectionOpenness> {
    const openness = await this.api.query.elections.openness();
    const data = openness as any;

    return data.isPermissioned ? ElectionOpenness.Permissioned : ElectionOpenness.Permissionless;
  }

  /**
   * Get total number of validators (reserved + non-reserved)
   *
   * @returns Total validator count
   */
  async getTotalValidatorCount(): Promise<number> {
    const validators = await this.getNextEraValidators();
    return validators.reserved.length + validators.nonReserved.length;
  }

  /**
   * Check if an address is a reserved validator
   *
   * @param address - Validator address to check
   * @returns True if reserved validator
   */
  async isReservedValidator(address: string): Promise<boolean> {
    const reserved = await this.getNextEraReservedValidators();
    return reserved.includes(address);
  }

  /**
   * Check if an address is a non-reserved validator
   *
   * @param address - Validator address to check
   * @returns True if non-reserved validator
   */
  async isNonReservedValidator(address: string): Promise<boolean> {
    const nonReserved = await this.getNextEraNonReservedValidators();
    return nonReserved.includes(address);
  }

  /**
   * Get current era index
   *
   * @returns Current era number
   */
  async getCurrentEra(): Promise<number> {
    const era = await this.api.query.staking.currentEra();
    if ('isNone' in era && (era as any).isNone) {
      return 0;
    }
    if ('unwrap' in era) {
      return (era as any).unwrap().toNumber();
    }
    return (era as any).toNumber();
  }

  /**
   * Get current era validators (reserved and non-reserved)
   *
   * @returns Current era validators
   */
  async getCurrentEraValidators(): Promise<EraValidators> {
    if (!this.api.query.elections?.currentEraValidators) {
      return { reserved: [], nonReserved: [] };
    }

    const validators = await this.api.query.elections.currentEraValidators();
    const data = validators as any;

    return {
      reserved: (data.reserved || []).map((v: any) => v.toString()),
      nonReserved: (data.nonReserved || data.non_reserved || []).map((v: any) => v.toString()),
    };
  }

  // ========== Extrinsics ==========

  /**
   * Change validator set (requires root/sudo)
   * Updates reserved validators, non-reserved validators, and/or committee size
   *
   * @param signer - Sudo account signer
   * @param reserved - Reserved validator addresses (optional, null to keep current)
   * @param nonReserved - Non-reserved validator addresses (optional, null to keep current)
   * @param committeeSize - Committee seat configuration (optional, null to keep current)
   * @returns Transaction result
   */
  async changeValidators(
    signer: any,
    reserved: string[] | null,
    nonReserved: string[] | null,
    committeeSize: CommitteeSeats | null,
  ): Promise<{
    blockHash: string;
    success: boolean;
    error?: string;
  }> {
    if (!this.api.tx.elections?.changeValidators) {
      throw new Error('Elections pallet not available');
    }

    const tx = this.api.tx.elections.changeValidators(reserved, nonReserved, committeeSize);

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, dispatchError }: any) => {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }

          if (status.isFinalized) {
            resolve({
              blockHash: status.asFinalized.toString(),
              success: false,
              error: errorMessage,
            });
          } else {
            reject(new Error(errorMessage));
          }
          return;
        }

        if (status.isFinalized) {
          resolve({
            blockHash: status.asFinalized.toString(),
            success: true,
          });
        }
      });
    });
  }

  /**
   * Set election openness mode (requires root/sudo)
   * Controls whether validator elections are Permissioned or Permissionless
   *
   * @param signer - Sudo account signer
   * @param openness - Election mode (Permissioned or Permissionless)
   * @returns Transaction result
   */
  async setElectionsOpenness(
    signer: any,
    openness: ElectionOpenness,
  ): Promise<{
    blockHash: string;
    success: boolean;
    error?: string;
  }> {
    if (!this.api.tx.elections?.setElectionsOpenness) {
      throw new Error('Elections pallet not available');
    }

    const tx = this.api.tx.elections.setElectionsOpenness(openness);

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, dispatchError }: any) => {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }

          if (status.isFinalized) {
            resolve({
              blockHash: status.asFinalized.toString(),
              success: false,
              error: errorMessage,
            });
          } else {
            reject(new Error(errorMessage));
          }
          return;
        }

        if (status.isFinalized) {
          resolve({
            blockHash: status.asFinalized.toString(),
            success: true,
          });
        }
      });
    });
  }

  /**
   * Get validator statistics
   *
   * @returns Validator distribution stats
   */
  async getValidatorStats(): Promise<{
    reserved: number;
    nonReserved: number;
    total: number;
    seats: CommitteeSeats;
    openness: ElectionOpenness;
  }> {
    const [validators, seats, openness] = await Promise.all([
      this.getNextEraValidators(),
      this.getCommitteeSeats(),
      this.getElectionOpenness(),
    ]);

    return {
      reserved: validators.reserved.length,
      nonReserved: validators.nonReserved.length,
      total: validators.reserved.length + validators.nonReserved.length,
      seats,
      openness,
    };
  }
}
