/**
 * Ethereum Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for Ethereum pallet (Frontier)
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type {
  H160,
  H256,
  U256,
  TransactParams,
  EthereumTxOptions,
  EthereumReceipt,
  EthereumExecutedEvent,
  AccessListEntry,
} from "./types.js";
import { EthereumQueries } from "./queries.js";
import { EvmQueries } from "../evm/queries.js";

/** Ethereum transaction result */
export interface EthereumTxResult {
  success: boolean;
  blockHash: string;
  blockNumber: number;
  txHash: string;
  ethereumTxHash?: H256;
  events: any[];
  receipt?: EthereumReceipt;
  contractAddress?: H160;
}

/**
 * Ethereum Manager - handles Ethereum pallet extrinsics
 */
export class EthereumManager {
  private queries: EthereumQueries;
  private evmQueries: EvmQueries;

  constructor(private api: ApiPromise) {
    this.queries = new EthereumQueries(api);
    this.evmQueries = new EvmQueries(api);
  }

  // ==========================================================================
  // Core Ethereum Extrinsics
  // ==========================================================================

  /**
   * Create a transact extrinsic for submitting an Ethereum transaction
   * @param params - Transaction parameters (RLP encoded transaction)
   * @returns Submittable extrinsic
   */
  transact(
    params: TransactParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
    return this.api.tx.ethereum.transact(params.transaction);
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Send a signed Ethereum transaction via the Ethereum pallet
   * This is for when you already have a signed RLP-encoded transaction
   * @param signer - Substrate keyring pair
   * @param signedTx - RLP-encoded signed Ethereum transaction
   * @returns Transaction result
   */
  async sendSignedTransaction(
    signer: KeyringPair,
    signedTx: string
  ): Promise<EthereumTxResult> {
    const extrinsic = this.transact({ transaction: signedTx });
    return this.signAndSend(extrinsic, signer);
  }

  /**
   * Send raw Ethereum transaction bytes
   * @param signer - Substrate keyring pair
   * @param rawTx - Raw transaction bytes (hex string)
   * @returns Transaction result
   */
  async sendRawTransaction(
    signer: KeyringPair,
    rawTx: string
  ): Promise<EthereumTxResult> {
    return this.sendSignedTransaction(signer, rawTx);
  }

  /**
   * Wait for transaction receipt
   * @param txHash - Ethereum transaction hash
   * @param timeout - Timeout in milliseconds (default: 60000)
   * @param pollInterval - Poll interval in milliseconds (default: 1000)
   * @returns Receipt or null if timeout
   */
  async waitForReceipt(
    txHash: H256,
    timeout = 60000,
    pollInterval = 1000
  ): Promise<EthereumReceipt | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const receipt = await this.queries.getTransactionReceipt(txHash);
      if (receipt) {
        return receipt;
      }

      await this.sleep(pollInterval);
    }

