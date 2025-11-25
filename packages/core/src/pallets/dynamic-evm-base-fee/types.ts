/**
 * Dynamic EVM Base Fee Pallet Types
 *
 * Type definitions for dynamic EVM base fee management
 */

/**
 * Base fee configuration
 */
export interface BaseFeeConfig {
  /** Current base fee per gas */
  baseFeePerGas: bigint;
  /** Elasticity multiplier */
  elasticity: bigint;
  /** Target gas usage ratio */
  targetGasUsage: number;
}

/**
 * Base fee threshold info
 */
export interface BaseFeeThreshold {
  /** Minimum base fee */
  minBaseFee: bigint;
  /** Maximum base fee */
  maxBaseFee: bigint;
  /** Maximum change rate per block */
  maxChangeRate: number;
}

/**
 * Base fee per gas info
 */
export interface BaseFeePerGas {
  /** Current value */
  current: bigint;
  /** Previous value */
  previous?: bigint;
  /** Change from previous */
  change?: bigint;
  /** Change percentage */
  changePercent?: number;
}

/**
 * Fee history entry
 */
export interface FeeHistoryEntry {
  /** Block number */
  blockNumber: number;
  /** Base fee at this block */
  baseFee: bigint;
  /** Gas used in this block */
  gasUsed: bigint;
  /** Gas limit for this block */
  gasLimit: bigint;
  /** Usage ratio */
  usageRatio: number;
}

/**
 * Dynamic base fee constants
 */
export interface DynamicBaseFeeConstants {
  /** Minimum base fee per gas */
  minBaseFeePerGas: bigint;
  /** Maximum base fee per gas */
  maxBaseFeePerGas: bigint;
  /** Step limit for base fee changes */
  stepLimitRatio: bigint;
  /** Target block fullness */
  targetBlockFullness: number;
}

/**
 * Transaction result
 */
export interface DynamicBaseFeeTxResult {
  /** Whether transaction succeeded */
  success: boolean;
  /** Block hash */
  blockHash: string;
  /** Transaction hash */
  txHash: string;
  /** Events */
  events: any[];
}
