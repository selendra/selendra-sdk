/**
 * Ethereum Checked Pallet Storage Queries
 *
 * Query functions for validated Ethereum transactions
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  CheckedEthereumTx,
  TxValidationResult,
  EthereumCheckedConstants,
} from "./types.js";

/**
 * Ethereum Checked storage queries
 */
export class EthereumCheckedQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Check if the pallet is available
   * @returns True if available
   */
  isAvailable(): boolean {
    return !!(this.api.tx.ethereumChecked || (this.api.tx as any).ethChecked);
  }

  /**
   * Get pallet constants
   * @returns Constants
   */
  async getConstants(): Promise<EthereumCheckedConstants> {
    let maxGasPerTx = BigInt(15000000);
    let baseFee = BigInt("1000000000");

    try {
      const maxGas = (this.api.consts.ethereumChecked as any)?.maxGasLimit;
      if (maxGas) {
        maxGasPerTx = BigInt(maxGas.toString());
      }
    } catch {
      // Use default
    }

    // Get base fee from dynamic base fee pallet
    try {
      const fee = await (
        this.api.query as any
      ).dynamicEvmBaseFee?.baseFeePerGas();
      if (fee) {
        baseFee = BigInt(fee.toString());
      }
    } catch {
      // Use default
    }

    return {
      maxGasPerTx,
      baseFee,
    };
  }

  /**
   * Validate an Ethereum transaction
   * @param tx - Transaction to validate
   * @returns Validation result
   */
  async validateTransaction(
    tx: Partial<CheckedEthereumTx>
  ): Promise<TxValidationResult> {
    const constants = await this.getConstants();

    // Basic validation
    if (!tx.gasLimit) {
      return { valid: false, error: "Gas limit is required" };
    }

    if (tx.gasLimit > constants.maxGasPerTx) {
      return {
        valid: false,
        error: `Gas limit exceeds maximum: ${constants.maxGasPerTx}`,
      };
    }

    if (tx.to && !this.isValidAddress(tx.to)) {
      return { valid: false, error: "Invalid to address" };
    }

    if (tx.value === undefined) {
      tx.value = BigInt(0);
    }

    // Check EIP-1559 fields
    if (tx.maxFeePerGas !== undefined) {
      if (tx.maxFeePerGas < constants.baseFee) {
        return {
          valid: false,
          error: `Max fee per gas below base fee: ${constants.baseFee}`,
        };
      }

      if (
        tx.maxPriorityFeePerGas !== undefined &&
        tx.maxPriorityFeePerGas > tx.maxFeePerGas
      ) {
        return {
          valid: false,
          error: "Max priority fee cannot exceed max fee",
        };
      }
    }

    return {
      valid: true,
      transaction: tx as CheckedEthereumTx,
      estimatedGas: tx.gasLimit,
    };
  }

  /**
   * Estimate gas for a transaction
   * @param to - Target address
   * @param data - Call data
   * @param value - Value to transfer
   * @returns Estimated gas
   */
  async estimateGas(
    to: string | null,
    data: string,
    value: bigint = BigInt(0)
  ): Promise<bigint> {
    try {
      // Use EVM RPC if available
      const result = await this.api.rpc.eth?.estimateGas?.({
        to,
        data,
        value: "0x" + value.toString(16),
      });

      if (result) {
        return BigInt(result.toString());
      }
    } catch {
      // Fall through to default
    }

    // Default gas estimates
    if (!to) {
      // Contract deployment
      return BigInt(1000000);
    }

    if (data === "0x" || data === "") {
      // Simple transfer
      return BigInt(21000);
    }

    // Contract call
    return BigInt(100000);
  }

  /**
   * Get current nonce for an account
   * @param address - EVM address
   * @returns Current nonce
   */
  async getNonce(address: string): Promise<bigint> {
    try {
      const result = await this.api.rpc.eth?.getTransactionCount?.(
        address,
        "latest"
      );
      if (result) {
        return BigInt(result.toString());
      }
    } catch {
      // Fall through
    }

    // Try EVM pallet storage
    try {
      const account = await (this.api.query as any).evm?.accountCodes?.(
        address
      );
      if (account) {
        return BigInt(account.nonce?.toString() || "0");
      }
    } catch {
      // Fall through
    }

    return BigInt(0);
  }

  /**
   * Get current chain ID
   * @returns Chain ID
   */
  async getChainId(): Promise<number> {
    try {
      const result = await this.api.rpc.eth?.chainId?.();
      if (result) {
        return parseInt(result.toString(), 16);
      }
    } catch {
      // Fall through
    }

    // Try from constants
    try {
      const chainId = (this.api.consts.evmChainId as any)?.chainId;
      if (chainId) {
        return parseInt(chainId.toString(), 10);
      }
    } catch {
      // Fall through
    }

    // Default Selendra chain ID
    return 222;
  }

  /**
   * Validate an Ethereum address
   * @param address - Address to validate
   * @returns True if valid
   */
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Build a basic checked transaction
   * @param params - Transaction parameters
   * @returns Built transaction
   */
  async buildTransaction(params: {
    from: string;
    to: string | null;
    value?: bigint;
    data?: string;
    gasLimit?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  }): Promise<CheckedEthereumTx> {
    const [nonce, chainId, constants] = await Promise.all([
      this.getNonce(params.from),
      this.getChainId(),
      this.getConstants(),
    ]);

    const gasLimit =
      params.gasLimit ||
      (await this.estimateGas(
        params.to,
        params.data || "0x",
        params.value || BigInt(0)
      ));

    const maxFeePerGas = params.maxFeePerGas || constants.baseFee * BigInt(2);
    const maxPriorityFeePerGas =
      params.maxPriorityFeePerGas || BigInt("1000000000"); // 1 Gwei

    return {
      hash: "", // Will be set after signing
      nonce,
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasLimit,
      to: params.to,
      value: params.value || BigInt(0),
      input: params.data || "0x",
      chainId,
    };
  }
}
