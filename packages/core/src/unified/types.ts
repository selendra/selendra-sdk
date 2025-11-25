/**
 * Unified Accounts Type Definitions
 * 
 * Types for managing bidirectional mappings between Substrate and EVM addresses
 */

import type { KeyringPair } from '@polkadot/keyring/types';

// Mapping Results
export interface EvmMappingResult {
  /** The mapped EVM address, or null if no mapping exists */
  evmAddress: string | null;
  /** Whether this account has a mapping */
  isMapped: boolean;
  /** Whether the result is using the default address */
  isDefault: boolean;
  /** The default EVM address for this Substrate account */
  defaultAddress: string;
}

export interface SubstrateMappingResult {
  /** The mapped Substrate address, or null if no mapping exists */
  substrateAddress: string | null;
  /** Whether this EVM address has a mapping */
  isMapped: boolean;
  /** Whether the result is using the default address */
  isDefault: boolean;
  /** The default Substrate address for this EVM address */
  defaultAddress: string;
}

export interface MappingInfo {
  /** The original address being queried */
  address: string;
  /** The address it's mapped to, or null if no mapping */
  mappedTo: string | null;
  /** Whether a mapping exists */
  isMapped: boolean;
  /** The default mapping that would be used */
  defaultMapping: string;
  /** Type of the queried address */
  type: 'substrate' | 'evm';
}

// Transaction Options
export interface TransactionOptions {
  /** Whether to wait for finalization (default: true) */
  waitForFinalization?: boolean;
  /** Optional tip to include with the transaction */
  tip?: bigint;
  /** Optional nonce override */
  nonce?: number;
}

// Claim Results
export interface ClaimResult {
  /** Whether the claim was successful */
  success: boolean;
  /** Transaction hash */
  txHash: string;
  /** Block hash (if finalized) */
  blockHash?: string;
  /** Events emitted during the transaction */
  events: ClaimEvent[];
  /** The created mapping */
  mapping: {
    substrate: string;
    evm: string;
  };
  /** Fee breakdown */
  fee: {
    storageFee: bigint;
    transactionFee: bigint;
    total: bigint;
  };
}

export interface ClaimEvent {
  /** Event type */
  type: 'AccountClaimed';
  /** Substrate account ID */
  accountId: string;
  /** EVM address */
  evmAddress: string;
}

// Eligibility Check
export interface EligibilityCheck {
  /** Whether the account is eligible to claim */
  eligible: boolean;
  /** Reasons why the account is not eligible (if applicable) */
  reasons: string[];
  /** Detailed requirements breakdown */
  requirements: {
    hasMapping: boolean;
    sufficientBalance: boolean;
    storageFeeRequired: bigint;
    currentBalance: bigint;
  };
}

// Cost Estimate
export interface CostEstimate {
  /** Storage fee that will be burned */
  storageFee: bigint;
  /** Estimated transaction fee */
  estimatedTxFee: bigint;
  /** Total estimated cost */
  estimatedTotal: bigint;
  /** Balance to be transferred from default account (if exists) */
  balanceTransfer?: bigint;
}

// EIP-712 Types
export interface EIP712Domain {
  /** Protocol name */
  name: string;
  /** Protocol version */
  version: string;
  /** Chain ID */
  chainId: number;
  /** Salt (genesis block hash) */
  salt: string;
}

export interface ClaimMessage {
  /** Encoded Substrate address */
  substrateAddress: Uint8Array;
}

// Error Types
export enum UnifiedAccountError {
  ALREADY_MAPPED = 'Address already has a mapping',
  INVALID_SIGNATURE = 'EIP-712 signature verification failed',
  INSUFFICIENT_BALANCE = 'Insufficient balance for storage fee',
  UNEXPECTED_SIGNATURE_FORMAT = 'Malformed signature',
  NETWORK_ERROR = 'Failed to communicate with chain',
  BOTH_PROVIDERS_REQUIRED = 'Both Substrate and EVM providers required',
  INVALID_ADDRESS = 'Invalid address format',
  SEED_DERIVATION_FAILED = 'Failed to derive EVM key from Substrate account',
}

// Export type for KeyringPair to avoid repeated imports
export type { KeyringPair };
