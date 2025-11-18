/**
 * Configuration Utility
 * 
 * Loads and validates environment variables for SDK examples
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface Config {
  // Network Endpoints
  rpcEndpoint: string;
  evmRpcEndpoint: string;
  
  // Chain Configuration
  evmChainId: number;
  
  // Private Keys
  privateKey?: string;
  evmPrivateKey?: string;
  
  // Test Accounts
  testAddressSubstrate: string;
  testAddressEvm: string;
  
  // API Configuration
  timeout: number;
  maxRetries: number;
  
  // Debug
  debug: boolean;
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): Config {
    return {
      // Network Endpoints
      rpcEndpoint: process.env.RPC_ENDPOINT || 'wss://rpc.selendra.org',
      evmRpcEndpoint: process.env.EVM_RPC_ENDPOINT || 'https://rpc.selendra.org',
      
      // Chain Configuration
      evmChainId: parseInt(process.env.EVM_CHAIN_ID || '1961', 10),
      
      // Private Keys
      privateKey: process.env.PRIVATE_KEY || undefined,
      evmPrivateKey: process.env.EVM_PRIVATE_KEY || undefined,
      
      // Test Accounts
      testAddressSubstrate: process.env.TEST_ADDRESS_SUBSTRATE || '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      testAddressEvm: process.env.TEST_ADDRESS_EVM || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      
      // API Configuration
      timeout: parseInt(process.env.TIMEOUT || '30000', 10),
      maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
      
      // Debug
      debug: process.env.DEBUG === 'true',
    };
  }

  private validateConfig(): void {
    if (!this.config.rpcEndpoint) {
      throw new Error('RPC_ENDPOINT is required');
    }
  }

  public getConfig(): Config {
    return { ...this.config };
  }

  public getEndpoint(): string {
    return this.config.rpcEndpoint;
  }

  public getEvmEndpoint(): string {
    return this.config.evmRpcEndpoint;
  }

  public hasPrivateKey(): boolean {
    return !!this.config.privateKey && this.config.privateKey.length > 0;
  }

  public hasEvmPrivateKey(): boolean {
    return !!this.config.evmPrivateKey && this.config.evmPrivateKey.length > 0;
  }

  public isDebug(): boolean {
    return this.config.debug;
  }

  public printConfig(): void {
    console.log('📋 Configuration:');
    console.log('  RPC Endpoint:', this.getEndpoint());
    console.log('  EVM RPC Endpoint:', this.config.evmRpcEndpoint);
    console.log('  EVM Chain ID:', this.config.evmChainId);
    console.log('  Timeout:', this.config.timeout + 'ms');
    console.log('  Max Retries:', this.config.maxRetries);
    console.log('  Private Key Set:', this.hasPrivateKey() ? '✅' : '❌');
    console.log('  EVM Private Key Set:', this.hasEvmPrivateKey() ? '✅' : '❌');
    console.log('  Debug Mode:', this.config.debug ? 'ON' : 'OFF');
    console.log();
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance().getConfig();
export const configManager = ConfigManager.getInstance();

// Helper functions
export function getEndpoint(): string {
  return configManager.getEndpoint();
}

export function getEvmEndpoint(): string {
  return configManager.getEvmEndpoint();
}

export function requirePrivateKey(): string {
  const pk = config.privateKey;
  if (!pk) {
    throw new Error('PRIVATE_KEY is required for this example. Please set it in .env file');
  }
  return pk;
}

export function requireEvmPrivateKey(): string {
  const pk = config.evmPrivateKey;
  if (!pk) {
    throw new Error('EVM_PRIVATE_KEY is required for this example. Please set it in .env file');
  }
  return pk;
}
