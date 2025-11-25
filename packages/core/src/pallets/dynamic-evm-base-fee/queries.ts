/**
 * Dynamic EVM Base Fee Pallet Storage Queries
 *
 * Query functions for dynamic EVM base fee
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  BaseFeeConfig,
  BaseFeePerGas,
  DynamicBaseFeeConstants,
  FeeHistoryEntry,
} from "./types.js";

/**
 * Dynamic EVM Base Fee storage queries
 */
export class DynamicEvmBaseFeeQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get the current base fee per gas
   * @returns Current base fee
   */
  async baseFeePerGas(): Promise<BaseFeePerGas> {
    try {
      const result = await this.api.query.dynamicEvmBaseFee.baseFeePerGas();
      return {
        current: BigInt(result.toString()),
      };
    } catch {
      // Try alternative storage location
      try {
        const result = await (this.api.query as any).baseFee?.baseFeePerGas();
        if (result) {
          return {
            current: BigInt(result.toString()),
          };
        }
      } catch {
        // Ignore
      }

      // Default EIP-1559 base fee
      return {
        current: BigInt("1000000000"), // 1 Gwei
      };
    }
  }

  /**
   * Get base fee configuration
   * @returns Base fee config
   */
  async getBaseFeeConfig(): Promise<BaseFeeConfig> {
    const baseFee = await this.baseFeePerGas();

    let elasticity = BigInt(2);
    let targetGasUsage = 50; // 50%

    try {
      const elast = this.api.consts.dynamicEvmBaseFee?.elasticity;
      if (elast) {
        elasticity = BigInt(elast.toString());
      }
    } catch {
      // Use default
    }

    return {
      baseFeePerGas: baseFee.current,
      elasticity,
      targetGasUsage,
    };
  }

  /**
   * Get pallet constants
   * @returns Dynamic base fee constants
   */
  async getConstants(): Promise<DynamicBaseFeeConstants> {
    let minBaseFeePerGas = BigInt("1000000000"); // 1 Gwei
    let maxBaseFeePerGas = BigInt("10000000000000"); // 10000 Gwei
    let stepLimitRatio = BigInt(12); // 12.5% max change
    let targetBlockFullness = 50;

    try {
      const min = (this.api.consts.dynamicEvmBaseFee as any)?.minBaseFeePerGas;
      if (min) {
        minBaseFeePerGas = BigInt(min.toString());
      }
    } catch {
      // Use default
    }

    try {
      const max = (this.api.consts.dynamicEvmBaseFee as any)?.maxBaseFeePerGas;
      if (max) {
        maxBaseFeePerGas = BigInt(max.toString());
      }
    } catch {
      // Use default
    }

    try {
      const step = (this.api.consts.dynamicEvmBaseFee as any)?.stepLimitRatio;
      if (step) {
        stepLimitRatio = BigInt(step.toString());
      }
    } catch {
      // Use default
    }

    return {
      minBaseFeePerGas,
      maxBaseFeePerGas,
      stepLimitRatio,
      targetBlockFullness,
    };
  }

  /**
   * Check if dynamic base fee is enabled
   * @returns True if enabled
   */
  isAvailable(): boolean {
    return !!(
      this.api.query.dynamicEvmBaseFee || (this.api.query as any).baseFee
    );
  }

  /**
   * Get fee history for recent blocks
   * @param blockCount - Number of blocks to fetch
   * @returns Fee history entries
   */
  async getFeeHistory(blockCount: number = 10): Promise<FeeHistoryEntry[]> {
    const history: FeeHistoryEntry[] = [];

    try {
      const currentBlock = await this.api.rpc.chain.getHeader();
      const currentNumber = currentBlock.number.toNumber();

      for (let i = 0; i < blockCount && currentNumber - i > 0; i++) {
        const blockNumber = currentNumber - i;
        const blockHash = await this.api.rpc.chain.getBlockHash(blockNumber);
        const apiAt = await this.api.at(blockHash);

        let baseFee = BigInt("1000000000");
        try {
          const fee = await (
            apiAt.query as any
          ).dynamicEvmBaseFee?.baseFeePerGas();
          if (fee) {
            baseFee = BigInt(fee.toString());
          }
        } catch {
          // Use default
        }

        // Get block to extract gas info
        const block = await this.api.rpc.chain.getBlock(blockHash);
        const gasUsed = BigInt(0); // Would need to sum from receipts
        const gasLimit = BigInt(15000000); // Default block gas limit

        history.push({
          blockNumber,
          baseFee,
          gasUsed,
          gasLimit,
          usageRatio: Number(gasUsed) / Number(gasLimit),
        });
      }
    } catch {
      // Return empty history on error
    }

    return history;
  }

  /**
   * Estimate next base fee based on current usage
   * @param gasUsed - Gas used in current block
   * @param gasLimit - Gas limit of current block
   * @returns Estimated next base fee
   */
  async estimateNextBaseFee(
    gasUsed: bigint,
    gasLimit: bigint
  ): Promise<bigint> {
    const currentFee = await this.baseFeePerGas();
    const constants = await this.getConstants();

    const targetGas = gasLimit / BigInt(2); // 50% target
    const currentBaseFee = currentFee.current;

    if (gasUsed === targetGas) {
      return currentBaseFee;
    }

    if (gasUsed > targetGas) {
      // Increase base fee
      const delta = gasUsed - targetGas;
      const change =
        (currentBaseFee * delta) / targetGas / constants.stepLimitRatio;
      const newFee = currentBaseFee + change;
      return newFee > constants.maxBaseFeePerGas
        ? constants.maxBaseFeePerGas
        : newFee;
    } else {
      // Decrease base fee
      const delta = targetGas - gasUsed;
      const change =
        (currentBaseFee * delta) / targetGas / constants.stepLimitRatio;
      const newFee = currentBaseFee - change;
      return newFee < constants.minBaseFeePerGas
        ? constants.minBaseFeePerGas
        : newFee;
    }
  }

  /**
   * Convert base fee to human-readable format
   * @param baseFee - Base fee in wei
   * @returns Formatted string
   */
  formatBaseFee(baseFee: bigint): string {
    const gwei = Number(baseFee) / 1e9;
    if (gwei >= 1) {
      return `${gwei.toFixed(2)} Gwei`;
    }
    return `${baseFee.toString()} wei`;
  }
}
