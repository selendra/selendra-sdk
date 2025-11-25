/**
 * Contracts Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for ink! smart contracts
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type {
  ContractGasLimit,
  StorageDepositLimit,
  Determinism,
  UploadCodeParams,
  InstantiateParams,
  InstantiateWithCodeParams,
  ContractCallParams,
  ContractsTxResult,
} from "./types.js";
import { ContractsQueries } from "./queries.js";

/**
 * Contracts Manager - handles ink! smart contract operations
 */
export class ContractsManager {
  private queries: ContractsQueries;

  constructor(private api: ApiPromise) {
    this.queries = new ContractsQueries(api);
  }

  // ==========================================================================
  // Code Management
  // ==========================================================================

  /**
   * Upload contract code to the chain
   * @param code - WASM code bytes
   * @param storageDepositLimit - Storage deposit limit
   * @param determinism - Determinism requirement
   * @returns Submittable extrinsic
   */
  uploadCode(
    code: Uint8Array | string,
    storageDepositLimit: StorageDepositLimit = null,
    determinism: Determinism = Determinism.Enforced
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.contracts.uploadCode(
      code,
      storageDepositLimit?.toString() || null,
      determinism
    );
  }

  /**
   * Remove uploaded code
   * @param codeHash - Hash of code to remove
   * @returns Submittable extrinsic
   */
  removeCode(
    codeHash: string
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.contracts.removeCode(codeHash);
  }

  /**
   * Set the code of a deployed contract
   * @param dest - Contract address
   * @param codeHash - New code hash
   * @returns Submittable extrinsic
   */
  setCode(
    dest: string,
    codeHash: string
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.contracts.setCode(dest, codeHash);
  }

  // ==========================================================================
  // Contract Instantiation
  // ==========================================================================

  /**
   * Instantiate a contract from existing code hash
   * @param value - Value to transfer
   * @param gasLimit - Gas limit
   * @param storageDepositLimit - Storage deposit limit
   * @param codeHash - Code hash to instantiate
   * @param data - Constructor data
   * @param salt - Salt for address derivation
   * @returns Submittable extrinsic
   */
  instantiate(
    value: bigint,
    gasLimit: ContractGasLimit,
    storageDepositLimit: StorageDepositLimit,
    codeHash: string,
    data: Uint8Array | string,
    salt: Uint8Array | string = "0x"
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.contracts.instantiate(
      value.toString(),
      gasLimit,
      storageDepositLimit?.toString() || null,
      codeHash,
      data,
      salt
    );
  }

  /**
   * Upload code and instantiate in a single call
   * @param value - Value to transfer
   * @param gasLimit - Gas limit
   * @param storageDepositLimit - Storage deposit limit
   * @param code - WASM code
   * @param data - Constructor data
   * @param salt - Salt for address derivation
   * @returns Submittable extrinsic
   */
  instantiateWithCode(
    value: bigint,
    gasLimit: ContractGasLimit,
    storageDepositLimit: StorageDepositLimit,
    code: Uint8Array | string,
    data: Uint8Array | string,
    salt: Uint8Array | string = "0x"
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.contracts.instantiateWithCode(
      value.toString(),
      gasLimit,
      storageDepositLimit?.toString() || null,
      code,
      data,
      salt
    );
  }

  // ==========================================================================
  // Contract Calls
  // ==========================================================================

