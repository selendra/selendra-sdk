/**
 * Selendra SDK - Main Class
 * 
 * Core SDK class that orchestrates all providers and features
 * 
 * @module core/sdk
 */

import EventEmitter from 'eventemitter3';
import type { ApiPromise } from '@polkadot/api';
import type { JsonRpcProvider } from 'ethers';

import { ChainType, type SDKConfig, type ConnectionInfo, type SDKEvents } from '../types/index.js';
import { SubstrateProvider, EvmProvider } from '../providers/index.js';
import { mergeConfig, validateConfig, Logger } from '../utils/index.js';

/**
 * Main Selendra SDK class
 * 
 * Provides a unified interface for connecting to both Substrate and EVM
 * based Selendra networks.
 * 
 * @example
 * ```typescript
 * // Connect to Substrate chain
 * const sdk = new SelendraSDK({
 *   endpoint: 'wss://rpc.selendra.org',
 *   chainType: ChainType.Substrate,
 * });
 * 
 * await sdk.connect();
 * console.log('Connected:', sdk.getConnectionInfo());
 * await sdk.disconnect();
 * ```
 */
export class SelendraSDK extends EventEmitter<SDKEvents> {
  private config: SDKConfig;
  private provider: SubstrateProvider | EvmProvider | null = null;
  private logger: Logger;
  private isConnecting = false;
  private isConnected = false;
  private connectedAt?: number;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private currentRetryAttempt = 0;

  /**
   * Create a new SelendraSDK instance
   * 
   * @param config - SDK configuration options
   */
  constructor(config: SDKConfig = {}) {
    super();

    // Validate and merge configuration
    validateConfig(config);
    this.config = mergeConfig(config);

    // Initialize logger
    this.logger = new Logger('SelendraSDK', this.config.debug);
    this.logger.debug('SDK initialized with config:', this.config);
  }

  // ==========================================================================
  // Core Connection Methods
  // ==========================================================================

  /**
   * Connect to the blockchain network
   * 
   * Establishes connection to either Substrate or EVM chain based on
   * the chainType configuration.
   * 
   * @throws {Error} If connection fails
   * 
   * @example
   * ```typescript
   * const sdk = new SelendraSDK({ endpoint: 'wss://rpc.selendra.org' });
   * 
   * sdk.on('connecting', () => console.log('Connecting...'));
   * sdk.on('connected', () => console.log('Connected!'));
   * 
   * await sdk.connect();
   * ```
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      this.logger.debug('Already connected');
      return;
    }

    if (this.isConnecting) {
      this.logger.debug('Connection already in progress');
      return;
    }

    this.isConnecting = true;
    this.emit('connecting');
    this.logger.debug(`Connecting to ${this.config.chainType} chain at ${this.config.endpoint}`);

    try {
      const startTime = Date.now();

      // Initialize provider based on chain type
      await this.initializeProvider();

      // Connection successful
      this.isConnected = true;
      this.connectedAt = Date.now();
      this.currentRetryAttempt = 0;

      const latency = Date.now() - startTime;
      this.logger.debug(`Connected successfully in ${latency}ms`);

      this.emit('connected');
    } catch (error) {
      this.logger.error('Connection failed:', error);
      this.isConnected = false;
      this.emit('error', error as Error);

      // Handle auto-reconnect
      if (this.config.autoReconnect && this.currentRetryAttempt < (this.config.retryAttempts || 3)) {
        this.scheduleReconnect();
      }

      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from the blockchain network
   * 
   * Gracefully disconnects from the network and cleans up resources.
   * 
   * @throws {Error} If disconnection fails
   * 
   * @example
   * ```typescript
   * await sdk.disconnect();
   * ```
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected && !this.provider) {
      this.logger.debug('Already disconnected');
      return;
    }

    this.logger.debug('Disconnecting...');

    // Clear any pending reconnect attempts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    try {
      if (this.provider) {
        await this.provider.disconnect();
        this.provider = null;
      }

      // Reset connection state
      this.isConnected = false;
      this.isConnecting = false;
      this.connectedAt = undefined;
      this.currentRetryAttempt = 0;

      this.logger.debug('Disconnected successfully');
      this.emit('disconnected');
    } catch (error) {
      this.logger.error('Disconnection error:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Destroy SDK instance and cleanup all resources
   * 
   * Calls disconnect() and removes all event listeners.
   * After calling destroy(), the SDK instance should not be reused.
   * 
   * @example
   * ```typescript
   * await sdk.destroy();
   * ```
   */
  async destroy(): Promise<void> {
    this.logger.debug('Destroying SDK instance');
    
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    
    await this.disconnect();
    this.removeAllListeners();
    
    // Ensure provider is fully cleaned up
    if (this.provider) {
      this.provider.removeAllListeners();
      this.provider = null;
    }
    
    this.logger.debug('SDK destroyed');
  }