    return null;
  }

  /**
   * Get transaction by hash
   * @param txHash - Transaction hash
   * @returns Transaction info or null
   */
  async getTransaction(txHash: H256) {
    return this.queries.getTransactionByHash(txHash);
  }

  /**
   * Get transaction receipt
   * @param txHash - Transaction hash
   * @returns Receipt or null
   */
  async getTransactionReceipt(txHash: H256) {
    return this.queries.getTransactionReceipt(txHash);
  }

  /**
   * Get block by hash
   * @param blockHash - Block hash
   * @param fullTransactions - Include full transactions
   * @returns Block info or null
   */
  async getBlockByHash(blockHash: H256, fullTransactions = true) {
    return this.queries.getBlockByHash(blockHash, fullTransactions);
  }

  /**
   * Get block by number
   * @param blockNumber - Block number or tag
   * @param fullTransactions - Include full transactions
   * @returns Block info or null
   */
  async getBlockByNumber(
    blockNumber: U256 | "latest" | "pending" | "earliest",
    fullTransactions = true
  ) {
    return this.queries.getBlockByNumber(blockNumber, fullTransactions);
  }

  /**
   * Get current block number
   * @returns Current block number
   */
  async blockNumber(): Promise<U256> {
    return this.queries.blockNumber();
  }

  /**
   * Get logs matching filter
   * @param filter - Log filter
   * @returns Array of logs
   */
  async getLogs(filter: {
    fromBlock?: U256 | "latest" | "pending" | "earliest";
    toBlock?: U256 | "latest" | "pending" | "earliest";
    address?: string | string[];
    topics?: (string | string[] | null)[];
  }) {
    return this.queries.getLogs(filter);
  }

  /**
   * Get chain ID
   * @returns Chain ID
   */
  async getChainId(): Promise<U256> {
    return this.evmQueries.getChainId();
  }

  /**
   * Get gas price
   * @returns Current gas price
   */
  async getGasPrice(): Promise<U256> {
    return this.evmQueries.getGasPrice();
  }

  /**
   * Get balance for an address
   * @param address - EVM address
   * @returns Balance in wei
   */
  async getBalance(address: H160): Promise<U256> {
    const balance = await this.evmQueries.getEvmBalance(address);
    return balance.balance;
  }

  /**
   * Get transaction count (nonce) for an address
   * @param address - EVM address
   * @returns Transaction count
   */
  async getTransactionCount(address: H160): Promise<U256> {
    const count = await this.evmQueries.getTransactionCount(address);
    return count.nonce;
  }

  /**
   * Call a contract (read-only)
   * @param to - Contract address
   * @param data - Encoded function call
   * @param from - Optional sender address
   * @returns Return data
   */
  async call(to: H160, data: string, from?: H160): Promise<string> {
    return this.evmQueries.ethCall({ to, data, from });
  }

  /**
   * Estimate gas for a transaction
   * @param params - Transaction parameters
   * @returns Estimated gas
   */
  async estimateGas(params: {
    from?: H160;
    to?: H160;
    value?: U256;
    data?: string;
  }): Promise<U256> {
    return this.evmQueries.estimateGas(params);
  }

  /**
   * Get code at an address
   * @param address - EVM address
   * @returns Bytecode
   */
  async getCode(address: H160): Promise<string> {
    const result = await this.evmQueries.accountCodes(address);
    return (
      "0x" +
      Array.from(result.code)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }

  /**
   * Get storage at a position
   * @param address - EVM address
   * @param position - Storage slot
   * @returns Storage value
   */
  async getStorageAt(address: H160, position: H256): Promise<H256> {
    const result = await this.evmQueries.accountStorages(address, position);
    return result.value;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Calculate CREATE address (deployment without salt)
   * @param sender - Sender address
   * @param nonce - Sender nonce
   * @returns Predicted contract address
   */
  calculateCreateAddress(sender: H160, nonce: U256): H160 {
    // RLP encode [sender, nonce] and keccak256 hash
    // Take last 20 bytes
    // This is a simplified version - for production use a proper library
    const nonceHex = nonce === 0n ? "" : nonce.toString(16);
    const rlpNonce =
      nonce === 0n
        ? "80"
        : nonceHex.length % 2
        ? "0" + nonceHex
        : nonceHex.length <= 2
        ? (0x80 + nonceHex.length / 2).toString(16) + nonceHex
        : nonceHex;

    // Note: This is a placeholder - actual implementation would need RLP encoding
    console.warn(
      "calculateCreateAddress: Use ethers.js getContractAddress for production"
    );
    return `0x${"0".repeat(40)}` as H160;
  }

  /**
   * Calculate CREATE2 address (deployment with salt)
   * @param sender - Sender address (factory)
   * @param salt - 32-byte salt
   * @param initCodeHash - Keccak256 hash of init code
   * @returns Predicted contract address
   */
  calculateCreate2Address(sender: H160, salt: H256, initCodeHash: H256): H160 {
    // keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]
    // Note: This is a placeholder - actual implementation would need keccak256
    console.warn(
      "calculateCreate2Address: Use ethers.js getCreate2Address for production"
    );
    return `0x${"0".repeat(40)}` as H160;
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Sign and send an extrinsic, parse result
   */
  private async signAndSend(
    extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>,
    signer: KeyringPair
  ): Promise<EthereumTxResult> {
    return new Promise((resolve, reject) => {
      extrinsic
        .signAndSend(signer, async (result: ISubmittableResult) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            const blockHash = result.status.isInBlock
              ? result.status.asInBlock.toString()
              : result.status.asFinalized.toString();

            // Parse events
            const events = result.events.map((e) => e.event);
            const executedEvent = this.parseExecutedEvent(events);

            // Check for errors
            const hasError = events.some(
              (e) =>
                this.api.events.system.ExtrinsicFailed.is(e) ||
                (e.section === "ethereum" &&
                  e.method === "Executed" &&
                  executedEvent?.exitReason?.type !== "Succeed")
            );

            // Try to get receipt if we have the tx hash
            let receipt: EthereumReceipt | undefined;
            if (executedEvent?.transactionHash) {
              receipt =
                (await this.queries.getTransactionReceipt(
                  executedEvent.transactionHash
                )) || undefined;
            }

            resolve({
              success: !hasError,
              blockHash,
              blockNumber: 0, // Would need to fetch block to get number
              txHash: extrinsic.hash.toString(),
              ethereumTxHash: executedEvent?.transactionHash,
              events,
              receipt,
              contractAddress: receipt?.contractAddress,
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
   * Parse Executed event from Ethereum pallet events
   */
  private parseExecutedEvent(events: any[]): EthereumExecutedEvent | null {
    for (const event of events) {
      if (event.section === "ethereum" && event.method === "Executed") {
        const [from, to, transactionHash, exitReason, extraData] = event.data;

        return {
          from: from.toString() as H160,
          to: to?.toString() as H160 | undefined,
          transactionHash: transactionHash.toString() as H256,
          exitReason: this.parseExitReason(exitReason),
          extraData: extraData?.toString(),
        };
      }
    }
    return null;
  }

  /**
   * Parse exit reason from event data
   */
  private parseExitReason(
    exitReason: any
  ): EthereumExecutedEvent["exitReason"] {
    if (exitReason?.isSucceed) {
      return {
        type: "Succeed",
        reason: exitReason.asSucceed.toString() as any,
      };
    }
    if (exitReason?.isError) {
      return {
        type: "Error",
        error: exitReason.asError.toString() as any,
      };
    }
    if (exitReason?.isRevert) {
      return {
        type: "Revert",
        reason: "Reverted",
      };
    }
    if (exitReason?.isFatal) {
      return {
        type: "Fatal",
        error: exitReason.asFatal.toString() as any,
      };
    }

    return {
      type: "Succeed",
      reason: "Returned",
    };
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
