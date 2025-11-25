/**
 * Configuration utilities
 * 
 * @module utils/config
 */

import { ChainType, Network, type SDKConfig } from '../types/index.js';

/**
 * Default SDK configuration
 */
export const DEFAULT_CONFIG = {
  endpoint: 'wss://rpc.selendra.org',
  network: Network.Selendra,
  chainType: ChainType.Substrate,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  autoReconnect: true,
  debug: false,
} as const;

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig: SDKConfig = {}): SDKConfig {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: SDKConfig): void {
  if (config.endpoint && typeof config.endpoint !== 'string') {
    throw new Error('endpoint must be a string');
  }

  if (config.timeout !== undefined && (typeof config.timeout !== 'number' || config.timeout <= 0)) {
    throw new Error('timeout must be a positive number');
  }

  if (config.retryAttempts !== undefined && (typeof config.retryAttempts !== 'number' || config.retryAttempts < 0)) {
    throw new Error('retryAttempts must be a non-negative number');
  }

  if (config.retryDelay !== undefined && (typeof config.retryDelay !== 'number' || config.retryDelay < 0)) {
    throw new Error('retryDelay must be a non-negative number');
  }
}
