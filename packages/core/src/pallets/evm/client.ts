/**
 * EVM Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for EVM pallet (Frontier)
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type {
  H160,
  H256,
  U256,
  EvmCallParams,
  EvmCreateParams,
  EvmCreate2Params,
  AccessListItem,
  EvmLog,
  ExecutedEvent,
  CreatedEvent,
} from "./types.js";
import { EvmQueries } from "./queries.js";

/** EVM transaction result */
export interface EvmTxResult {
  success: boolean;
  blockHash: string;
  blockNumber: number;
  txHash: string;
  events: any[];
}

/** EVM call result */
export interface EvmCallResult extends EvmTxResult {
  returnValue?: string;
  logs: EvmLog[];
  gasUsed?: U256;
}

/** EVM create result */
export interface EvmCreateResult extends EvmTxResult {
  contractAddress?: H160;
  logs: EvmLog[];
  gasUsed?: U256;
}

/** Deploy contract options */
export interface DeployContractOptions {
  bytecode: string;
  gasLimit?: U256;
  maxFeePerGas?: U256;
  maxPriorityFeePerGas?: U256;
  nonce?: U256;
  value?: U256;
  accessList?: AccessListItem[];
  salt?: H256; // If provided, uses CREATE2
}

/** Call contract options */
export interface CallContractOptions {
  to: H160;
  data?: string;
  value?: U256;
  gasLimit?: U256;
  maxFeePerGas?: U256;
  maxPriorityFeePerGas?: U256;
  nonce?: U256;
  accessList?: AccessListItem[];
}

/**
 * EVM Manager - handles EVM extrinsics
 */
export class EvmManager {
  private queries: EvmQueries;

  constructor(private api: ApiPromise) {
    this.queries = new EvmQueries(api);
  }

  // ==========================================================================
  // Core EVM Extrinsics
  // ==========================================================================

  /**
   * Create a call extrinsic for executing contract code
   * @param params - Call parameters
   * @returns Submittable extrinsic
   */
  call(
    params: EvmCallParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    const {
      source,
      target,
      input,
      value,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
      accessList,
    } = params;

    return this.api.tx.evm.call(
      source,
      target,
      input || "0x",
      value.toString(),
      gasLimit.toString(),
      maxFeePerGas.toString(),
      maxPriorityFeePerGas?.toString() || null,
      nonce?.toString() || null,
      accessList || []
    );
  }

  /**
   * Create a create extrinsic for deploying a contract
   * @param params - Create parameters
   * @returns Submittable extrinsic
   */
  create(
    params: EvmCreateParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    const {
      source,
      init,
      value,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
      accessList,
    } = params;

    return this.api.tx.evm.create(
      source,
      init,
      value.toString(),
      gasLimit.toString(),
      maxFeePerGas.toString(),
      maxPriorityFeePerGas?.toString() || null,
      nonce?.toString() || null,
      accessList || []
    );
  }

  /**
   * Create a create2 extrinsic for deploying a contract with deterministic address
   * @param params - Create2 parameters
   * @returns Submittable extrinsic
   */
  create2(
    params: EvmCreate2Params
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    const {
      source,
      init,
      salt,
      value,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
      accessList,
    } = params;

    return this.api.tx.evm.create2(
      source,
      init,
      salt,
      value.toString(),
      gasLimit.toString(),
      maxFeePerGas.toString(),
      maxPriorityFeePerGas?.toString() || null,
      nonce?.toString() || null,
      accessList || []
    );
  }

