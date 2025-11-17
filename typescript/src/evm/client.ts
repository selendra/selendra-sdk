/**
 * EVM Client for the Selendra SDK
 * Provides ethers.js v6 compatible API for interacting with Selendra's EVM
 * Supports full Ethereum JSON-RPC interface, WebSocket connections, and contract interactions
 */

import { EventEmitter } from 'events';
import type { Address, Balance, BlockNumber, BlockHash, NetworkStatus } from '../types/common';
import type { TransactionInfo } from '../types/sdk-types';
import type {
  EvmTransaction,
  EvmTransactionRequest,
  EvmTransactionReceipt,
  EvmBlock,
  EvmLog,
  EvmFilter,
  EvmCallOptions,
  EvmEstimateGasOptions,
} from '../types/evm';
import { SelendraWallet } from './account';
import { TransactionManager, TransactionTracker } from './transaction';
import { Contract, ERC20Contract, ERC721Contract, ContractFactory } from './contract';
import { createDefaultEvmClientConfig, EvmClientConfig, getSelendraEvmConfig } from './config';

/**
 * Provider types
 */
export type ProviderType = 'http' | 'websocket' | 'ipc';

/**
 * Network information
 */
export interface Network {
  name: string;
  chainId: number;
  ensAddress?: Address;
}

/**
 * Block with transactions
 */
export interface BlockWithTransactions extends EvmBlock {
  transactions: EvmTransaction[];
}

/**
 * Block with transaction hashes
 */
export interface BlockWithHashes extends EvmBlock {
  transactions: string[];
}

/**
 * EVM provider options
 */
export interface ProviderOptions {
  /** Provider type */
  type?: ProviderType;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom headers for HTTP requests */
  headers?: Record<string, string>;
  /** WebSocket connection options */
  ws?: {
    /** WebSocket protocol version */
    protocol?: string;
    /** WebSocket origin */
    origin?: string;
    /** Additional WebSocket options */
    options?: Record<string, unknown>;
  };
}

/**
 * EVM client implementation with ethers.js v6 compatibility
 */
export class SelendraEvmClient extends EventEmitter {
  protected readonly config: EvmClientConfig;
  private readonly transactionManager: TransactionManager;
  private network?: Network;
  private blockNumber?: BlockNumber;
  private isReady = false;
  private subscriptions = new Map<string, any>();

  constructor(config: Partial<EvmClientConfig> = {}) {
    super();

    this.config = createDefaultEvmClientConfig(config);
    this.transactionManager = new TransactionManager(this);
    this.setupEventListeners();
  }

  /**
   * Get network information
   */
  async getNetwork(): Promise<Network> {
    if (!this.network) {
      const [chainId, chainIdStr] = await Promise.all([
        this.send('eth_chainId', []),
        this.send('net_version', []),
      ]);

      const networkConfig = getSelendraEvmConfig(this.config.network);

      this.network = {
        name: networkConfig.chainName,
        chainId: typeof chainId === 'string' ? parseInt(chainId, 16) : chainId,
      };
    }

    return this.network;
  }

  /**
   * Get block number
   */
  async getBlockNumber(): Promise<BlockNumber> {
    this.blockNumber = await this.send('eth_blockNumber', []);
    return this.blockNumber;
  }

  /**
   * Get block by number or hash
   */
  async getBlock(
    blockHashOrNumber: BlockHash | BlockNumber | 'latest' | 'earliest' | 'pending',
    includeTransactions?: boolean,
  ): Promise<BlockWithTransactions | BlockWithHashes | null> {
    const block = await this.send('eth_getBlockByNumberOrHash', [
      blockHashOrNumber,
      includeTransactions || false,
    ]);

    if (!block) {
      return null;
    }

    return this.formatBlock(block);
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<EvmTransaction | null> {
    const tx = await this.send('eth_getTransactionByHash', [hash]);
    return tx ? this.formatTransaction(tx) : null;
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash: string): Promise<EvmTransactionReceipt | null> {
    const receipt = await this.send('eth_getTransactionReceipt', [hash]);
    return receipt ? this.formatTransactionReceipt(receipt) : null;
  }

  /**
   * Send transaction
   */
  async sendTransaction(
    signedTransaction: string,
  ): Promise<{ hash: string; wait: () => Promise<EvmTransactionReceipt> }> {
    const hash = await this.send('eth_sendRawTransaction', [signedTransaction]);

    return {
      hash,
      wait: async () => {
        let receipt: EvmTransactionReceipt | null = null;
        let attempts = 0;
        const maxAttempts = 50;

        while (!receipt && attempts < maxAttempts) {
          receipt = await this.getTransactionReceipt(hash);
          if (!receipt) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            attempts++;
          }
        }

        if (!receipt) {
          throw new Error('Transaction receipt not found after timeout');
        }

        return receipt;
      },
    };
  }

