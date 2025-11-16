/**
 * EVM client implementation for the Selendra SDK
 * Comprehensive ethers.js v6 compatible EVM interface for Selendra network
 */
export { SelendraEvmClient, WebSocketProvider, HttpProvider, createEvmClient, createWebSocketProvider, createHttpProvider, type ProviderType, type Network, type BlockWithTransactions, type BlockWithHashes, type ProviderOptions } from './client';
export { SELENDRA_EVM_NETWORKS, getSelendraEvmConfig, createDefaultEvmClientConfig, isValidEthereumAddress, isValidPrivateKey, isValidTransactionHash, weiToEther, etherToWei, gweiToWei, formatBalance, parseBalance, GAS_ESTIMATION_DEFAULTS, DEFAULT_TX_OVERRIDES, type SelendraEvmConfig, type EvmClientConfig } from './config';
export { SelendraWallet, ConnectedWallet, MultiSigWallet, WalletUtils, type EvmWallet } from './account';
export { TransactionManager, TransactionBuilder, TransactionTracker, TransactionUtils, TransactionStatus, type GasEstimation, type TransactionOptions } from './transaction';
export { Contract, ERC20Contract, ERC721Contract, ContractFactory, Interface, EventSubscription, type FunctionFragment, type EventFragment, type ParamType, type Fragment, type ContractABI, type CallOptions, type TransactionOptions as ContractTransactionOptions } from './contract';
export { EventManager, EventSubscription as EventSubscriptionManager, EventFilters, EventParser, type EventFilter, type EventSubscriptionOptions, type ParsedEvent, type EventQueryResult } from './events';
export * from './types';
export { SelendraEvmClient as default } from './client';
//# sourceMappingURL=index.d.ts.map