  // ==========================================================================
  // Connection Information
  // ==========================================================================

  /**
   * Get current connection information
   * 
   * @returns {ConnectionInfo} Current connection information
   */
  getConnectionInfo(): ConnectionInfo {
    return {
      endpoint: this.config.endpoint || '',
      network: this.config.network || '',
      chainType: this.config.chainType || ChainType.Substrate,
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      connectedAt: this.connectedAt,
    };
  }

  /**
   * Check if SDK is currently connected
   */
  get connected(): boolean {
    return this.isConnected;
  }

  // ==========================================================================
  // Account & Balance Methods
  // ==========================================================================

  /**
   * Get account balance
   * 
   * For Substrate: Returns free balance in planck (smallest unit)
   * For EVM: Returns balance in wei (smallest unit)
   * 
   * @param address - Account address (SS58 for Substrate, 0x for EVM)
   * @returns Balance as bigint or string
   * 
   * @example
   * ```typescript
   * // Substrate
   * const balance = await sdk.getBalance('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
   * console.log('Balance:', balance.toString(), 'planck');
   * 
   * // EVM
   * const balance = await sdk.getBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
   * console.log('Balance:', balance.toString(), 'wei');
   * ```
   */
  async getBalance(address: string): Promise<bigint | string> {
    if (!this.isConnected || !this.provider) {
      throw new Error('SDK is not connected. Call connect() first.');
    }

    const chainType = this.config.chainType || ChainType.Substrate;

    if (chainType === ChainType.Substrate) {
      const api = this.getApi();
      if (!api) {
        throw new Error('Substrate API not available');
      }

      try {
        const account: any = await api.query.system.account(address);
        return account.data.free.toBigInt();
      } catch (error) {
        throw new Error(
          `Failed to get Substrate balance: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } else {
      const provider = this.getEvmProvider();
      if (!provider) {
        throw new Error('EVM provider not available');
      }

      try {
        const balance = await provider.getBalance(address);
        return balance;
      } catch (error) {
        throw new Error(
          `Failed to get EVM balance: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * Get formatted balance with decimals
   * 
   * Converts balance from smallest unit to main unit
   * For Substrate: planck to SEL (18 decimals)
   * For EVM: wei to SEL (18 decimals)
   * 
   * @param address - Account address
   * @param decimals - Number of decimals (default: 18)
   * @returns Formatted balance as number
   * 
   * @example
   * ```typescript
   * const balance = await sdk.getFormattedBalance('5GrwvaEF...');
   * console.log('Balance:', balance, 'SEL');
   * ```
   */
  async getFormattedBalance(address: string, decimals: number = 18): Promise<number> {
    const balance = await this.getBalance(address);
    const balanceNum = typeof balance === 'bigint' ? balance : BigInt(balance);
    return Number(balanceNum) / Math.pow(10, decimals);
  }

  // ==========================================================================
  // Transaction Methods (EVM only)
  // ==========================================================================

  /**
   * Send native SEL token transfer (EVM only)
   * 
   * @param privateKey - Sender's private key
   * @param to - Recipient address
   * @param amount - Amount in SEL (will be converted to wei)
   * @returns Transaction hash
   * 
   * @example
   * ```typescript
   * const txHash = await sdk.sendTransfer(
   *   '0x...',
   *   '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
   *   '1.5'
   * );
   * console.log('Transaction:', txHash);
   * ```
   */
  async sendTransfer(privateKey: string, to: string, amount: string): Promise<string> {
    if (this.config.chainType !== ChainType.EVM) {
      throw new Error('sendTransfer() is only available for EVM chains');
    }
    if (!(this.provider instanceof EvmProvider)) {
      throw new Error('EVM provider not initialized');
    }
    return this.provider.sendTransfer(privateKey, to, amount);
  }

  /**
   * Send ERC20 token transfer (EVM only)
   * 
   * @param privateKey - Sender's private key
   * @param contractAddress - ERC20 token contract address
   * @param to - Recipient address
   * @param amount - Amount in tokens (human readable)
   * @param decimals - Token decimals (default: 18)
   * @returns Transaction hash
   * 
   * @example
   * ```typescript
   * const txHash = await sdk.sendERC20Transfer(
   *   '0x...',
   *   '0x1234...', // USDT contract
   *   '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
   *   '100',
   *   6 // USDT has 6 decimals
   * );
   * ```
   */
  async sendERC20Transfer(
    privateKey: string,
    contractAddress: string,
    to: string,
    amount: string,
    decimals: number = 18
  ): Promise<string> {
    if (this.config.chainType !== ChainType.EVM) {
      throw new Error('sendERC20Transfer() is only available for EVM chains');
    }
    if (!(this.provider instanceof EvmProvider)) {
      throw new Error('EVM provider not initialized');
    }
    return this.provider.sendERC20Transfer(privateKey, contractAddress, to, amount, decimals);
  }

  /**
   * Execute a custom contract transaction (EVM only)
   * 
   * @param privateKey - Sender's private key
   * @param contractAddress - Smart contract address
   * @param abi - Contract ABI array
   * @param functionName - Function to call
   * @param args - Function arguments
   * @param value - Optional native token value to send (in SEL)
   * @returns Transaction hash
   * 
   * @example
   * ```typescript
   * const txHash = await sdk.executeContractTransaction(
   *   '0x...',
   *   '0x1234...',
   *   contractABI,
   *   'swap',
   *   [tokenIn, tokenOut, amountIn, amountOutMin],
   *   '0.1' // Send 0.1 SEL with transaction
   * );
   * ```
   */
  async executeContractTransaction(
    privateKey: string,
    contractAddress: string,
    abi: string[],
    functionName: string,
    args: any[] = [],
    value?: string
  ): Promise<string> {
    if (this.config.chainType !== ChainType.EVM) {
      throw new Error('executeContractTransaction() is only available for EVM chains');
    }
    if (!(this.provider instanceof EvmProvider)) {
      throw new Error('EVM provider not initialized');
    }
    return this.provider.executeContractTransaction(
      privateKey,
      contractAddress,
      abi,
      functionName,
      args,
      value
    );
  }

  /**
   * Call a contract function (read-only, no gas cost) (EVM only)
   * 
   * @param contractAddress - Smart contract address
   * @param abi - Contract ABI array
   * @param functionName - Function to call
   * @param args - Function arguments
   * @returns Function return value
   * 
   * @example
   * ```typescript
   * const totalSupply = await sdk.callContractFunction(
   *   '0x1234...',
   *   erc20ABI,
   *   'totalSupply',
   *   []
   * );
   * ```
   */
  async callContractFunction(
    contractAddress: string,
    abi: string[],
    functionName: string,
    args: any[] = []
  ): Promise<any> {
    if (this.config.chainType !== ChainType.EVM) {
      throw new Error('callContractFunction() is only available for EVM chains');
    }
    if (!(this.provider instanceof EvmProvider)) {
      throw new Error('EVM provider not initialized');
    }
    return this.provider.callContractFunction(contractAddress, abi, functionName, args);
  }

  /**
   * Get ERC20 token balance (EVM only)
   * 
   * @param contractAddress - ERC20 token contract address
   * @param account - Account address to check
   * @returns Token balance (raw value in smallest unit)
   * 
   * @example
   * ```typescript
   * const balance = await sdk.getERC20Balance(
   *   '0x1234...', // USDT contract
   *   '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
   * );
   * ```
   */
  async getERC20Balance(contractAddress: string, account: string): Promise<string> {
    if (this.config.chainType !== ChainType.EVM) {
      throw new Error('getERC20Balance() is only available for EVM chains');
    }
    if (!(this.provider instanceof EvmProvider)) {
      throw new Error('EVM provider not initialized');
    }
    return this.provider.getERC20Balance(contractAddress, account);
  }

  /**
   * Get ERC20 token information (EVM only)
   * 
   * @param contractAddress - ERC20 token contract address
   * @returns Token info (name, symbol, decimals)
   * 
   * @example
   * ```typescript
   * const info = await sdk.getERC20Info('0x1234...');
   * console.log(info.name, info.symbol, info.decimals);
   * ```
   */
  async getERC20Info(contractAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  }> {
    if (this.config.chainType !== ChainType.EVM) {
      throw new Error('getERC20Info() is only available for EVM chains');
    }
    if (!(this.provider instanceof EvmProvider)) {
      throw new Error('EVM provider not initialized');
    }
    return this.provider.getERC20Info(contractAddress);
  }

  // ==========================================================================
  // Provider Access Methods
  // ==========================================================================

  /**
   * Get the Polkadot API instance (Substrate only)
   * 
   * @returns {ApiPromise | null} Polkadot API instance or null
   * @throws {Error} If called on EVM chain
   */
  getApi(): ApiPromise | null {
    if (this.config.chainType === ChainType.EVM) {
      throw new Error('getApi() is only available for Substrate chains');
    }
    return this.provider instanceof SubstrateProvider ? this.provider.getApi() : null;
  }

  /**
   * Get the ethers provider instance (EVM only)
   * 
   * @returns {JsonRpcProvider | null} Ethers provider or null
   * @throws {Error} If called on Substrate chain
   */
  getEvmProvider(): JsonRpcProvider | null {
    if (this.config.chainType === ChainType.Substrate) {
      throw new Error('getEvmProvider() is only available for EVM chains');
    }
    return this.provider instanceof EvmProvider ? this.provider.getProvider() : null;
  }

  // ==========================================================================
  // Builder Pattern Methods
  // ==========================================================================

  /**
   * Set the endpoint URL
   */
  withEndpoint(endpoint: string): SelendraSDK {
    this.config.endpoint = endpoint;
    return this;
  }

  /**
   * Set the network
   */
  withNetwork(network: string): SelendraSDK {
    this.config.network = network;
    return this;
  }

  /**
   * Set the chain type
   */
  withChainType(chainType: ChainType): SelendraSDK {
    this.config.chainType = chainType;
    return this;
  }

  /**
   * Set multiple configuration options at once
   */
  withOptions(options: Partial<SDKConfig>): SelendraSDK {
    this.config = { ...this.config, ...options };
    this.logger.setDebug(this.config.debug || false);
    return this;
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Initialize the appropriate provider based on chain type
   */
  private async initializeProvider(): Promise<void> {
    const chainType = this.config.chainType || ChainType.Substrate;

    if (chainType === ChainType.EVM) {
      this.provider = new EvmProvider(this.config);
    } else {
      this.provider = new SubstrateProvider(this.config);
    }

    // Forward provider events to SDK
    this.provider.on('connected', () => {
      if (!this.isConnected) {
        this.isConnected = true;
        this.emit('connected');
      }
    });

    this.provider.on('disconnected', () => {
      this.isConnected = false;
      this.emit('disconnected');
      if (this.config.autoReconnect) {
        this.scheduleReconnect();
      }
    });

    this.provider.on('error', (error) => {
      this.emit('error', error);
    });

    // Connect the provider
    await this.provider.connect();
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    const maxAttempts = this.config.retryAttempts || 3;
    
    if (this.currentRetryAttempt >= maxAttempts) {
      this.logger.debug('Max retry attempts reached, giving up');
      return;
    }

    this.currentRetryAttempt++;
    const delay = (this.config.retryDelay || 1000) * this.currentRetryAttempt;

    this.logger.debug(`Scheduling reconnect attempt ${this.currentRetryAttempt}/${maxAttempts} in ${delay}ms`);
    this.emit('reconnecting', this.currentRetryAttempt);

    this.reconnectTimer = setTimeout(() => {
      this.logger.debug('Attempting to reconnect...');
      this.connect().catch((error) => {
        this.logger.error('Reconnection failed:', error);
      });
    }, delay);
  }
}