  /**
   * Call a contract method
   * @param dest - Contract address
   * @param value - Value to transfer
   * @param gasLimit - Gas limit
   * @param storageDepositLimit - Storage deposit limit
   * @param data - Call data (selector + args)
   * @returns Submittable extrinsic
   */
  call(
    dest: string,
    value: bigint,
    gasLimit: ContractGasLimit,
    storageDepositLimit: StorageDepositLimit,
    data: Uint8Array | string
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.contracts.call(
      dest,
      value.toString(),
      gasLimit,
      storageDepositLimit?.toString() || null,
      data
    );
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Upload code and wait for confirmation
   * @param signer - Keyring pair
   * @param params - Upload parameters
   * @returns Transaction result with code hash
   */
  async uploadCodeAndWait(
    signer: KeyringPair,
    params: UploadCodeParams
  ): Promise<ContractsTxResult> {
    const extrinsic = this.uploadCode(
      params.code,
      params.storageDepositLimit,
      params.determinism
    );

    return this.signAndSend(extrinsic, signer, (events) => {
      // Find CodeStored event
      for (const event of events) {
        if (
          this.api.events.contracts?.CodeStored &&
          this.api.events.contracts.CodeStored.is(event)
        ) {
          return { codeHash: event.data[0]?.toHex() };
        }
      }
      return {};
    });
  }

  /**
   * Instantiate contract and wait for confirmation
   * @param signer - Keyring pair
   * @param params - Instantiation parameters
   * @returns Transaction result with contract address
   */
  async instantiateAndWait(
    signer: KeyringPair,
    params: InstantiateParams
  ): Promise<ContractsTxResult> {
    const extrinsic = this.instantiate(
      params.value,
      params.gasLimit,
      params.storageDepositLimit || null,
      params.codeHash,
      params.data,
      params.salt
    );

    return this.signAndSend(extrinsic, signer, (events) => {
      // Find Instantiated event
      for (const event of events) {
        if (
          this.api.events.contracts?.Instantiated &&
          this.api.events.contracts.Instantiated.is(event)
        ) {
          return { contractAddress: event.data[1]?.toString() };
        }
      }
      return {};
    });
  }

  /**
   * Upload and instantiate in one call, wait for confirmation
   * @param signer - Keyring pair
   * @param params - Parameters
   * @returns Transaction result with code hash and contract address
   */
  async instantiateWithCodeAndWait(
    signer: KeyringPair,
    params: InstantiateWithCodeParams
  ): Promise<ContractsTxResult> {
    const extrinsic = this.instantiateWithCode(
      params.value,
      params.gasLimit,
      params.storageDepositLimit || null,
      params.code,
      params.data,
      params.salt
    );

    return this.signAndSend(extrinsic, signer, (events) => {
      const result: { codeHash?: string; contractAddress?: string } = {};

      for (const event of events) {
        if (
          this.api.events.contracts?.CodeStored &&
          this.api.events.contracts.CodeStored.is(event)
        ) {
          result.codeHash = event.data[0]?.toHex();
        }
        if (
          this.api.events.contracts?.Instantiated &&
          this.api.events.contracts.Instantiated.is(event)
        ) {
          result.contractAddress = event.data[1]?.toString();
        }
      }

      return result;
    });
  }

  /**
   * Call contract and wait for confirmation
   * @param signer - Keyring pair
   * @param params - Call parameters
   * @returns Transaction result
   */
  async callAndWait(
    signer: KeyringPair,
    params: ContractCallParams
  ): Promise<ContractsTxResult> {
    const extrinsic = this.call(
      params.dest,
      params.value,
      params.gasLimit,
      params.storageDepositLimit || null,
      params.data
    );

    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Deploy a new contract (upload + instantiate)
   * @param signer - Keyring pair
   * @param code - WASM code
   * @param constructorData - Constructor data
   * @param value - Value to transfer
   * @param options - Additional options
   * @returns Transaction result
   */
  async deploy(
    signer: KeyringPair,
    code: Uint8Array | string,
    constructorData: Uint8Array | string,
    value: bigint = BigInt(0),
    options: {
      storageDepositLimit?: StorageDepositLimit;
      salt?: Uint8Array | string;
      gasMultiplier?: number;
    } = {}
  ): Promise<ContractsTxResult> {
    // Estimate gas first
    const dryRun = await this.queries.dryRunInstantiate(
      signer.address,
      value,
      null,
      options.storageDepositLimit || null,
      { Upload: code },
      constructorData,
      options.salt || "0x"
    );

    if (!dryRun.success) {
      return {
        success: false,
        blockHash: "",
        txHash: "",
        events: [],
        error: dryRun.error,
      } as ContractsTxResult & { error: string };
    }

    // Apply multiplier to gas
    const multiplier = BigInt(Math.floor((options.gasMultiplier || 1.1) * 100));
    const gasLimit: ContractGasLimit = {
      refTime: (dryRun.gasRequired.refTime * multiplier) / BigInt(100),
      proofSize: (dryRun.gasRequired.proofSize * multiplier) / BigInt(100),
    };

    return this.instantiateWithCodeAndWait(signer, {
      value,
      gasLimit,
      storageDepositLimit: options.storageDepositLimit,
      code,
      data: constructorData,
      salt: options.salt,
    });
  }

  /**
   * Execute a contract call with automatic gas estimation
   * @param signer - Keyring pair
   * @param dest - Contract address
   * @param data - Call data
   * @param value - Value to transfer
   * @param options - Additional options
   * @returns Transaction result
   */
  async execute(
    signer: KeyringPair,
    dest: string,
    data: Uint8Array | string,
    value: bigint = BigInt(0),
    options: {
      storageDepositLimit?: StorageDepositLimit;
      gasMultiplier?: number;
    } = {}
  ): Promise<ContractsTxResult> {
    // Estimate gas
    const gasLimit = await this.queries.estimateGas(
      signer.address,
      dest,
      value,
      data
    );

    // Apply additional multiplier if specified
    const multiplier = BigInt(Math.floor((options.gasMultiplier || 1.0) * 100));
    const adjustedGas: ContractGasLimit = {
      refTime: (gasLimit.refTime * multiplier) / BigInt(100),
      proofSize: (gasLimit.proofSize * multiplier) / BigInt(100),
    };

    return this.callAndWait(signer, {
      dest,
      value,
      gasLimit: adjustedGas,
      storageDepositLimit: options.storageDepositLimit,
      data,
    });
  }

  /**
   * Read contract state (view call, no transaction)
   * @param origin - Origin account
   * @param dest - Contract address
   * @param data - Call data
   * @returns Call result
   */
  async read(
    origin: string,
    dest: string,
    data: Uint8Array | string
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    const result = await this.queries.dryRunCall(
      origin,
      dest,
      BigInt(0),
      null,
      null,
      data
    );

    return {
      success: result.success,
      data: result.data,
      error: result.error,
    };
  }

  /**
   * Remove code and wait for confirmation
   * @param signer - Keyring pair
   * @param codeHash - Code hash to remove
   * @returns Transaction result
   */
  async removeCodeAndWait(
    signer: KeyringPair,
    codeHash: string
  ): Promise<ContractsTxResult> {
    const extrinsic = this.removeCode(codeHash);
    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Update contract code
   * @param signer - Keyring pair
   * @param dest - Contract address
   * @param newCodeHash - New code hash
   * @returns Transaction result
   */
  async setCodeAndWait(
    signer: KeyringPair,
    dest: string,
    newCodeHash: string
  ): Promise<ContractsTxResult> {
    const extrinsic = this.setCode(dest, newCodeHash);
    return this.signAndSend(extrinsic, signer);
  }

  // ==========================================================================
  // Query Passthrough
  // ==========================================================================

  /**
   * Get contract info
   */
  async getContractInfo(address: string) {
    return this.queries.contractInfoOf(address);
  }

  /**
   * Get code info
   */
  async getCodeInfo(codeHash: string) {
    return this.queries.codeInfoOf(codeHash);
  }

  /**
   * Check if address is a contract
   */
  async isContract(address: string) {
    return this.queries.isContract(address);
  }

  /**
   * Dry run a call
   */
  async dryRunCall(
    origin: string,
    dest: string,
    value: bigint,
    gasLimit: ContractGasLimit | null,
    storageDepositLimit: StorageDepositLimit,
    inputData: Uint8Array | string
  ) {
    return this.queries.dryRunCall(
      origin,
      dest,
      value,
      gasLimit,
      storageDepositLimit,
      inputData
    );
  }

  /**
   * Get pallet constants
   */
  async getConstants() {
    return this.queries.getConstants();
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Sign and send an extrinsic
   */
  private async signAndSend(
    extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>,
    signer: KeyringPair,
    extractData?: (events: any[]) => {
      codeHash?: string;
      contractAddress?: string;
    }
  ): Promise<ContractsTxResult> {
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

            // Extract additional data from events
            const extraData = extractData ? extractData(events) : {};

            resolve({
              success: !hasError,
              blockHash,
              txHash: extrinsic.hash.toString(),
              events,
              ...extraData,
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
