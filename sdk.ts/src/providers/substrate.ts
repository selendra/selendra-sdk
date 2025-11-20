/**
 * Substrate Provider
 * 
 * Handles connections to Substrate-based chains using Polkadot.js
 * 
 * @module providers/substrate
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { BaseProvider } from './base';
import type { SDKConfig } from '../types';

/**
 * Substrate chain provider
 */
export class SubstrateProvider extends BaseProvider {
  private api: ApiPromise | null = null;

  constructor(config: SDKConfig) {
    super(config);
  }

  /**
   * Connect to Substrate chain
   */
  async connect(): Promise<void> {
    if (this._isConnected || this.api) {
      this.log('Already connected');
      return;
    }

    if (!this.config.endpoint) {
      throw new Error('Substrate endpoint is required');
    }

    this.log('Connecting to Substrate chain...');

    try {
      // Create WebSocket provider
      const wsProvider = new WsProvider(
        this.config.endpoint,
        this.config.retryAttempts || 3
      );

      // Create API instance with timeout
      this.api = await Promise.race([
        ApiPromise.create({ provider: wsProvider }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Connection timeout')),
            this.config.timeout || 30000
          )
        ),
      ]);

      // Get chain info to verify connection
      const [chain, nodeName, nodeVersion] = await Promise.all([
        this.api.rpc.system.chain(),
        this.api.rpc.system.name(),
        this.api.rpc.system.version(),
      ]);

      this.log(`Connected to ${chain}, node: ${nodeName} v${nodeVersion}`);

      // Set up event listeners
      this.setupEventListeners();

      this._isConnected = true;
      this.emit('connected');
    } catch (error) {
      this.api = null;
      throw new Error(
        `Failed to connect to Substrate chain: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Disconnect from Substrate chain
   */
  async disconnect(): Promise<void> {
    if (!this.api) {
      this.log('Already disconnected');
      return;
    }

    this.log('Disconnecting from Substrate chain...');

    try {
      await this.api.disconnect();
      this.api = null;
      this._isConnected = false;
      this.emit('disconnected');
      this.log('Disconnected successfully');
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Get Polkadot API instance
   */
  getClient(): ApiPromise | null {
    return this.api;
  }

  /**
   * Get API instance (alias for getClient)
   */
  getApi(): ApiPromise | null {
    return this.api;
  }

  /**
   * Set up event listeners for the API
   */
  private setupEventListeners(): void {
    if (!this.api) return;

    this.api.on('connected', () => {
      this.log('Substrate API connected');
      if (!this._isConnected) {
        this._isConnected = true;
        this.emit('connected');
      }
    });

    this.api.on('disconnected', () => {
      this.log('Substrate API disconnected');
      this._isConnected = false;
      this.emit('disconnected');
    });

    this.api.on('error', (error: any) => {
      this.log('Substrate API error:', error);
      this.emit('error', error);
    });
  }
}
