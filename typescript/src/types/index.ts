/**
 * Common types used throughout the Selendra SDK
 */

// Core types - export individually to avoid conflicts
export type {
  Address,
  SubstrateAddress,
  EvmAddress,
  SelendraAddress,
  Balance,
  Balance as BalancePrimitive,
  ChainId,
  NetworkId,
  BlockNumber,
  Hash,
  TransactionHash,
  Nonce,
  Timestamp,
  Duration,
  Fee,
  GasConfig,
  NetworkStatus,
  TransactionStatus,
  TransactionResult,
  TokenInfo,
  PaginationOptions,
  QueryFilter,
  SelendraConfig,
  EventData,
  SubscriptionOptions,
  VersionInfo,
} from './common';

// SDK-specific types
export type {
  SDKConfig,
  ConnectionInfo,
  AccountInfo,
  BalanceInfo,
  TransactionInfo,
  ContractInfo,
  BlockInfo,
  EventSubscription,
} from './sdk-types';

export { Network, ChainType } from './sdk-types';

// Network and chain types
export * from './network';
export * from './address';
export * from './hash';
export * from './signature';
export * from './error';
export * from './chain-info';

// Utility exports
export { AddressUtils } from './address';
export { BalanceUtils } from './balance';
export { HashUtils } from './hash';
export { SignatureUtils } from './signature';
export { ErrorFactory, ErrorCode } from './error';

// Balance types (selective export to avoid conflicts)
export type {
  BalanceUnit,
  BalanceFormatOptions,
  BalanceCalculation,
  TransactionFee,
  BalanceTransferOptions,
  TokenBalance,
  MultiTokenBalance,
  BalanceConversionRates,
} from './balance';

// Platform-specific types (selective to avoid duplicates)
export type {
  EvmTransaction,
  EvmTransactionReceipt,
  EvmLog,
  EvmBlock,
  EvmContract,
  EvmTransactionRequest,
} from './evm';

export type {
  SubstrateExtrinsic,
  SubstrateEvent,
  SubstrateBlock,
  RuntimeVersion,
  ChainProperties as SubstrateChainProperties,
} from './substrate';
