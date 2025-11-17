/**
 * Connection manager for handling Substrate and EVM providers
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { ethers } from 'ethers';

import type { NetworkConfig } from '../types/network';

import type { SDKConfig } from './index';

/**
 * Manages connections to both Substrate and EVM endpoints
 */
export class ConnectionManager {
  private config: SDKConfig;
  private substrateApi?: ApiPromise;
  private evmProvider?: ethers.JsonRpcProvider;
  private networkConfig?: NetworkConfig;

  constructor(config: SDKConfig) {
    this.config = config;
  }

  /**
   * Connect to the configured networks
   */
  async connect(): Promise<void> {
    // Determine network configuration
    if (this.config.network) {
      if (typeof this.config.network === 'string') {
        // Network is a string identifier
        this.networkConfig = this.getNetworkById(this.config.network);
      } else {
        // Network is already a NetworkConfig object
        this.networkConfig = this.config.network;
      }
    }

    // Initialize Substrate connection
    await this.connectSubstrate();

    // Initialize EVM connection
    await this.connectEvm();
  }

  /**
   * Disconnect from all networks
   */
  async disconnect(): Promise<void> {
    if (this.substrateApi) {
      await this.substrateApi.disconnect();
      this.substrateApi = undefined;
    }

    this.evmProvider = undefined;
  }

  /**
   * Get the Substrate API instance
   */
  async getSubstrateApi(): Promise<ApiPromise> {
    if (!this.substrateApi) {
      throw new Error('Substrate API not initialized. Call connect() first.');
    }
    return this.substrateApi;
  }

  /**
   * Get the EVM provider instance
   */
  async getEvmProvider(): Promise<ethers.JsonRpcProvider> {
    if (!this.evmProvider) {
      throw new Error('EVM provider not initialized. Call connect() first.');
    }
    return this.evmProvider;
  }

  /**
   * Get the current network configuration
   */
  getNetworkConfig(): NetworkConfig | undefined {
    return this.networkConfig;
  }

  private async connectSubstrate(): Promise<void> {
    if (this.config.substrateProvider) {
      // Use custom Substrate provider
      this.substrateApi = await ApiPromise.create({
        provider: this.config.substrateProvider,
        throwOnConnect: true
      });
    } else {
      // Create provider from endpoint or network config
      let endpoint = this.config.endpoint;

      if (!endpoint && this.networkConfig) {
        // Use WebSocket endpoint from network config
        endpoint = this.networkConfig.wsEndpoints?.[0] || this.networkConfig.rpcEndpoints[0];
      }

      if (!endpoint) {
        throw new Error('No Substrate endpoint configured');
      }

      // Convert HTTP endpoint to WebSocket if needed
      if (endpoint.startsWith('http://')) {
        endpoint = endpoint.replace('http://', 'ws://').replace(':9933', ':9944');
      } else if (endpoint.startsWith('https://')) {
        endpoint = endpoint.replace('https://', 'wss://').replace(':9933', ':9944');
      }

      const provider = new WsProvider(endpoint, this.config.timeout);

      this.substrateApi = await ApiPromise.create({
        provider,
        throwOnConnect,
        initWasm: true
      });
    }

    // Wait for API to be ready
    await this.substrateApi.isReady;
  }

  private async connectEvm(): Promise<void> {
    if (this.config.evmProvider) {
      // Use custom EVM provider
      this.evmProvider = this.config.evmProvider;
    } else {
      // Create provider from endpoint or network config
      let endpoint = this.config.endpoint;

      if (!endpoint && this.networkConfig) {
        // Use HTTP endpoint from network config
        endpoint = this.networkConfig.rpcEndpoints[0];
      }

      if (!endpoint) {
        throw new Error('No EVM endpoint configured');
      }

      // Convert WebSocket endpoint to HTTP if needed
      if (endpoint.startsWith('ws://')) {
        endpoint = endpoint.replace('ws://', 'http://').replace(':9944', ':9933');
      } else if (endpoint.startsWith('wss://')) {
        endpoint = endpoint.replace('wss://', 'https://').replace(':9944', ':9933');
      }

      this.evmProvider = new ethers.JsonRpcProvider(endpoint, {
        chainId: this.getChainId(),
        name: this.networkConfig?.name || 'selendra'
      });
    }

    // Test the connection
    try {
      await this.evmProvider.getBlockNumber();
    } catch (error) {
      console.warn('EVM provider connection test failed:', error);
    }
  }

  private getNetworkById(networkId: string): NetworkConfig | undefined {
    // Import here to avoid circular dependencies
    const { getNetworkConfig } = require('../types/network');
    return getNetworkConfig(networkId);
  }

  private getChainId(): number {
    if (this.networkConfig?.chainId) {
      // Try to parse as number first, then look up known chain IDs
      if (typeof this.networkConfig.chainId === 'number') {
        return this.networkConfig.chainId;
      }

      // Known chain IDs
      const chainIds: Record<string, number> = {
        'selendra': 1001,
        'selendra_testnet': 1002,
        'localhost': 1337
      };

      return chainIds[this.networkConfig.chainId] || 1001;
    }

    return 1001; // Default Selendra mainnet
  }
}

// Helper for throwOnConnect option
const throwOnConnect = true;