  /**
   * Call contract method (read-only)
   */
  async call(transaction: EvmCallOptions, blockTag: string | number = 'latest'): Promise<string> {
    return this.send('eth_call', [transaction, blockTag]);
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(transaction: EvmEstimateGasOptions): Promise<number> {
    const gas = await this.send('eth_estimateGas', [transaction]);
    return Number(gas);
  }

  /**
   * Get gas price
   */
  async getGasPrice(): Promise<string> {
    return this.send('eth_gasPrice', []);
  }

  /**
   * Get max fee per gas (EIP-1559)
   */
  async getMaxFeePerGas(): Promise<string> {
    try {
      return await this.send('eth_maxPriorityFeePerGas', []);
    } catch {
      // Fallback to gas price if EIP-1559 not supported
      return this.getGasPrice();
    }
  }

  /**
   * Get max priority fee per gas (EIP-1559)
   */
  async getMaxPriorityFeePerGas(): Promise<string> {
    try {
      return await this.send('eth_maxPriorityFeePerGas', []);
    } catch {
      // Fallback to gas price if EIP-1559 not supported
      const gasPrice = await this.getGasPrice();
      return (BigInt(gasPrice) / BigInt(2)).toString(); // 50% of gas price
    }
  }

  /**
   * Get balance
   */
  async getBalance(address: Address, blockTag: string | number = 'latest'): Promise<Balance> {
    return this.send('eth_getBalance', [address, blockTag]);
  }

  /**
   * Get transaction count (nonce)
   */
  async getTransactionCount(
    address: Address,
    blockTag: string | number = 'latest',
  ): Promise<number> {
    const count = await this.send('eth_getTransactionCount', [address, blockTag]);
    return Number(count);
  }

  /**
   * Get code at address
   */
  async getCode(address: Address, blockTag: string | number = 'latest'): Promise<string> {
    return this.send('eth_getCode', [address, blockTag]);
  }

  /**
   * Get storage slot value
   */
  async getStorageAt(
    address: Address,
    position: string,
    blockTag: string | number = 'latest',
  ): Promise<string> {
    return this.send('eth_getStorageAt', [address, position, blockTag]);
  }

  /**
   * Get logs
   */
  async getLogs(filter: EvmFilter): Promise<EvmLog[]> {
    return this.send('eth_getLogs', [filter]);
  }

  /**
   * Subscribe to events (WebSocket only)
   */
  async subscribe(
    type: 'newHeads' | 'logs' | 'pendingTransactions',
    params?: any,
  ): Promise<string> {
    if (!this.config.enableSubscriptions) {
      throw new Error('Subscriptions are not enabled');
    }

    const subscriptionId = await this.send('eth_subscribe', [type, params]);
    this.subscriptions.set(subscriptionId, { type, params });

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    const success = await this.send('eth_unsubscribe', [subscriptionId]);
    this.subscriptions.delete(subscriptionId);
    return success;
  }

  /**
   * Create contract instance
   */
  getContract(address: Address, abi: any[]): Contract {
    return new Contract(address, abi, this);
  }

  /**
   * Create ERC20 contract instance
   */
  getERC20Contract(address: Address): ERC20Contract {
    return new ERC20Contract(address, this);
  }

  /**
   * Create ERC721 contract instance
   */
  getERC721Contract(address: Address): ERC721Contract {
    return new ERC721Contract(address, this);
  }

  /**
   * Create contract factory
   */
  getContractFactory(abi: any[], bytecode: string): ContractFactory {
    return ContractFactory.fromContractABI(abi, bytecode, null);
  }

  /**
   * Send JSON-RPC request
   */
  async send(method: string, params: any[] = []): Promise<any> {
    const networkConfig = getSelendraEvmConfig(this.config.network);
    const endpoint = networkConfig.rpcUrls.default.http[0]; // Use first HTTP endpoint

    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message} (${data.error.code})`);
    }

    return data.result;
  }

  /**
   * Batch send multiple requests
   */
  async sendBatch(requests: Array<{ method: string; params?: any[] }>): Promise<any[]> {
    const networkConfig = getSelendraEvmConfig(this.config.network);
    const endpoint = networkConfig.rpcUrls.default.http[0];

    const batchRequest = requests.map((req, index) => ({
      jsonrpc: '2.0',
      id: index + 1,
      method: req.method,
      params: req.params || [],
    }));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(batchRequest),
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data.map((item) => {
        if (item.error) {
          throw new Error(`RPC Error: ${item.error.message} (${item.error.code})`);
        }
        return item.result;
      });
    }

    throw new Error('Invalid batch response format');
  }

  /**
   * Send raw transaction and wait for confirmation
   */
  async sendAndWaitTransaction(
    signedTransaction: string,
    confirmations: number = 1,
  ): Promise<EvmTransactionReceipt> {
    const { hash, wait } = await this.sendTransaction(signedTransaction);
    const receipt = await wait();

    if (confirmations > 1) {
      let currentBlock = await this.getBlockNumber();
      const receiptBlock = Number(receipt.blockNumber);

      while (currentBlock - receiptBlock < confirmations) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        currentBlock = await this.getBlockNumber();
      }
    }

    return receipt;
  }

  /**
   * Wait for transaction
   */
  async waitForTransaction(
    hash: string,
    confirmations: number = 1,
    timeout: number = 300000,
  ): Promise<EvmTransactionReceipt | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const receipt = await this.getTransactionReceipt(hash);

      if (receipt) {
        if (confirmations === 1) {
          return receipt;
        }

        const currentBlock = await this.getBlockNumber();
        const receiptBlock = Number(receipt.blockNumber);

        if (currentBlock - receiptBlock >= confirmations) {
          return receipt;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return null;
  }

  /**
   * Check if address is a contract
   */
  async isContract(address: Address): Promise<boolean> {
    const code = await this.getCode(address);
    return code !== '0x' && code.length > 2;
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    const [network, blockNumber, blockHash, genesisHash, syncing] = await Promise.all([
      this.getNetwork(),
      this.getBlockNumber(),
      this.getBlock('latest'),
      this.send('eth_getBlockByNumber', ['0x0', false]),
      this.send('eth_syncing', []),
    ]);

    return {
      isConnected: true,
      networkName: network.name,
      chainId: network.chainId,
      blockNumber,
      blockHash: blockHash?.hash || '0x',
      genesisHash: genesisHash?.hash || '0x',
      isSyncing: typeof syncing === 'object' ? syncing : false,
      timestamp: Date.now(),
    };
  }

  /**
   * Get transaction manager
   */
  getTransactionManager(): TransactionManager {
    return this.transactionManager;
  }

  /**
   * Get configuration
   */
  getConfig(): EvmClientConfig {
    return { ...this.config };
  }

  /**
   * Check if client is ready
   */
  getIsReady(): boolean {
    return this.isReady;
  }

  /**
   * Reset connection state
   */
  reset(): void {
    this.network = undefined;
    this.blockNumber = undefined;
    this.isReady = false;
    this.emit('reset');
  }

  /**
   * Connect to the EVM network
   * @returns Promise that resolves when connected
   */
  async connect(): Promise<void> {
    if (this.isReady) {
      return;
    }

    try {
      // Initialize connection by fetching network info
      await this.getNetwork();
      this.isReady = true;
      this.emit('connect');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect from the EVM network
   */
  async disconnect(): Promise<void> {
    // Unsubscribe from all active subscriptions
    for (const [subscriptionId] of this.subscriptions) {
      await this.unsubscribe(subscriptionId).catch(() => {
        // Ignore errors during cleanup
      });
    }
    this.subscriptions.clear();

    this.reset();
    this.emit('disconnect');
  }

  /**
   * Get account information for a given address
   * @param address - The account address
   * @returns Account information including balance and nonce
   */
  async getAccount(address: Address): Promise<{
    address: Address;
    balance: Balance;
    nonce: number;
    type: 'evm';
    isActive: boolean;
  }> {
    const [balance, nonce, code] = await Promise.all([
      this.getBalance(address),
      this.getTransactionCount(address),
      this.getCode(address),
    ]);

    return {
      address,
      balance,
      nonce,
      type: 'evm',
      isActive: code !== '0x',
    };
  }

  /**
   * Get Selendra price from oracles
   * Auto-activates when Selendra lists on price oracles
   * @returns Price in USD or null if not listed on oracles
   * @private
   */
  private async getSelendraPrice(): Promise<number | null> {
    const oracles = [
      () => this.fetchFromCoinGecko('selendra'),
      () => this.fetchFromCoinMarketCap('selendra'),
      () => this.fetchFromChainlink('SEL/USD'),
    ];

    for (const oracle of oracles) {
      try {
        const price = await oracle();
        if (price) return price;
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Fetch price from CoinGecko API
   * @param tokenId - CoinGecko token ID
   * @returns Price in USD or null
   * @private
   */
  private async fetchFromCoinGecko(tokenId: string): Promise<number | null> {
    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data[tokenId]?.usd || null;
      } catch (error) {
        if (attempt === maxRetries - 1) {
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
      }
    }

    return null;
  }

  /**
   * Fetch price from CoinMarketCap API
   * @param symbol - Token symbol
   * @returns Price in USD or null
   * @private
   */
  private async fetchFromCoinMarketCap(symbol: string): Promise<number | null> {
    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const apiKey = process.env.COINMARKETCAP_API_KEY || '';
        if (!apiKey) {
          return null;
        }

        const response = await fetch(
          `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol.toUpperCase()}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-CMC_PRO_API_KEY': apiKey,
            },
            signal: AbortSignal.timeout(5000),
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.data?.[symbol.toUpperCase()]?.quote?.USD?.price || null;
      } catch (error) {
        if (attempt === maxRetries - 1) {
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
      }
    }

    return null;
  }

  /**
   * Fetch price from Chainlink oracle
   * @param pair - Trading pair (e.g., 'SEL/USD')
   * @returns Price in USD or null
   * @private
   */
  private async fetchFromChainlink(pair: string): Promise<number | null> {
    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(
          `https://api.chain.link/v1/feeds/${pair.toLowerCase()}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.answer ? Number(data.answer) / 1e8 : null;
      } catch (error) {
        if (attempt === maxRetries - 1) {
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
      }
    }

    return null;
  }

  /**
   * Get balance information for an address
   * @param address - The account address
   * @param options - Additional options for balance retrieval
   * @returns Detailed balance information
   */
  async getBalanceInfo(
    address: Address,
    options: {
      includeUSD?: boolean;
      includeMetadata?: boolean;
    } = {},
  ): Promise<{
    total: Balance;
    free: Balance;
    reserved: Balance;
    frozen: Balance;
    symbol: string;
    decimals: number;
    usd?: number;
    metadata?: Record<string, any>;
  }> {
    const balance = await this.getBalance(address);
    const network = await this.getNetwork();

    const result: any = {
      total: balance,
      free: balance,
      reserved: '0',
      frozen: '0',
      symbol: 'SEL',
      decimals: 18,
    };

    if (options.includeMetadata) {
      result.metadata = {
        network: network.name,
        chainId: network.chainId,
        address,
      };
    }

    if (options.includeUSD) {
      const selPrice = await this.getSelendraPrice();
      if (selPrice !== null) {
        const balanceInSEL = Number(balance) / 1e18;
        result.usd = balanceInSEL * selPrice;
      }
    }

    return result;
  }

  /**
   * Submit a transaction to the network
   * @param transaction - Transaction request or signed transaction string
   * @param options - Transaction options
   * @returns Transaction information
   */
  async submitTransaction(
    transaction: EvmTransactionRequest | string,
    options: {
      autoSign?: boolean;
      waitForInclusion?: boolean;
      waitForFinality?: boolean;
      timeout?: number;
    } = {},
  ): Promise<TransactionInfo> {
    // If transaction is already signed (string), send it directly
    let txHash: string;
    let txRequest: EvmTransactionRequest;

    if (typeof transaction === 'string') {
      const response = await this.sendTransaction(transaction);
      txHash = response.hash;
      // For signed transactions, we don't have the original request details
      txRequest = { from: '', to: '', value: '0', nonce: 0 };
    } else {
      // For unsigned transactions, we need a wallet to sign
      // This is a simplified version - in production you'd use the wallet system
      throw new Error(
        'Unsigned transaction submission requires a wallet. Please provide a signed transaction string.',
      );
    }

    const result: TransactionInfo = {
      hash: txHash,
      from: txRequest.from || '',
      to: txRequest.to,
      value: txRequest.value?.toString() || '0',
      fee: '0', // Will be updated after receipt
      nonce: txRequest.nonce || 0,
      status: 'pending',
      timestamp: Date.now(),
    };

    if (options.waitForInclusion || options.waitForFinality) {
      const receipt = await this.waitForTransaction(
        txHash,
        options.waitForFinality ? 2 : 1,
        options.timeout,
      );

      if (receipt) {
        result.blockNumber = receipt.blockNumber;
        result.status = receipt.status === 1 ? 'included' : 'failed';
        result.fee = (
          BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice || '0')
        ).toString();
      }
    }

    return result;
  }

  /**
   * Get transaction history for an address
   * @param address - The account address
   * @param limit - Maximum number of transactions to return
   * @returns Array of transaction information
   */
  async getTransactionHistory(
    address: Address,
    limit: number = 100,
  ): Promise<
    Array<{
      hash: string;
      blockNumber?: number;
      from: string;
      to?: string;
      value: string;
      fee?: string;
      nonce: number;
      status: string;
      timestamp: number;
    }>
  > {
    const transactions: Array<{
      hash: string;
      blockNumber?: number;
      from: string;
      to?: string;
      value: string;
      fee?: string;
      nonce: number;
      status: string;
      timestamp: number;
    }> = [];

    try {
      const currentBlockNumber = await this.getBlockNumber();
      const startBlock = Math.max(0, currentBlockNumber - 10000);
      let txCount = 0;

      for (let i = currentBlockNumber; i >= startBlock && txCount < limit; i--) {
        try {
          const block = await this.getBlock(i, true);
          if (!block || !('transactions' in block)) {
            continue;
          }

          const blockWithTxs = block as BlockWithTransactions;

          for (const tx of blockWithTxs.transactions) {
            if (txCount >= limit) break;

            if (tx.from.toLowerCase() === address.toLowerCase() ||
                tx.to?.toLowerCase() === address.toLowerCase()) {

              const receipt = await this.getTransactionReceipt(tx.hash);
              const fee = receipt
                ? (BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice || '0')).toString()
                : undefined;

              transactions.push({
                hash: tx.hash,
                blockNumber: tx.blockNumber,
                from: tx.from,
                to: tx.to,
                value: typeof tx.value === 'string' ? tx.value : tx.value?.toString() || '0',
                fee,
                nonce: Number(tx.nonce),
                status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
                timestamp: blockWithTxs.timestamp * 1000,
              });

              txCount++;
            }
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    }

    return transactions;
  }

  /**
   * Get contract instance
   * @param address - Contract address
   * @param options - Contract options including ABI
   * @returns Contract instance
   */
  async getContractInstance(
    address: Address,
    options: {
      abi?: any;
      metadata?: any;
    } = {},
  ): Promise<Contract> {
    if (!options.abi) {
      throw new Error('Contract ABI is required');
    }

    return this.getContract(address, options.abi);
  }

  /**
   * Subscribe to balance changes for an address
   * @param address - The account address
   * @param callback - Callback function when balance changes
   * @returns Unsubscribe function
   */
  subscribeToBalanceChanges(address: Address, callback: (balance: any) => void): () => void {
    let lastBalance: string | null = null;

    // Poll for balance changes
    const interval = setInterval(async () => {
      try {
        const balance = await this.getBalance(address);
        const balanceStr = balance.toString();

        if (lastBalance !== null && balanceStr !== lastBalance) {
          const balanceInfo = await this.getBalanceInfo(address);
          callback(balanceInfo);
        }

        lastBalance = balanceStr;
      } catch (error) {
        this.emit('error', error);
      }
    }, 5000); // Poll every 5 seconds

    // Return unsubscribe function
    return () => {
      clearInterval(interval);
    };
  }

  /**
   * Subscribe to events
   * @param options - Event subscription options
   * @returns Unsubscribe function
   */
  subscribeToEvents(options: { callback: (event: any) => void; filter?: EvmFilter }): () => void {
    const { callback, filter } = options;

    // Use WebSocket subscription if available, otherwise poll
    const subscriptionId = `events-${Date.now()}`;

    const interval = setInterval(async () => {
      try {
        const logs = await this.getLogs(filter || {});
        logs.forEach((log) => {
          callback({
            id: subscriptionId,
            name: 'Log',
            timestamp: Date.now(),
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            data: log,
          });
        });
      } catch (error) {
        this.emit('error', error);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }

  /**
   * Subscribe to new blocks
   * @param options - Block subscription options
   * @returns Unsubscribe function
   */
  subscribeToBlocks(options: {
    callback: (block: any) => void;
    includeTransactions?: boolean;
  }): () => void {
    const { callback, includeTransactions } = options;
    let lastBlockNumber: number | null = null;

    const interval = setInterval(async () => {
      try {
        const currentBlockNumber = await this.getBlockNumber();

        if (lastBlockNumber !== null && currentBlockNumber > lastBlockNumber) {
          const block = await this.getBlock(currentBlockNumber, includeTransactions);
          if (block) {
            callback({
              number: block.number,
              hash: block.hash,
              parentHash: block.parentHash,
              timestamp: block.timestamp,
              transactionCount: Array.isArray(block.transactions) ? block.transactions.length : 0,
            });
          }
        }

        lastBlockNumber = currentBlockNumber;
      } catch (error) {
        this.emit('error', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      clearInterval(interval);
    };
  }

  /**
   * Get current block information
   * @returns Current block information
   */
  async getCurrentBlock(): Promise<{
    number: number;
    hash: string;
    parentHash: string;
    timestamp: number;
    transactionCount: number;
  }> {
    const blockNumber = await this.getBlockNumber();
    const block = (await this.getBlock(blockNumber, false)) as BlockWithHashes;

    if (!block) {
      throw new Error('Failed to fetch current block');
    }

    return {
      number: block.number,
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: block.timestamp,
      transactionCount: block.transactions.length,
    };
  }

  /**
   * Destroy client and cleanup resources
   */
  destroy(): void {
    this.transactionManager.destroy();

    // Unsubscribe from all active subscriptions
    for (const [subscriptionId] of this.subscriptions) {
      this.unsubscribe(subscriptionId).catch(() => {
        // Ignore errors during cleanup
      });
    }
    this.subscriptions.clear();

    this.removeAllListeners();
    this.reset();
  }

  /**
   * Format block data
   */
  private formatBlock(block: any): BlockWithTransactions | BlockWithHashes {
    return {
      hash: block.hash,
      parentHash: block.parentHash,
      number: parseInt(block.number, 16),
      timestamp: parseInt(block.timestamp, 16),
      gasLimit: block.gasLimit,
      gasUsed: block.gasUsed,
      baseFeePerGas: block.baseFeePerGas,
      miner: block.miner,
      extraData: block.extraData,
      logsBloom: block.logsBloom,
      mixHash: block.mixHash,
      nonce: block.nonce,
      difficulty: block.difficulty,
      totalDifficulty: block.totalDifficulty,
      size: parseInt(block.size, 16),
      stateRoot: block.stateRoot,
      transactionsRoot: block.transactionsRoot,
      receiptsRoot: block.receiptsRoot,
      sha3Uncles: block.sha3Uncles,
      transactions: block.transactions,
      uncles: block.uncles,
      withdrawals: block.withdrawals,
    } as BlockWithTransactions | BlockWithHashes;
  }

  /**
   * Format transaction data
   */
  private formatTransaction(tx: any): EvmTransaction {
    return {
      hash: tx.hash,
      nonce: String(tx.nonce || 0),
      blockHash: tx.blockHash,
      blockNumber: tx.blockNumber ? parseInt(tx.blockNumber, 16) : undefined,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gas: tx.gas,
      gasPrice: tx.gasPrice,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      input: tx.input,
      type: tx.type,
      chainId: tx.chainId ? parseInt(tx.chainId, 16) : undefined,
      v: tx.v ? parseInt(tx.v, 16) : undefined,
      r: tx.r,
      s: tx.s,
      amount: tx.value || '0',
      status: 'pending',
    };
  }

  /**
   * Format transaction receipt
   */
  private formatTransactionReceipt(receipt: any): EvmTransactionReceipt {
    return {
      transactionHash: receipt.transactionHash,
      transactionIndex: parseInt(receipt.transactionIndex, 16),
      blockHash: receipt.blockHash,
      blockNumber: parseInt(receipt.blockNumber, 16),
      from: receipt.from,
      to: receipt.to,
      gasUsed: receipt.gasUsed,
      cumulativeGasUsed: receipt.cumulativeGasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
      contractAddress: receipt.contractAddress,
      logs: receipt.logs.map((log: any) => ({
        address: log.address,
        topics: log.topics,
        data: log.data,
        blockHash: log.blockHash,
        blockNumber: log.blockNumber ? parseInt(log.blockNumber, 16) : undefined,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex ? parseInt(log.transactionIndex, 16) : undefined,
        logIndex: parseInt(log.logIndex, 16),
        removed: log.removed,
      })),
      logsBloom: receipt.logsBloom,
      type: receipt.type,
      status: receipt.status ? parseInt(receipt.status, 16) : undefined,
    };
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.transactionManager.on('transactionStatusChanged', (hash, status, receipt) => {
      this.emit('transactionStatusChanged', hash, status, receipt);
    });

    this.transactionManager.on('transactionFinalized', (hash, status, receipt) => {
      this.emit('transactionFinalized', hash, status, receipt);
    });

    this.transactionManager.on('transactionError', (hash, error) => {
      this.emit('transactionError', hash, error);
    });

    // Mark as ready
    setTimeout(() => {
      this.isReady = true;
      this.emit('ready');
    }, 0);
  }
}

/**
 * WebSocket provider for real-time updates
 */
export class WebSocketProvider extends SelendraEvmClient {
  private ws?: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(config: Partial<EvmClientConfig> & { wsUrl?: string } = {}) {
    const networkConfig = getSelendraEvmConfig(config.network || 'mainnet');
    const wsUrl = config.wsUrl || networkConfig.rpcUrls.default.webSocket[0];

    super({
      ...config,
      enableSubscriptions: true,
    });

    this.connectWebSocket(wsUrl);
  }

  /**
   * Connect to WebSocket endpoint
   */
  private connectWebSocket(url: string): void {
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          this.emit('error', new Error(`Invalid WebSocket message: ${error}`));
        }
      };

      this.ws.onclose = () => {
        this.emit('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        this.emit('error', error);
      };
    } catch (error) {
      this.emit('error', error);
      this.attemptReconnect();
    }
  }

  /**
   * Handle WebSocket message
   */
  private handleWebSocketMessage(data: any): void {
    if (data.method === 'eth_subscription') {
      const { params } = data;
      const { subscription, result } = params;

      this.emit('subscription', subscription, result);
      this.emit(`subscription:${subscription}`, result);
    } else if (data.id) {
      // Response to a request
      this.emit('response', data);
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    setTimeout(
      () => {
        this.reconnectAttempts++;
        const networkConfig = getSelendraEvmConfig(this.config.network);
        const wsUrl = networkConfig.rpcUrls.default.webSocket[0];
        this.connectWebSocket(wsUrl);
      },
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
    );
  }

  /**
   * Send WebSocket message
   */
  send(method: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      };

      const onResponse = (data: any) => {
        if (data.id === request.id) {
          this.off('response', onResponse);

          if (data.error) {
            reject(new Error(`RPC Error: ${data.error.message} (${data.error.code})`));
          } else {
            resolve(data.result);
          }
        }
      };

      this.on('response', onResponse);
      this.ws.send(JSON.stringify(request));
    });
  }

  /**
   * Disconnect WebSocket
   */
  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    await super.disconnect();
  }

  /**
   * Destroy WebSocket provider
   */
  destroy(): void {
    // Note: Using then() to avoid making destroy() async
    this.disconnect()
      .then(() => {
        super.destroy();
      })
      .catch(() => {
        super.destroy();
      });
  }
}

/**
 * HTTP provider for basic JSON-RPC calls
 */
export class HttpProvider extends SelendraEvmClient {
  constructor(config: Partial<EvmClientConfig> = {}) {
    super({
      ...config,
      enableSubscriptions: false,
    });
  }
}

/**
 * Factory function to create EVM client
 */
export function createEvmClient(config?: Partial<EvmClientConfig>): SelendraEvmClient {
  return new SelendraEvmClient(config);
}

/**
 * Factory function to create WebSocket provider
 */
export function createWebSocketProvider(
  config?: Partial<EvmClientConfig> & { wsUrl?: string },
): WebSocketProvider {
  return new WebSocketProvider(config);
}

/**
 * Factory function to create HTTP provider
 */
export function createHttpProvider(config?: Partial<EvmClientConfig>): HttpProvider {
  return new HttpProvider(config);
}

// Export the main class as default
export default SelendraEvmClient;
