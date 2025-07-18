import { SelendraSDKConfig, NetworkConfig } from './types';
import { getNetworkConfig } from './config/networks';
import { EVM } from './evm';
import { Substrate } from './substrate';
import { WalletManager } from './wallet';
import { WebSocketClient } from './utils/websocket';
import { APIClient } from './utils/api';
import { FormatUtils } from './utils/format';

export class SelendraSDK {
  private config: SelendraSDKConfig;
  private networkConfig: NetworkConfig;

  // Core modules
  public evm: EVM;
  public substrate: Substrate;
  public wallet: WalletManager;
  public api: APIClient;
  public ws?: WebSocketClient;

  // Utilities
  public utils: {
    format: typeof FormatUtils;
  };

  constructor(config: SelendraSDKConfig) {
    this.config = config;
    this.networkConfig = getNetworkConfig(config.network);

    // Initialize core modules
    this.evm = new EVM(this.networkConfig, config.provider);
    this.substrate = new Substrate(this.networkConfig, config.substrateEndpoint);
    this.wallet = new WalletManager(this.networkConfig);
    this.api = new APIClient(this.networkConfig);

    // Initialize utilities
    this.utils = {
      format: FormatUtils
    };

    // Initialize WebSocket if available
    if (this.networkConfig.wsUrl) {
      this.ws = new WebSocketClient(this.networkConfig.wsUrl.replace('wss://', 'wss://ws.'));
    }
  }

  /**
   * Initialize SDK connections
   */
  async initialize(): Promise<void> {
    try {
      // Connect to Substrate if needed
      if (this.config.substrateEndpoint || this.networkConfig.wsUrl) {
        await this.substrate.connect();
      }

      // Connect to WebSocket if available
      if (this.ws) {
        await this.ws.connect();
      }

      console.log('Selendra SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
      throw error;
    }
  }

  /**
   * Disconnect from all services
   */
  async disconnect(): Promise<void> {
    try {
      await this.substrate.disconnect();
      await this.wallet.disconnect();
      
      if (this.ws) {
        this.ws.disconnect();
      }

      console.log('Selendra SDK disconnected');
    } catch (error) {
      console.error('Error disconnecting SDK:', error);
    }
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(): NetworkConfig {
    return this.networkConfig;
  }

  /**
   * Get SDK configuration
   */
  getConfig(): SelendraSDKConfig {
    return this.config;
  }

  /**
   * Check if SDK is ready
   */
  isReady(): boolean {
    return this.substrate.isConnected();
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<any> {
    try {
      const [networkStats, blockNumber, chainInfo] = await Promise.all([
        this.api.getNetworkStats(),
        this.evm.getBlockNumber(),
        this.substrate.getChainInfo()
      ]);

      return {
        network: this.networkConfig.name,
        chainId: this.networkConfig.chainId,
        blockNumber,
        networkStats,
        chainInfo
      };
    } catch (error) {
      throw new Error(`Failed to get network status: ${error}`);
    }
  }

  /**
   * Quick connect to wallet
   */
  async connectWallet(providerName?: string): Promise<any> {
    if (providerName) {
      return await this.wallet.connect(providerName);
    } else {
      return await this.wallet.autoConnect();
    }
  }

  /**
   * Get account information from both EVM and Substrate
   */
  async getAccountInfo(address: string): Promise<any> {
    try {
      const [evmBalance, substrateAccount, apiAccount] = await Promise.allSettled([
        this.evm.getFormattedBalance(address),
        this.substrate.getFormattedBalance(address),
        this.api.getAccount(address)
      ]);

      return {
        address,
        evm: {
          balance: evmBalance.status === 'fulfilled' ? evmBalance.value : null,
          error: evmBalance.status === 'rejected' ? evmBalance.reason : null
        },
        substrate: {
          balance: substrateAccount.status === 'fulfilled' ? substrateAccount.value : null,
          error: substrateAccount.status === 'rejected' ? substrateAccount.reason : null
        },
        api: {
          data: apiAccount.status === 'fulfilled' ? apiAccount.value : null,
          error: apiAccount.status === 'rejected' ? apiAccount.reason : null
        }
      };
    } catch (error) {
      throw new Error(`Failed to get account info: ${error}`);
    }
  }

  /**
   * Create WebSocket subscriptions
   */
  async subscribe(): {
    blocks: (callback: (block: any) => void) => Promise<any>;
    transactions: (callback: (tx: any) => void) => Promise<any>;
    addressTransactions: (addresses: string[], callback: (tx: any) => void) => Promise<any>;
    contractEvents: (address: string, topics: string[], callback: (event: any) => void) => Promise<any>;
    gasPrices: (callback: (gasPrice: any) => void) => Promise<any>;
  } {
    if (!this.ws) {
      throw new Error('WebSocket not available');
    }

    return {
      blocks: async (callback) => await this.ws!.subscribeToBlocks(callback),
      transactions: async (callback) => await this.ws!.subscribeToPendingTransactions(callback),
      addressTransactions: async (addresses, callback) => 
        await this.ws!.subscribeToAddressTransactions(addresses, callback),
      contractEvents: async (address, topics, callback) => 
        await this.ws!.subscribeToContractEvents(address, topics, callback),
      gasPrices: async (callback) => await this.ws!.subscribeToGasPrices(callback)
    };
  }

  /**
   * Get development tools
   */
  getDevTools(): {
    faucet: {
      requestTokens: (address: string) => Promise<any>;
      getInfo: () => Promise<any>;
    };
    explorer: {
      search: (query: string) => Promise<any>;
      getTransaction: (hash: string) => Promise<any>;
      getBlock: (number: number) => Promise<any>;
    };
  } {
    return {
      faucet: {
        requestTokens: async (address: string) => await this.api.requestFaucet(address),
        getInfo: async () => await this.api.getFaucetInfo()
      },
      explorer: {
        search: async (query: string) => await this.api.search(query),
        getTransaction: async (hash: string) => await this.api.getTransaction(hash),
        getBlock: async (number: number) => await this.api.getBlock(number)
      }
    };
  }
}

// Export all types and utilities
export * from './types';
export * from './config/networks';
export * from './evm';
export * from './substrate';
export * from './wallet';
export * from './utils/format';
export * from './utils/websocket';
export * from './utils/api';

// Default export
export default SelendraSDK;