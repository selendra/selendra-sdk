/**
 * Main SelendraSDK class that provides unified access to both Substrate and EVM functionality
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { ethers } from 'ethers';
import type {
  NetworkConfig,
  Network,
  ChainInfo,
  Address,
  Balance,
  SelendraAddress,
  EvmAddress,
  SubstrateAddress,
} from '../types';
import { NETWORKS, getNetworkConfig } from '../types/network';
import { ConnectionManager } from './connection';
import { SubstrateClient } from './substrate';
import { EvmClient } from './evm';
import { UnifiedClient } from './unified';

export { Network };

/**
 * Configuration options for SDK initialization
 */
export interface SDKConfig {
  /** Network endpoint URL */
  endpoint?: string;
  /** Network name or configuration */
  network?: Network | NetworkConfig;
  /** Default address format for Substrate addresses */
  ss58Format?: number;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Auto-connect on initialization */
  autoConnect?: boolean;
  /** Custom provider for Substrate */
  substrateProvider?: WsProvider;
  /** Custom provider for EVM */
  evmProvider?: ethers.JsonRpcProvider;
}

/**
 * Main SelendraSDK class
 *
 * Provides unified access to both Substrate and EVM chains in the Selendra ecosystem.
 * Built on top of @polkadot/api and ethers.js for maximum compatibility.
 *
 * @example
 * ```typescript
 * const sdk = new SelendraSDK()
 *   .withEndpoint('wss://rpc.selendra.org')
 *   .withNetwork(Network.Selendra);
 *
 * const chainInfo = await sdk.chainInfo();
 * const balance = await sdk.getBalance('0x...');
 * ```
 */
export class SelendraSDK {
  private config: SDKConfig;
  private connectionManager: ConnectionManager;
  private substrateClient?: SubstrateClient;
  private evmClient?: EvmClient;
  private unifiedClient?: UnifiedClient;
  private _isConnected = false;

  constructor(config: SDKConfig = {}) {
    this.config = {
      ss58Format: 42, // Default Selendra format
      timeout: 30000,
      autoConnect: false,
      ...config,
    };

    this.connectionManager = new ConnectionManager(this.config);
  }

  /**
   * Configure the RPC endpoint
   */
  withEndpoint(endpoint: string): this {
    this.config.endpoint = endpoint;
    return this;
  }

  /**
   * Configure the network
   */
  withNetwork(network: Network | NetworkConfig): this {
    this.config.network = network;
    return this;
  }

  /**
   * Configure additional options
   */
  withOptions(options: Partial<SDKConfig>): this {
    this.config = { ...this.config, ...options };
    return this;
  }

  /**
   * Connect to the network
   */
  async connect(): Promise<void> {
    if (this._isConnected) {
      return;
    }

    await this.connectionManager.connect();

    // Initialize clients after connection
    const api = await this.connectionManager.getSubstrateApi();
    const provider = await this.connectionManager.getEvmProvider();

    this.substrateClient = new SubstrateClient(api, this.config);
    this.evmClient = new EvmClient(provider, this.config);
    this.unifiedClient = new UnifiedClient(this.substrateClient, this.evmClient);

    this._isConnected = true;
  }

  /**
   * Disconnect from the network
   */
  async disconnect(): Promise<void> {
    await this.connectionManager.disconnect();
    this._isConnected = false;
  }

  /**
   * Check if connected to the network
   */
  isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Get the current network configuration
   */
  getNetwork(): NetworkConfig | undefined {
    if (typeof this.config.network === 'string') {
      return getNetworkConfig(this.config.network);
    }
    return this.config.network;
  }

  /**
   * Get chain information
   */
  async chainInfo(): Promise<ChainInfo> {
    this.ensureConnected();
    return await this.unifiedClient!.chainInfo();
  }

  /**
   * Get the Substrate client
   */
  get substrate(): SubstrateClient {
    this.ensureConnected();
    return this.substrateClient!;
  }

