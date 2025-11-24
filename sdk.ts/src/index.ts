/**
 * Selendra SDK - TypeScript
 * 
 * Main entry point - exports all public APIs
 * 
 * @module @selendrajs/sdk-core
 * @author Selendra Team <team@selendra.org>
 * @license Apache-2.0
 * @version 1.0.0
 */

// Export main SDK class and factory functions
export { SelendraSDK, createSDK, createAndConnect, sdk } from './core/index.js';

// Export all types and enums
export type { SDKConfig, ConnectionInfo, SDKEvents } from './types/index.js';
export { ChainType, Network } from './types/index.js';

// Export providers for advanced usage
export { BaseProvider, SubstrateProvider, EvmProvider } from './providers/index.js';
export type { BaseProviderEvents } from './providers/index.js';

// Export Unified Accounts
export { UnifiedAccountsManager, UnifiedAccountSignature } from './unified/index.js';
export type {
  EvmMappingResult,
  SubstrateMappingResult,
  MappingInfo,
  ClaimResult,
  ClaimEvent,
  EligibilityCheck,
  CostEstimate,
  TransactionOptions,
  EIP712Domain,
  ClaimMessage,
} from './unified/index.js';
export { UnifiedAccountError } from './unified/index.js';
export {
  calculateDefaultEvmAddress,
  calculateDefaultSubstrateAddress,
  isValidSubstrateAddress,
  isValidEvmAddress,
  getAddressType,
} from './unified/index.js';

// Export utilities for advanced usage
export { Logger, mergeConfig, validateConfig, DEFAULT_CONFIG } from './utils/index.js';
export { SelendraWallet, WalletUtils } from './utils/index.js';
export type { WalletType, EncryptedJson, ProgressCallback } from './utils/index.js';

// Re-export commonly used types from dependencies for convenience
export type { ApiPromise } from '@polkadot/api';
export type { JsonRpcProvider } from 'ethers';

/**
 * Default export for CommonJS compatibility
 */
export { SelendraSDK as default } from './core/index.js';
