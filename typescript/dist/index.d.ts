/**
 * Selendra SDK - TypeScript
 *
 * A comprehensive SDK for interacting with the Selendra blockchain.
 *
 * @fileoverview Main entry point for the Selendra SDK
 * @author Selendra Team <team@selendra.org>
 * @license Apache-2.0
 * @version 0.1.0
 */
export { SelendraSDK, Network, createSDK, sdk, type SDKConfig } from './sdk';
export * from './types';
export * from './evm';
export * from './react';
export declare const VERSION = "0.1.0";
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