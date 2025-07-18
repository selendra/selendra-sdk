/**
 * Development tools and utilities for debugging and testing
 */

import { SelendraSDK } from '../index';
import { createLogger, LogLevel } from './logger';
import { addressUtils, amountUtils } from './helpers';
// timeUtils available for future time-based debugging features
import { createError } from '../types/errors';

const logger = createLogger('DevTools');

export interface TransactionDebugInfo {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
  effectiveGasPrice?: string;
  blockNumber?: number;
  confirmations?: number;
  logs?: any[];
  revertReason?: string;
  debugTrace?: any;
}

export interface NetworkDebugInfo {
  chainId: number;
  blockNumber: number;
  gasPrice: string;
  pendingTransactions: number;
  isHealthy: boolean;
  latency: number;
  lastUpdate: number;
}

export interface WalletDebugInfo {
  address?: string;
  balance?: string;
  nonce?: number;
  chainId?: number;
  connected: boolean;
  provider: string;
}

/**
 * Development tools for debugging and testing
 */
export class DevTools {
  private sdk: SelendraSDK;
  private debugMode: boolean = false;

  constructor(sdk: SelendraSDK) {
    this.sdk = sdk;
  }

  /**
   * Enable debug mode with enhanced logging
   */
  enableDebugMode(): void {
    this.debugMode = true;
    logger.setLevel(LogLevel.DEBUG);
    logger.info('Debug mode enabled');
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.debugMode = false;
    logger.setLevel(LogLevel.INFO);
    logger.info('Debug mode disabled');
  }

  /**
   * Get comprehensive transaction debug information
   */
  async debugTransaction(hash: string): Promise<TransactionDebugInfo> {
    logger.debug('Debugging transaction', { hash });

    try {
      const [tx, receipt] = await Promise.all([
        this.sdk.evm.getTransaction(hash),
        this.sdk.evm.getTransactionReceipt(hash)
      ]);

      const debugInfo: TransactionDebugInfo = {
        hash,
        status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending'
      };

      if (tx) {
        debugInfo.gasPrice = tx.gasPrice?.toString();
      }

      if (receipt) {
        debugInfo.gasUsed = receipt.gasUsed?.toString();
        debugInfo.effectiveGasPrice = receipt.effectiveGasPrice?.toString();
        debugInfo.blockNumber = receipt.blockNumber;
        debugInfo.confirmations = await this.sdk.evm.getBlockNumber() - receipt.blockNumber + 1;
        debugInfo.logs = receipt.logs;

        // Try to get revert reason if transaction failed
        if (receipt.status === 0) {
          debugInfo.revertReason = await this.getRevertReason(hash);
        }
      }

      logger.debug('Transaction debug info', debugInfo);
      return debugInfo;
    } catch (error) {
      logger.error('Failed to debug transaction', { hash, error });
      throw createError.transaction('Failed to debug transaction', error, { hash });
    }
  }

  /**
   * Get network debug information
   */
  async debugNetwork(): Promise<NetworkDebugInfo> {
    logger.debug('Debugging network');

    try {
      const startTime = Date.now();
      
      const [blockNumber, gasPrice, network] = await Promise.all([
        this.sdk.evm.getBlockNumber(),
        this.sdk.evm.getGasPrice(),
        this.sdk.evm.getNetwork()
      ]);

      const latency = Date.now() - startTime;

      const debugInfo: NetworkDebugInfo = {
        chainId: Number(network.chainId),
        blockNumber,
        gasPrice,
        pendingTransactions: 0, // Would need specific provider support
        isHealthy: latency < 5000, // Consider healthy if response < 5s
        latency,
        lastUpdate: Date.now()
      };

      logger.debug('Network debug info', debugInfo);
      return debugInfo;
    } catch (error) {
      logger.error('Failed to debug network', { error });
      throw createError.network('Failed to debug network', error);
    }
  }

  /**
   * Get wallet debug information
   */
  async debugWallet(): Promise<WalletDebugInfo> {
    logger.debug('Debugging wallet');

    const debugInfo: WalletDebugInfo = {
      connected: this.sdk.wallet.isConnected(),
      provider: this.sdk.wallet.getCurrentProvider()?.name || 'none'
    };

    try {
      if (debugInfo.connected) {
        const account = await this.sdk.evm.getAccount();
        debugInfo.address = account;
        debugInfo.balance = await this.sdk.evm.getBalance(account);
        debugInfo.nonce = await this.sdk.evm.getProvider().getTransactionCount(account);
        
        const network = await this.sdk.evm.getNetwork();
        debugInfo.chainId = Number(network.chainId);
      }
    } catch (error) {
      logger.warn('Failed to get wallet details', { error });
    }

    logger.debug('Wallet debug info', debugInfo);
    return debugInfo;
  }

