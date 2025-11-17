/**
 * EVM client implementation for the Selendra SDK
 * Ethers.js v6 compatible EVM interface for Selendra network
 */

// Main client classes
export {
  SelendraEvmClient,
  WebSocketProvider,
  HttpProvider,
  createEvmClient,
  createWebSocketProvider,
  createHttpProvider,
  type ProviderType,
  type Network,
  type BlockWithTransactions,
  type BlockWithHashes,
  type ProviderOptions,
} from './client';

// Configuration and utilities
export {
  SELENDRA_EVM_NETWORKS,
  getSelendraEvmConfig,
  createDefaultEvmClientConfig,
  isValidEthereumAddress,
  isValidPrivateKey,
  isValidTransactionHash,
  weiToEther,
  etherToWei,
  gweiToWei,
  formatBalance,
  parseBalance,
  GAS_ESTIMATION_DEFAULTS,
  DEFAULT_TX_OVERRIDES,
  type SelendraEvmConfig,
  type EvmClientConfig,
} from './config';

// Account and wallet management
export { SelendraWallet, ConnectedWallet, MultiSigWallet, WalletUtils } from './account';

// Transaction management
export {
  TransactionManager,
  TransactionBuilder,
  TransactionTracker,
  TransactionUtils,
  TransactionStatus,
  type GasEstimation,
  type TransactionOptions,
} from './transaction';

// Contract interaction
export {
  Contract,
  ERC20Contract,
  ERC721Contract,
  ContractFactory,
  Interface,
  EventSubscription,
  type FunctionFragment,
  type EventFragment,
  type ParamType,
  type Fragment,
  type ContractABI,
  type CallOptions,
  type TransactionOptions as ContractTransactionOptions,
} from './contract';

// Events and subscriptions
export {
  EventManager,
  EventSubscription as EventSubscriptionManager,
  EventFilters,
  EventParser,
  type EventFilter,
  type EventSubscriptionOptions,
  type ParsedEvent,
  type EventQueryResult,
} from './events';

// Types
export * from './types';

// Default export for convenience
export { SelendraEvmClient as default } from './client';
