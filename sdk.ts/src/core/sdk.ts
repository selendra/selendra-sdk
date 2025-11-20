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

import { ChainType, type SDKConfig, type ConnectionInfo, type SDKEvents } from '../types';
import { SubstrateProvider, EvmProvider } from '../providers';
import { mergeConfig, validateConfig, Logger } from '../utils';

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
    await this.disconnect();
    this.removeAllListeners();
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