  /**
   * Withdraw balance from EVM to substrate account
   * @param address - EVM address to withdraw from
   * @param value - Amount to withdraw
   * @returns Submittable extrinsic
   */
  withdraw(
    address: H160,
    value: U256
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.evm.withdraw(address, value.toString());
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Deploy a smart contract
   * @param signer - Keyring pair to sign the transaction
   * @param evmAddress - EVM address of the sender
   * @param options - Deploy options
   * @returns Deploy result with contract address
   */
  async deployContract(
    signer: KeyringPair,
    evmAddress: H160,
    options: DeployContractOptions
  ): Promise<EvmCreateResult> {
    const {
      bytecode,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
      value,
      accessList,
      salt,
    } = options;

    // Get gas estimate if not provided
    const estimatedGas = gasLimit || (await this.estimateDeployGas(bytecode));

    // Get gas price if not provided
    const gasPrice = maxFeePerGas || (await this.queries.getGasPrice());

    // Get nonce if not provided
    const txNonce =
      nonce !== undefined
        ? nonce
        : (await this.queries.getTransactionCount(evmAddress)).nonce;

    // Create params
    const params = salt
      ? {
          source: evmAddress,
          init: bytecode,
          salt,
          value: value || 0n,
          gasLimit: estimatedGas,
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas,
          nonce: txNonce,
          accessList,
        }
      : {
          source: evmAddress,
          init: bytecode,
          value: value || 0n,
          gasLimit: estimatedGas,
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas,
          nonce: txNonce,
          accessList,
        };

    // Create extrinsic
    const extrinsic = salt
      ? this.create2(params as EvmCreate2Params)
      : this.create(params as EvmCreateParams);

    // Sign and send
    return this.signAndSendCreate(extrinsic, signer);
  }

  /**
   * Call a contract method (state-changing)
   * @param signer - Keyring pair to sign the transaction
   * @param evmAddress - EVM address of the sender
   * @param options - Call options
   * @returns Call result
   */
  async callContract(
    signer: KeyringPair,
    evmAddress: H160,
    options: CallContractOptions
  ): Promise<EvmCallResult> {
    const {
      to,
      data,
      value,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
      accessList,
    } = options;

    // Get gas estimate if not provided
    const estimatedGas =
      gasLimit ||
      (await this.queries.estimateGas({
        from: evmAddress,
        to,
        data,
        value,
      }));

    // Get gas price if not provided
    const gasPrice = maxFeePerGas || (await this.queries.getGasPrice());

    // Get nonce if not provided
    const txNonce =
      nonce !== undefined
        ? nonce
        : (await this.queries.getTransactionCount(evmAddress)).nonce;

    // Create params
    const params: EvmCallParams = {
      source: evmAddress,
      target: to,
      input: data,
      value: value || 0n,
      gasLimit: estimatedGas,
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas,
      nonce: txNonce,
      accessList,
    };

    // Create extrinsic
    const extrinsic = this.call(params);

    // Sign and send
    return this.signAndSendCall(extrinsic, signer);
  }

  /**
   * Call a contract view function (read-only, no transaction)
   * @param to - Contract address
   * @param data - Encoded function call data
   * @param from - Optional sender address for context
   * @returns Return data as hex string
   */
  async staticCall(to: H160, data: string, from?: H160): Promise<string> {
    return this.queries.ethCall({
      to,
      from,
      data,
    });
  }

  /**
   * Transfer native tokens via EVM
   * @param signer - Keyring pair to sign the transaction
   * @param evmAddress - EVM address of the sender
   * @param to - Recipient EVM address
   * @param value - Amount to transfer
   * @returns Call result
   */
  async transfer(
    signer: KeyringPair,
    evmAddress: H160,
    to: H160,
    value: U256
  ): Promise<EvmCallResult> {
    return this.callContract(signer, evmAddress, {
      to,
      value,
      gasLimit: 21000n, // Standard transfer gas
    });
  }

  /**
   * Estimate gas for contract deployment
   * @param bytecode - Contract bytecode
   * @returns Estimated gas
   */
  async estimateDeployGas(bytecode: string): Promise<U256> {
    const gas = await this.queries.estimateGas({
      data: bytecode,
    });

    // Add 20% buffer for safety
    return (gas * 120n) / 100n;
  }

  /**
   * Get EVM balance for an address
   * @param address - EVM address
   * @returns Balance info
   */
  async getEvmBalance(address: H160) {
    return this.queries.getEvmBalance(address);
  }

  /**
   * Get transaction count (nonce) for an address
   * @param address - EVM address
   * @returns Transaction count info
   */
  async getTransactionCount(address: H160) {
    return this.queries.getTransactionCount(address);
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Sign and send a create extrinsic, parse result
   */
  private async signAndSendCreate(
    extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>,
    signer: KeyringPair
  ): Promise<EvmCreateResult> {
    return new Promise((resolve, reject) => {
      extrinsic
        .signAndSend(signer, (result: ISubmittableResult) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            const blockHash = result.status.isInBlock
              ? result.status.asInBlock.toString()
              : result.status.asFinalized.toString();

            // Parse events
            const events = result.events.map((e) => e.event);
            const createdEvent = this.parseCreatedEvent(events);
            const logs = this.parseEvmLogs(events);

            // Check for errors
            const hasError = events.some(
              (e) =>
                this.api.events.system.ExtrinsicFailed.is(e) ||
                (e.section === "evm" && e.method === "ExecutedFailed")
            );

            resolve({
              success: !hasError,
              blockHash,
              blockNumber: 0, // Will be filled from header if needed
              txHash: extrinsic.hash.toString(),
              events,
              contractAddress: createdEvent?.address,
              logs,
              gasUsed: createdEvent?.gasUsed,
            });
          }

          if (result.status.isInvalid) {
            reject(new Error("Transaction invalid"));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Sign and send a call extrinsic, parse result
   */
  private async signAndSendCall(
    extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>,
    signer: KeyringPair
  ): Promise<EvmCallResult> {
    return new Promise((resolve, reject) => {
      extrinsic
        .signAndSend(signer, (result: ISubmittableResult) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            const blockHash = result.status.isInBlock
              ? result.status.asInBlock.toString()
              : result.status.asFinalized.toString();

            // Parse events
            const events = result.events.map((e) => e.event);
            const executedEvent = this.parseExecutedEvent(events);
            const logs = this.parseEvmLogs(events);

            // Check for errors
            const hasError = events.some(
              (e) =>
                this.api.events.system.ExtrinsicFailed.is(e) ||
                (e.section === "evm" && e.method === "ExecutedFailed")
            );

            resolve({
              success: !hasError,
              blockHash,
              blockNumber: 0,
              txHash: extrinsic.hash.toString(),
              events,
              returnValue: executedEvent?.returnValue,
              logs,
              gasUsed: executedEvent?.gasUsed,
            });
          }

          if (result.status.isInvalid) {
            reject(new Error("Transaction invalid"));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Parse Created event from EVM pallet events
   */
  private parseCreatedEvent(events: any[]): CreatedEvent | null {
    for (const event of events) {
      if (event.section === "evm" && event.method === "Created") {
        const [address] = event.data;
        return {
          address: address.toString() as H160,
        };
      }
    }
    return null;
  }

  /**
   * Parse Executed event from EVM pallet events
   */
  private parseExecutedEvent(events: any[]): ExecutedEvent | null {
    for (const event of events) {
      if (event.section === "evm" && event.method === "Executed") {
        const [address] = event.data;
        return {
          address: address.toString() as H160,
        };
      }
    }
    return null;
  }

  /**
   * Parse EVM Log events
   */
  private parseEvmLogs(events: any[]): EvmLog[] {
    const logs: EvmLog[] = [];

    for (const event of events) {
      if (event.section === "evm" && event.method === "Log") {
        const [log] = event.data;
        logs.push({
          address: log.address.toString() as H160,
          topics: log.topics.map((t: any) => t.toString() as H256),
          data: log.data.toString(),
        });
      }
    }

    return logs;
  }
}
