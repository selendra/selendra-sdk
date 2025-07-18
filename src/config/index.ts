/**
 * Configuration management for the Selendra SDK
 */

import { NetworkConfig, SelendraSDKConfig } from '../types';
import { validateNetworkConfig } from '../utils/validation';
import { createLogger, LogLevel } from '../utils/logger';
import { DEFAULT_GAS_LIMITS, SUPPORTED_NETWORKS, TIME_CONSTANTS } from '../utils/constants';

const logger = createLogger('Config');

export interface SDKConfiguration extends SelendraSDKConfig {
  // Extended configuration options
  timeout?: {
    transaction?: number;
    websocket?: number;
    api?: number;
  };
  retry?: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  };
  gas?: {
    defaultLimits?: Partial<typeof DEFAULT_GAS_LIMITS>;
    priceBuffer?: number; // Percentage buffer for gas price
    limitBuffer?: number; // Percentage buffer for gas limit
  };
  logging?: {
    level?: LogLevel;
    enableStorage?: boolean;
    maxStoredLogs?: number;
  };
  features?: {
    enableWebsockets?: boolean;
    enableAnalytics?: boolean;
    enableDebugLogs?: boolean;
    enableRetryLogic?: boolean;
    enableGasOptimization?: boolean;
    enableMulticall?: boolean;
    enableSubstrate?: boolean;
  };
  development?: {
    enableDevTools?: boolean;
    mockProvider?: boolean;
    testMode?: boolean;
  };
}

/**
 * Default SDK configuration
 */
const DEFAULT_CONFIG: Partial<SDKConfiguration> = {
  timeout: {
    transaction: TIME_CONSTANTS.TRANSACTION_TIMEOUT,
    websocket: TIME_CONSTANTS.WEBSOCKET_TIMEOUT,
    api: 30000 // 30 seconds
  },
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2
  },
  gas: {
    defaultLimits: DEFAULT_GAS_LIMITS,
    priceBuffer: 10, // 10% buffer
    limitBuffer: 20  // 20% buffer
  },
  logging: {
    level: LogLevel.INFO,
    enableStorage: false,
    maxStoredLogs: 1000
  },
  features: {
    enableWebsockets: true,
    enableAnalytics: true,
    enableDebugLogs: false,
    enableRetryLogic: true,
    enableGasOptimization: true,
    enableMulticall: true,
    enableSubstrate: true
  },
  development: {
    enableDevTools: false,
    mockProvider: false,
    testMode: false
  }
};

/**
 * Configuration manager for the SDK
 */
export class ConfigManager {
  private config: SDKConfiguration;
  private networkConfig: NetworkConfig;

  constructor(userConfig: SelendraSDKConfig) {
    // Merge user config with defaults
    this.config = this.mergeConfig(DEFAULT_CONFIG, userConfig);
    
    // Resolve network configuration
    this.networkConfig = this.resolveNetworkConfig(this.config.network);
    
    // Validate configuration
    this.validateConfiguration();
    
    logger.info('Configuration initialized', {
      network: this.networkConfig.name,
      chainId: this.networkConfig.chainId
    });
  }

