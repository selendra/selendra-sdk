/**
 * Ethereum Checked Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for validated Ethereum transactions
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type { CheckedEthereumTx, EthereumCheckedTxResult } from "./types.js";
import { EthereumCheckedQueries } from "./queries.js";

/**
 * Ethereum Checked Manager - handles validated Ethereum transactions
 */
export class EthereumCheckedManager {
  private queries: EthereumCheckedQueries;

  constructor(private api: ApiPromise) {
    this.queries = new EthereumCheckedQueries(api);
  }

  // ==========================================================================
  // Core Extrinsics
  // ==========================================================================

  /**
   * Submit a checked/validated Ethereum transaction
   * @param tx - Signed Ethereum transaction (RLP encoded)
   * @returns Submittable extrinsic
   */
  transact(
    tx: Uint8Array | string
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    if (this.api.tx.ethereumChecked?.transact) {
      return this.api.tx.ethereumChecked.transact(tx);
    }

    // Try alternative pallet name
    if ((this.api.tx as any).ethChecked?.transact) {
      return (this.api.tx as any).ethChecked.transact(tx);
    }

    throw new Error("ethereumChecked.transact not available");
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Submit a checked transaction and wait for confirmation
   * @param signer - Keyring pair (Substrate account)
   * @param tx - Signed Ethereum transaction
   * @returns Transaction result
   */
  async transactAndWait(
    signer: KeyringPair,
    tx: Uint8Array | string
  ): Promise<EthereumCheckedTxResult> {
    const extrinsic = this.transact(tx);
    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Execute an EVM call through the checked pallet
   * @param signer - Substrate account
   * @param to - Target EVM address
   * @param data - Call data
   * @param value - Value to transfer
   * @param options - Additional options
   * @returns Transaction result
   */
  async call(
    signer: KeyringPair,
    to: string,
    data: string = "0x",
    value: bigint = BigInt(0),
    options: {
      gasLimit?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
    } = {}
  ): Promise<EthereumCheckedTxResult> {
    // Build the transaction
    const tx = await this.queries.buildTransaction({
      from: this.getEvmAddress(signer.address),
      to,
      value,
      data,
      ...options,
    });

    // For this to work, we need to encode the transaction
    // In practice, this would use ethers.js or similar to sign
    // and RLP encode the transaction

    // For now, use the simpler EVM pallet call
    if (this.api.tx.evm?.call) {
      const gasLimit = options.gasLimit || tx.gasLimit;
      const maxFeePerGas = options.maxFeePerGas || tx.maxFeePerGas || BigInt(0);

      const extrinsic = this.api.tx.evm.call(
        to,
        data,
        value.toString(),
        gasLimit.toString(),
        maxFeePerGas.toString(),
        null, // max priority fee
        null, // nonce
        [] // access list
      );

      return this.signAndSend(extrinsic, signer);
    }

    throw new Error(
      "Direct checked transaction submission requires signed EVM transaction"
    );
  }

  /**
   * Deploy a contract through the checked pallet
   * @param signer - Substrate account
   * @param bytecode - Contract bytecode
   * @param value - Value to send
   * @param options - Additional options
   * @returns Transaction result with contract address
   */
  async deploy(
    signer: KeyringPair,
    bytecode: string,
    value: bigint = BigInt(0),
    options: {
      gasLimit?: bigint;
      maxFeePerGas?: bigint;
      salt?: string;
    } = {}
  ): Promise<EthereumCheckedTxResult> {
    // Use EVM pallet create if available
    if (this.api.tx.evm?.create) {
      const gasLimit = options.gasLimit || BigInt(3000000);
      const maxFeePerGas = options.maxFeePerGas || BigInt("10000000000");

      const extrinsic = this.api.tx.evm.create(
        bytecode,
        value.toString(),
        gasLimit.toString(),
        maxFeePerGas.toString(),
        null, // max priority fee
        null, // nonce
        [] // access list
      );

      return this.signAndSend(extrinsic, signer, (events) => {
        // Look for Created event
        for (const event of events) {
          if (
            this.api.events.evm?.Created &&
            this.api.events.evm.Created.is(event)
          ) {
            return { contractAddress: event.data[0]?.toString() };
          }
        }
        return {};
      });
    }

    throw new Error("Contract deployment requires EVM pallet");
  }

  // ==========================================================================
  // Query Passthrough
  // ==========================================================================

  /**
   * Check if pallet is available
   */
  isAvailable(): boolean {
    return this.queries.isAvailable();
  }

  /**
   * Get constants
   */
  async getConstants() {
    return this.queries.getConstants();
  }

  /**
   * Validate a transaction
   */
  async validateTransaction(tx: Partial<CheckedEthereumTx>) {
    return this.queries.validateTransaction(tx);
  }

  /**
   * Estimate gas for a call
   */
  async estimateGas(to: string | null, data: string, value?: bigint) {
    return this.queries.estimateGas(to, data, value);
  }

  /**
   * Get nonce for an address
   */
  async getNonce(address: string) {
    return this.queries.getNonce(address);
  }

  /**
   * Get chain ID
   */
  async getChainId() {
    return this.queries.getChainId();
  }

  /**
   * Build a transaction
   */
  async buildTransaction(
    params: Parameters<EthereumCheckedQueries["buildTransaction"]>[0]
  ) {
    return this.queries.buildTransaction(params);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Get EVM address from Substrate address
   * This is a placeholder - actual implementation depends on unified accounts
   */
  private getEvmAddress(substrateAddress: string): string {
    // In a unified accounts setup, the EVM address is derived from Substrate
    // For now, return a placeholder
    return "0x" + "0".repeat(40);
  }

  /**
   * Sign and send an extrinsic
   */
  private async signAndSend(
    extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>,
    signer: KeyringPair,
    extractData?: (events: any[]) => {
      contractAddress?: string;
      ethTxHash?: string;
    }
  ): Promise<EthereumCheckedTxResult> {
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

            // Extract Ethereum transaction hash from events
            let ethTxHash: string | undefined;
            for (const event of events) {
              if ((event as any).section === "ethereum") {
                const data = (event as any).data;
                if (data && data[0]) {
                  ethTxHash = data[0].toHex?.() || data[0].toString();
                }
              }
            }

            const extraData = extractData ? extractData(events) : {};

            resolve({
              success: !hasError,
              blockHash,
              txHash: extrinsic.hash.toString(),
              ethTxHash: ethTxHash || extraData.ethTxHash,
              contractAddress: extraData.contractAddress,
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