  /**
   * Simulate a transaction without sending it
   */
  async simulateTransaction(transaction: any): Promise<{
    success: boolean;
    gasUsed?: string;
    returnValue?: any;
    revertReason?: string;
    trace?: any;
  }> {
    logger.debug('Simulating transaction', { transaction });

    try {
      // Use eth_call for simulation
      const provider = this.sdk.evm.getProvider();
      
      try {
        const result = await provider.call(transaction);
        const gasUsed = await provider.estimateGas(transaction);

        return {
          success: true,
          gasUsed: gasUsed.toString(),
          returnValue: result
        };
      } catch (error: any) {
        // Transaction would revert
        return {
          success: false,
          revertReason: this.parseRevertReason(error)
        };
      }
    } catch (error) {
      logger.error('Failed to simulate transaction', { error });
      throw createError.transaction('Failed to simulate transaction', error);
    }
  }

  /**
   * Analyze gas usage for a transaction
   */
  async analyzeGasUsage(hash: string): Promise<{
    gasLimit: string;
    gasUsed: string;
    gasPrice: string;
    gasCost: string;
    efficiency: number; // gasUsed / gasLimit
    costInEth: string;
    recommendations: string[];
  }> {
    const debugInfo = await this.debugTransaction(hash);
    
    if (!debugInfo.gasUsed || !debugInfo.gasPrice) {
      throw createError.transaction('Transaction not confirmed or missing gas data');
    }

    const tx = await this.sdk.evm.getTransaction(hash);
    const gasLimit = tx?.gasLimit?.toString() || '0';
    const gasUsed = debugInfo.gasUsed;
    const gasPrice = debugInfo.gasPrice;
    
    const gasCost = (BigInt(gasUsed) * BigInt(gasPrice)).toString();
    const efficiency = Number(gasUsed) / Number(gasLimit);
    const costInEth = amountUtils.format(gasCost, 18, 6);

    const recommendations: string[] = [];
    
    if (efficiency < 0.5) {
      recommendations.push('Gas limit is too high, consider reducing it');
    }
    if (efficiency > 0.95) {
      recommendations.push('Gas limit is very close to usage, consider increasing buffer');
    }
    if (Number(gasPrice) > 50e9) { // > 50 gwei
      recommendations.push('Gas price is high, consider using lower price for non-urgent transactions');
    }

    return {
      gasLimit,
      gasUsed,
      gasPrice,
      gasCost,
      efficiency,
      costInEth,
      recommendations
    };
  }

  /**
   * Get comprehensive SDK status
   */
  async getSDKStatus(): Promise<{
    version: string;
    network: NetworkDebugInfo;
    wallet: WalletDebugInfo;
    connections: {
      evm: boolean;
      substrate: boolean;
      websocket: boolean;
    };
    lastError?: any;
  }> {
    const [network, wallet] = await Promise.all([
      this.debugNetwork().catch(error => ({ error })),
      this.debugWallet().catch(error => ({ error }))
    ]);

    return {
      version: '1.0.1', // Should come from package.json
      network: network as NetworkDebugInfo,
      wallet: wallet as WalletDebugInfo,
      connections: {
        evm: true, // Check if EVM provider is connected
        substrate: this.sdk.substrate.isConnected(),
        websocket: !!this.sdk.ws // Check if WebSocket is connected
      }
    };
  }

  /**
   * Test network connectivity
   */
  async testConnectivity(): Promise<{
    rpc: { success: boolean; latency?: number; error?: string };
    websocket: { success: boolean; latency?: number; error?: string };
    explorer: { success: boolean; latency?: number; error?: string };
  }> {
    const results = {
      rpc: { success: false } as any,
      websocket: { success: false } as any,
      explorer: { success: false } as any
    };

    // Test RPC connectivity
    try {
      const start = Date.now();
      await this.sdk.evm.getBlockNumber();
      results.rpc = { success: true, latency: Date.now() - start };
    } catch (error: any) {
      results.rpc = { success: false, error: error.message };
    }

    // Test WebSocket connectivity
    try {
      const start = Date.now();
      if (this.sdk.ws) {
        await this.sdk.ws.connect();
        results.websocket = { success: true, latency: Date.now() - start };
      }
    } catch (error: any) {
      results.websocket = { success: false, error: error.message };
    }

    // Test Explorer connectivity
    try {
      const start = Date.now();
      const networkConfig = this.sdk.getNetworkConfig();
      const response = await fetch(networkConfig.explorerUrl);
      results.explorer = { 
        success: response.ok, 
        latency: Date.now() - start 
      };
    } catch (error: any) {
      results.explorer = { success: false, error: error.message };
    }

    return results;
  }

