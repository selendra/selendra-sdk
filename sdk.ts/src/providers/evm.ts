/**
 * EVM Provider
 * 
 * Handles connections to EVM-based chains using ethers.js
 * 
 * @module providers/evm
 */

import { ethers } from 'ethers';
import { BaseProvider } from './base';
import type { SDKConfig } from '../types';

/**
 * EVM chain provider
 */
export class EvmProvider extends BaseProvider {
  private provider: ethers.JsonRpcProvider | null = null;

  constructor(config: SDKConfig) {
    super(config);
  }

  /**
   * Connect to EVM chain
   */
  async connect(): Promise<void> {
    if (this._isConnected || this.provider) {
      this.log('Already connected');
      return;
    }

    if (!this.config.endpoint) {
      throw new Error('EVM endpoint is required');
    }

    this.log('Connecting to EVM chain...');

    try {
      // Create ethers provider
      this.provider = new ethers.JsonRpcProvider(
        this.config.endpoint,
        undefined, // Let ethers detect network
        { staticNetwork: true }
      );

      // Test connection by getting network info
      const network = await Promise.race([
        this.provider.getNetwork(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Connection timeout')),
            this.config.timeout || 30000
          )
        ),
      ]);

      this.log(`Connected to EVM network: ${network.name} (Chain ID: ${network.chainId})`);

      // Set up event listeners
      this.setupEventListeners();

      this._isConnected = true;
      this.emit('connected');
    } catch (error) {
      this.provider = null;
      throw new Error(
        `Failed to connect to EVM chain: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Disconnect from EVM chain
   */
  async disconnect(): Promise<void> {
    if (!this.provider) {
      this.log('Already disconnected');
      return;
    }

    this.log('Disconnecting from EVM chain...');

    try {
      // Remove event listeners
      this.provider.removeAllListeners();
      this.provider = null;
      this._isConnected = false;
      this.emit('disconnected');
      this.log('Disconnected successfully');
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Get ethers provider instance
   */
  getClient(): ethers.JsonRpcProvider | null {
    return this.provider;
  }

  /**
   * Get provider instance (alias for getClient)
   */
  getProvider(): ethers.JsonRpcProvider | null {
    return this.provider;
  }

  /**
   * Set up event listeners for the provider
   */
  private setupEventListeners(): void {
    if (!this.provider) return;

    this.provider.on('error', (error: any) => {
      this.log('EVM provider error:', error);
      this.emit('error', error);
    });
  }
}