  /**
   * Get the EVM client
   */
  get evm(): EvmClient {
    this.ensureConnected();
    return this.evmClient!;
  }

  /**
   * Get the unified client for cross-chain operations
   */
  get unified(): UnifiedClient {
    this.ensureConnected();
    return this.unifiedClient!;
  }

  /**
   * Create a new account/keyring pair
   */
  createAccount(mnemonic?: string): {
    address: string;
    privateKey: string;
    mnemonic: string;
  } {
    const keyring = new Keyring({ type: 'sr25519', ss58Format: this.config.ss58Format });

    let pair;
    if (mnemonic) {
      pair = keyring.addFromMnemonic(mnemonic);
    } else {
      pair = keyring.addFromUri('//'); // Creates a new account
    }

    return {
      address: pair.address,
      privateKey: pair.address, // Substrate doesn't expose private keys directly
      mnemonic: (pair.meta.mnemonic as string) || mnemonic || '',
    };
  }

  /**
   * Create an EVM account
   */
  createEvmAccount(): {
    address: string;
    privateKey: string;
  } {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  }

  /**
   * Get balance for any address type
   */
  async getBalance(address: Address): Promise<Balance> {
    this.ensureConnected();
    return await this.unifiedClient!.getBalance(address);
  }

  /**
   * Transfer tokens between addresses
   */
  async transfer(
    from: Address,
    to: Address,
    amount: string | number,
    options?: {
      gasLimit?: string;
      gasPrice?: string;
      memo?: string;
    },
  ): Promise<{ hash: string; blockNumber?: number }> {
    this.ensureConnected();
    return await this.unifiedClient!.transfer(from, to, amount, options);
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string): Promise<{
    status: 'pending' | 'success' | 'failed';
    blockNumber?: number;
    blockHash?: string;
    gasUsed?: string;
    effectiveGasPrice?: string;
  }> {
    this.ensureConnected();
    return await this.unifiedClient!.getTransactionStatus(txHash);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations?: number,
  ): Promise<{
    status: 'success' | 'failed';
    blockNumber: number;
    blockHash: string;
    gasUsed: string;
    effectiveGasPrice: string;
  }> {
    this.ensureConnected();
    return await this.unifiedClient!.waitForTransaction(txHash, confirmations);
  }

  /**
   * Convert between different address formats
   */
  convertAddress(address: Address, targetFormat: 'substrate' | 'evm'): Address {
    this.ensureConnected();
    return this.unifiedClient!.convertAddress(address, targetFormat);
  }

  /**
   * Get the underlying @polkadot/api instance
   */
  async getApi(): Promise<ApiPromise> {
    this.ensureConnected();
    return this.connectionManager.getSubstrateApi();
  }

  /**
   * Get the underlying ethers provider
   */
  async getEvmProvider(): Promise<ethers.JsonRpcProvider> {
    this.ensureConnected();
    return this.connectionManager.getEvmProvider();
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    from: Address,
    to: Address,
    amount: string | number,
    data?: string,
  ): Promise<string> {
    this.ensureConnected();
    return await this.unifiedClient!.estimateGas(from, to, amount, data);
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    this.ensureConnected();
    return await this.unifiedClient!.getBlockNumber();
  }

  /**
   * Get block information
   */
  async getBlock(blockNumber: number | 'latest'): Promise<{
    number: number;
    hash: string;
    parentHash: string;
    timestamp: number;
    transactions: string[];
  }> {
    this.ensureConnected();
    return await this.unifiedClient!.getBlock(blockNumber);
  }

  private ensureConnected(): void {
    if (!this._isConnected) {
      throw new Error('SDK not connected. Call connect() first.');
    }
  }
}

/**
 * Create a new SDK instance with default configuration
 */
export function createSDK(config?: SDKConfig): SelendraSDK {
  return new SelendraSDK(config);
}

/**
 * Default SDK instance for convenience
 */
export const sdk = new SelendraSDK();