  /**
   * Generate test data for development
   */
  generateTestData(): {
    addresses: string[];
    amounts: string[];
    hashes: string[];
    mnemonics: string[];
  } {
    return {
      addresses: [
        '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe',
        '0x8ba1f109551bD432803012645Hac136c',
        '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
        '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB'
      ],
      amounts: ['0.1', '1.0', '10.0', '100.0', '1000.0'],
      hashes: [
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234'
      ],
      mnemonics: [
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        'test test test test test test test test test test test junk'
      ]
    };
  }

  /**
   * Benchmark network operations
   */
  async benchmarkOperations(): Promise<{
    getBalance: number;
    getBlockNumber: number;
    getGasPrice: number;
    estimateGas: number;
  }> {
    const iterations = 5;
    const results = {
      getBalance: 0,
      getBlockNumber: 0,
      getGasPrice: 0,
      estimateGas: 0
    };

    // Benchmark getBalance
    const start1 = Date.now();
    for (let i = 0; i < iterations; i++) {
      await this.sdk.evm.getBalance('0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe');
    }
    results.getBalance = (Date.now() - start1) / iterations;

    // Benchmark getBlockNumber
    const start2 = Date.now();
    for (let i = 0; i < iterations; i++) {
      await this.sdk.evm.getBlockNumber();
    }
    results.getBlockNumber = (Date.now() - start2) / iterations;

    // Benchmark getGasPrice
    const start3 = Date.now();
    for (let i = 0; i < iterations; i++) {
      await this.sdk.evm.getGasPrice();
    }
    results.getGasPrice = (Date.now() - start3) / iterations;

    // Benchmark estimateGas
    const start4 = Date.now();
    for (let i = 0; i < iterations; i++) {
      await this.sdk.evm.estimateGas({
        to: '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe',
        value: '0x1'
      });
    }
    results.estimateGas = (Date.now() - start4) / iterations;

    logger.info('Benchmark results (avg ms per operation)', results);
    return results;
  }

  /**
   * Helper to get revert reason from failed transaction
   */
  private async getRevertReason(_hash: string): Promise<string | undefined> {
    try {
      // This would require additional provider support or trace APIs
      // For now, return undefined
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Parse revert reason from error
   */
  private parseRevertReason(error: any): string {
    const errorMessage = error.message || String(error);
    // error hash parameter available for advanced error parsing
    
    // Try to extract revert reason from common error patterns
    const patterns = [
      /revert (.+)/i,
      /execution reverted: (.+)/i,
      /VM Exception while processing transaction: revert (.+)/i
    ];

    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return errorMessage;
  }
}

/**
 * Create development tools instance
 */
export function createDevTools(sdk: SelendraSDK): DevTools {
  return new DevTools(sdk);
}

/**
 * Quick debug utilities
 */
export const debugUtils = {
  /**
   * Pretty print transaction info
   */
  printTransaction: (tx: any) => {
    console.table({
      Hash: tx.hash,
      From: addressUtils.shorten(tx.from),
      To: addressUtils.shorten(tx.to),
      Value: tx.value ? amountUtils.format(tx.value, 18, 4) + ' ETH' : '0 ETH',
      'Gas Price': tx.gasPrice ? amountUtils.format(tx.gasPrice, 9, 2) + ' gwei' : 'N/A',
      'Gas Limit': tx.gasLimit?.toString() || 'N/A',
      Nonce: tx.nonce?.toString() || 'N/A'
    });
  },

  /**
   * Pretty print balance info
   */
  printBalance: (address: string, balance: string, symbol: string = 'ETH') => {
    console.log(`💰 ${addressUtils.shorten(address)}: ${amountUtils.format(balance, 18, 4)} ${symbol}`);
  },

  /**
   * Pretty print gas prices
   */
  printGasPrices: (prices: any) => {
    console.table({
      Slow: amountUtils.format(prices.slow, 9, 2) + ' gwei',
      Standard: amountUtils.format(prices.standard, 9, 2) + ' gwei',
      Fast: amountUtils.format(prices.fast, 9, 2) + ' gwei',
      Instant: amountUtils.format(prices.instant, 9, 2) + ' gwei'
    });
  }
};