  /**
   * Get the full SDK configuration
   */
  getConfig(): SDKConfiguration {
    return { ...this.config };
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(): NetworkConfig {
    return { ...this.networkConfig };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SDKConfiguration>): void {
    this.config = this.mergeConfig(this.config, updates);
    this.validateConfiguration();
    logger.info('Configuration updated', { updates });
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof NonNullable<SDKConfiguration['features']>): boolean {
    return this.config.features?.[feature] ?? true;
  }

  /**
   * Get timeout configuration
   */
  getTimeout(type: keyof NonNullable<SDKConfiguration['timeout']>): number {
    return this.config.timeout?.[type] ?? TIME_CONSTANTS.TRANSACTION_TIMEOUT;
  }

  /**
   * Get retry configuration
   */
  getRetryConfig(): NonNullable<SDKConfiguration['retry']> {
    return {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      ...this.config.retry
    };
  }

  /**
   * Get gas configuration
   */
  getGasConfig(): NonNullable<SDKConfiguration['gas']> {
    return {
      defaultLimits: DEFAULT_GAS_LIMITS,
      priceBuffer: 10,
      limitBuffer: 20,
      ...this.config.gas
    };
  }

  /**
   * Check if development mode is enabled
   */
  isDevelopmentMode(): boolean {
    return this.config.development?.testMode ?? false;
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig(): {
    isProduction: boolean;
    isDevelopment: boolean;
    isTest: boolean;
    nodeEnv: string;
  } {
    const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : 'development';
    
    return {
      isProduction: nodeEnv === 'production',
      isDevelopment: nodeEnv === 'development',
      isTest: nodeEnv === 'test',
      nodeEnv
    };
  }

  /**
   * Get default gas limit for operation type
   */
  getDefaultGasLimit(operation: keyof typeof DEFAULT_GAS_LIMITS): number {
    const limits = this.config.gas?.defaultLimits ?? DEFAULT_GAS_LIMITS;
    return limits[operation] ?? DEFAULT_GAS_LIMITS.CONTRACT_CALL;
  }

  /**
   * Apply gas buffer to limit
   */
  applyGasBuffer(gasLimit: string | number): string {
    const buffer = this.config.gas?.limitBuffer ?? 20;
    const gasLimitBig = BigInt(gasLimit);
    const bufferAmount = (gasLimitBig * BigInt(buffer)) / BigInt(100);
    return (gasLimitBig + bufferAmount).toString();
  }

  /**
   * Apply gas price buffer
   */
  applyGasPriceBuffer(gasPrice: string | number): string {
    const buffer = this.config.gas?.priceBuffer ?? 10;
    const gasPriceBig = BigInt(gasPrice);
    const bufferAmount = (gasPriceBig * BigInt(buffer)) / BigInt(100);
    return (gasPriceBig + bufferAmount).toString();
  }

  /**
   * Export configuration for debugging
   */
  exportConfig(): any {
    return {
      config: this.config,
      network: this.networkConfig,
      environment: this.getEnvironmentConfig(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Merge configurations deeply
   */
  private mergeConfig<T extends Record<string, any>>(base: T, override: Partial<T>): T {
    const result = { ...base };
    
    for (const key in override) {
      const value = override[key];
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result[key] = this.mergeConfig(result[key] || {}, value);
        } else {
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * Resolve network configuration from string or object
   */
  private resolveNetworkConfig(network: SelendraSDKConfig['network']): NetworkConfig {
    if (typeof network === 'string') {
      const supportedNetwork = SUPPORTED_NETWORKS[network.toUpperCase() as keyof typeof SUPPORTED_NETWORKS];
      if (!supportedNetwork) {
        throw new Error(`Unsupported network: ${network}`);
      }
      return supportedNetwork;
    }
    
    return network;
  }

  /**
   * Validate the complete configuration
   */
  private validateConfiguration(): void {
    // Validate network configuration
    validateNetworkConfig(this.networkConfig);
    
    // Validate timeout values
    if (this.config.timeout) {
      Object.entries(this.config.timeout).forEach(([key, value]) => {
        if (typeof value !== 'number' || value <= 0) {
          throw new Error(`Invalid timeout.${key}: must be a positive number`);
        }
      });
    }
    
    // Validate retry configuration
    if (this.config.retry) {
      const retry = this.config.retry;
      if (retry.maxAttempts && (retry.maxAttempts < 1 || retry.maxAttempts > 10)) {
        throw new Error('retry.maxAttempts must be between 1 and 10');
      }
      if (retry.baseDelay && retry.baseDelay < 0) {
        throw new Error('retry.baseDelay must be non-negative');
      }
      if (retry.maxDelay && retry.maxDelay < 0) {
        throw new Error('retry.maxDelay must be non-negative');
      }
      if (retry.backoffFactor && retry.backoffFactor <= 0) {
        throw new Error('retry.backoffFactor must be positive');
      }
    }
    
    // Validate gas configuration
    if (this.config.gas) {
      const gas = this.config.gas;
      if (gas.priceBuffer && (gas.priceBuffer < 0 || gas.priceBuffer > 100)) {
        throw new Error('gas.priceBuffer must be between 0 and 100');
      }
      if (gas.limitBuffer && (gas.limitBuffer < 0 || gas.limitBuffer > 100)) {
        throw new Error('gas.limitBuffer must be between 0 and 100');
      }
    }
    
    logger.debug('Configuration validation passed');
  }
}

/**
 * Create configuration presets for common use cases
 */
export const configPresets = {
  /**
   * Development configuration with debugging enabled
   */
  development: (network: 'mainnet' | 'testnet' = 'testnet'): Partial<SDKConfiguration> => ({
    network,
    logging: {
      level: LogLevel.DEBUG,
      enableStorage: true
    },
    features: {
      enableDebugLogs: true
    },
    development: {
      enableDevTools: true,
      testMode: true
    },
    retry: {
      maxAttempts: 2, // Faster feedback in development
      baseDelay: 500
    }
  }),

  /**
   * Production configuration optimized for performance
   */
  production: (network: 'mainnet' | 'testnet' = 'mainnet'): Partial<SDKConfiguration> => ({
    network,
    logging: {
      level: LogLevel.WARN,
      enableStorage: true,
      maxStoredLogs: 500
    },
    features: {
      enableDebugLogs: false,
      enableAnalytics: true
    },
    development: {
      enableDevTools: false,
      testMode: false
    },
    retry: {
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 60000
    }
  }),

  /**
   * Testing configuration
   */
  testing: (): Partial<SDKConfiguration> => ({
    network: 'testnet',
    logging: {
      level: LogLevel.ERROR, // Minimal logging during tests
      enableStorage: false
    },
    development: {
      mockProvider: true,
      testMode: true
    },
    timeout: {
      transaction: 30000, // Shorter timeouts for tests
      api: 10000
    }
  }),

  /**
   * Performance optimized configuration
   */
  performance: (network: 'mainnet' | 'testnet' = 'mainnet'): Partial<SDKConfiguration> => ({
    network,
    features: {
      enableGasOptimization: true,
      enableMulticall: true,
      enableRetryLogic: true
    },
    gas: {
      priceBuffer: 5, // Smaller buffer for cost optimization
      limitBuffer: 10
    },
    retry: {
      maxAttempts: 3,
      baseDelay: 500
    }
  })
};

/**
 * Environment-based configuration loader
 */
export function loadEnvironmentConfig(): Partial<SDKConfiguration> {
  if (typeof process === 'undefined') {
    return {}; // Browser environment
  }

  const config: Partial<SDKConfiguration> = {};

  // Load from environment variables
  if (process.env.SELENDRA_NETWORK) {
    config.network = process.env.SELENDRA_NETWORK as any;
  }

  if (process.env.SELENDRA_LOG_LEVEL) {
    config.logging = {
      level: LogLevel[process.env.SELENDRA_LOG_LEVEL.toUpperCase() as keyof typeof LogLevel]
    };
  }

  if (process.env.SELENDRA_RETRY_ATTEMPTS) {
    config.retry = {
      maxAttempts: parseInt(process.env.SELENDRA_RETRY_ATTEMPTS)
    };
  }

  if (process.env.NODE_ENV === 'development') {
    Object.assign(config, configPresets.development());
  } else if (process.env.NODE_ENV === 'production') {
    Object.assign(config, configPresets.production());
  } else if (process.env.NODE_ENV === 'test') {
    Object.assign(config, configPresets.testing());
  }

  return config;
}