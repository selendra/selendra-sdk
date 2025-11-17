/**
 * Selendra SDK - TypeScript
 *
 * A comprehensive SDK for interacting with the Selendra blockchain.
 *
 * @fileoverview Main entry point for the Selendra SDK
 * @author Selendra Team <team@selendra.org>
 * @license Apache-2.0
 * @version 1.0.0
 */
export { SelendraSDK, createSDK, sdk } from './sdk';
export { Network, ChainType } from './types';
export type { SDKConfig } from './types';
export type * from './types';
export { SelendraEvmClient, WebSocketProvider, HttpProvider, createEvmClient, createWebSocketProvider, createHttpProvider, SelendraWallet, ConnectedWallet, MultiSigWallet, WalletUtils, TransactionManager, TransactionBuilder, TransactionTracker, TransactionUtils, Contract, ERC20Contract, ERC721Contract, ContractFactory, Interface, EventSubscription as EvmEventSubscription, EventManager, EventFilters, EventParser, SELENDRA_EVM_NETWORKS, getSelendraEvmConfig, createDefaultEvmClientConfig, isValidEthereumAddress, isValidPrivateKey, isValidTransactionHash, weiToEther, etherToWei, gweiToWei, formatBalance, parseBalance, GAS_ESTIMATION_DEFAULTS, DEFAULT_TX_OVERRIDES, } from './evm';
export type { ProviderType, Network as EvmNetwork, BlockWithTransactions, BlockWithHashes, ProviderOptions, SelendraEvmConfig, EvmClientConfig, GasEstimation, TransactionOptions, FunctionFragment, EventFragment, ParamType, Fragment, ContractABI, CallOptions, EventFilter, EventSubscriptionOptions, ParsedEvent, EventQueryResult, } from './evm';
export * from './substrate';
export * from './unified';
export { SelendraProvider, useSelendraContext, useSelendra, SelendraContext, useStaking, useAleph, useElections, useUnifiedAccounts, ErrorBoundary, ThemeProvider, } from './react';
export declare const VERSION = "1.0.0";
/**
 * Default timeout for network operations (in milliseconds)
 */
export declare const DEFAULT_TIMEOUT = 30000;
/**
 * Default RPC endpoint for Selendra mainnet
 */
export declare const DEFAULT_SELENDRA_ENDPOINT = "wss://rpc.selendra.org";
/**
 * Default RPC endpoint for Selendra testnet
 */
export declare const DEFAULT_SELENDRA_TESTNET_ENDPOINT = "wss://testnet-rpc.selendra.org";
//# sourceMappingURL=index.d.ts.map