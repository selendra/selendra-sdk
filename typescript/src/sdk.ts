/**
 * Selendra SDK - Main Class
 *
 * SDK for interacting with the Selendra blockchain.
 * Supports both Substrate and EVM chains with unified interface.
 *
 * @author Selendra Team <team@selendra.org>
 * @license Apache-2.0
 * @version 1.0.0
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { u8aToHex, hexToU8a } from '@polkadot/util';
import { blake2AsHex } from '@polkadot/util-crypto';
import { EventEmitter } from 'eventemitter3';

import {
  Network,
  ChainType,
  type SDKConfig,
  type ConnectionInfo,
  type AccountInfo,
  type BalanceInfo,
  type TransactionInfo,
  type ContractInfo,
  type BlockInfo,
  type EventSubscription,
  type SelendraError,
} from './types';

import { SelendraEvmClient } from './evm';

/**
 * Main Selendra SDK class
 */
export class SelendraSDK extends EventEmitter {
  private api: ApiPromise | null = null;
  private evmClient: SelendraEvmClient | null = null;
  private config: SDKConfig;
  private isConnecting = false;
  private isConnected = false;

  constructor(config: SDKConfig = {}) {
    super();
    this.config = {
      endpoint: 'wss://rpc.selendra.org',
      network: Network.Selendra,
      chainType: ChainType.Substrate,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * Connect to the blockchain
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.isConnecting = true;
    this.emit('connecting');

    try {
      if (this.config.chainType === ChainType.EVM) {
        await this.connectEVM();
      } else {
        await this.connectSubstrate();
      }

      this.isConnected = true;
      this.emit('connected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from the blockchain
   */
  async disconnect(): Promise<void> {
    try {
      if (this.api) {
        await this.api.disconnect();
        this.api = null;
      }

      if (this.evmClient) {
        await this.evmClient.disconnect();
        this.evmClient = null;
      }

      this.isConnected = false;
      this.emit('disconnected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Destroy SDK instance and cleanup resources
   * Alias for disconnect()
   */
  async destroy(): Promise<void> {
    await this.disconnect();
    this.removeAllListeners();
  }

  /**
   * Get connection information
   */
  getConnectionInfo(): ConnectionInfo {
    return {
      endpoint: this.config.endpoint!,
      network: this.config.network!,
      chainType: this.config.chainType!,
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
    };
  }

  /**
   * Get account information
   */
  async getAccount(address?: string): Promise<AccountInfo> {
    this.ensureConnected();

    if (this.config.chainType === ChainType.EVM && this.evmClient) {
      if (!address) {
        throw new Error('Address is required for EVM account info');
      }
      return await this.evmClient.getAccount(address);
    }

    // Substrate account info
    if (this.api && address) {
      const account: any = await this.api.query.system.account(address);
      const { nonce, data } = account;
      return {
        address,
        nonce: nonce.toNumber(),
        balance: data.free.toString(),
        type: 'substrate',
        isActive: !data.free.isZero(),
        metadata: {
          data: {
            free: data.free.toString(),
            reserved: data.reserved.toString(),
          },
        },
      };
    }

    throw new Error('API not connected or address not provided');
  }

  /**
   * Get balance for an address
   */
  async getBalance(
    address: string,
    options: {
      includeUSD?: boolean;
      includeMetadata?: boolean;
    } = {},
  ): Promise<BalanceInfo> {
    this.ensureConnected();

    if (this.config.chainType === ChainType.EVM && this.evmClient) {
      return await this.evmClient.getBalanceInfo(address, options);
    }

    // Substrate balance
    if (this.api) {
      const account: any = await this.api.query.system.account(address);
      const { data } = account;
      return {
        total: data.free.add(data.reserved).toString(),
        free: data.free.toString(),
        reserved: data.reserved.toString(),
        symbol: 'SEL',
        decimals: 18,
      };
    }

    throw new Error('API not connected');
  }

  /**
   * Submit a transaction
   */
  async submitTransaction(
    transaction: any,
    options: {
      autoSign?: boolean;
      waitForInclusion?: boolean;
      waitForFinality?: boolean;
      timeout?: number;
    } = {},
  ): Promise<TransactionInfo> {
    this.ensureConnected();

    if (this.config.chainType === ChainType.EVM && this.evmClient) {
      return await this.evmClient.submitTransaction(transaction, options);
    }

    // Substrate transaction (basic transfer)
    if (this.api && transaction.signer && transaction.to && transaction.amount) {
      const keyring = new Keyring({ type: 'sr25519' });
      const sender = keyring.addFromUri(transaction.signer);

      return new Promise((resolve, reject) => {
        this.api!.tx.balances.transferKeepAlive(transaction.to, transaction.amount)
          .signAndSend(sender, ({ status, txHash, events }) => {
            if (status.isFinalized) {
              resolve({
                hash: txHash.toString(),
                blockHash: status.asFinalized.toString(),
                from: sender.address,
                to: transaction.to,
                value: transaction.amount.toString(),
                fee: '0',
                nonce: 0,
                status: 'finalized',
                timestamp: Date.now(),
              } as TransactionInfo);
            }
          })
          .catch(reject);
      });
    }

    throw new Error('Invalid transaction or API not connected');
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(address: string, limit: number = 100): Promise<TransactionInfo[]> {
    this.ensureConnected();

    if (this.config.chainType === ChainType.EVM && this.evmClient) {
      const history = await this.evmClient.getTransactionHistory(address, limit);
      // Map to TransactionInfo format
      return history.map((tx: any) => ({
        ...tx,
        fee: tx.fee || '0', // Ensure fee is always present
      })) as TransactionInfo[];
    }

    // Placeholder for Substrate transaction history
    throw new Error('Transaction history not implemented for Substrate chains yet');
  }

  /**
   * Get contract information
   */
  async getContract(
    address: string,
    options: {
      abi?: any;
      metadata?: any;
      cache?: boolean;
    } = {},
  ): Promise<ContractInfo> {
    this.ensureConnected();

    if (this.config.chainType === ChainType.EVM && this.evmClient) {
      if (!options.abi) {
        throw new Error('ABI is required for contract interaction');
      }
      const contract = this.evmClient.getContract(address, options.abi);
      // Return contract info
      return {
        address,
        name: options.metadata?.name || 'Unknown',
        abi: options.abi,
        bytecode: '', // Would need to fetch with getCode
        creator: '', // Would need historical data
        balance: '0', // Would need to fetch
        metadata: options.metadata,
      };
    }

    // Placeholder for Substrate contracts
    throw new Error('Contract interaction not implemented for Substrate chains yet');
  }

  /**
   * Get contract instance
   */
  async getContractInstance(
    address: string,
    options: {
      abi?: any;
      metadata?: any;
    } = {},
  ): Promise<any> {
    this.ensureConnected();

    if (this.config.chainType === ChainType.EVM && this.evmClient) {
      return await this.evmClient.getContractInstance(address, options);
    }

    throw new Error('Contract instance not implemented for Substrate chains yet');
  }

  /**
   * Subscribe to balance changes
   */
  subscribeToBalanceChanges(address: string, callback: (balance: BalanceInfo) => void): () => void {
    this.ensureConnected();

    if (this.config.chainType === ChainType.EVM && this.evmClient) {
      return this.evmClient.subscribeToBalanceChanges(address, callback);
    }

    // Return no-op for unsupported chains
    return () => {};
  }

  /**
   * Subscribe to events
   */
  subscribeToEvents(options: {
    callback: (event: EventSubscription) => void;
    filters?: Record<string, any>;
  }): () => void {
    this.ensureConnected();

    if (this.config.chainType === ChainType.EVM && this.evmClient) {
      return this.evmClient.subscribeToEvents(options);
    }

    // Return no-op for unsupported chains
    return () => {};
  }

  /**
   * Subscribe to blocks
   */
  subscribeToBlocks(options: {
    callback: (block: BlockInfo) => void;
    includeDetails?: boolean;
    includeExtrinsics?: boolean;
    includeEvents?: boolean;
  }): () => void {
    this.ensureConnected();

    if (this.config.chainType === ChainType.EVM && this.evmClient) {
      return this.evmClient.subscribeToBlocks(options);
    }

    // Return no-op for unsupported chains
    return () => {};
  }

  /**
   * Get current block
   */
  async getCurrentBlock(): Promise<BlockInfo> {
    this.ensureConnected();

    if (this.config.chainType === ChainType.EVM && this.evmClient) {
      const block = await this.evmClient.getCurrentBlock();
      // Add missing stateRoot field
      return {
        ...block,
        stateRoot: '', // EVM blocks don't have stateRoot in the same way
        author: '', // EVM blocks use miner instead
      };
    }

    // Placeholder for Substrate block info
    throw new Error('Block query not implemented for Substrate chains yet');
  }

  /**
   * Builder pattern for configuring SDK
   */
  withEndpoint(endpoint: string): SelendraSDK {
    this.config.endpoint = endpoint;
    return this;
  }

  withNetwork(network: Network): SelendraSDK {
    this.config.network = network;
    return this;
  }

  withChainType(chainType: ChainType): SelendraSDK {
    this.config.chainType = chainType;
    return this;
  }

  withOptions(options: Partial<SDKConfig>): SelendraSDK {
    this.config = { ...this.config, ...options };
    return this;
  }

  /**
   * Connect to EVM chain
   */
  private async connectEVM(): Promise<void> {
    if (!this.config.endpoint) {
      throw new Error('EVM endpoint is required');
    }

    this.evmClient = new SelendraEvmClient({
      network: this.config.network || 'mainnet',
      rpcUrls: {
        http: [this.config.endpoint],
      },
    });

    await this.evmClient.connect();

    // Forward events from EVM client
    this.evmClient.on('connected', () => this.emit('connected'));
    this.evmClient.on('disconnected', () => this.emit('disconnected'));
    this.evmClient.on('error', (error) => this.emit('error', error));
  }

  /**
   * Connect to Substrate chain
   */
  private async connectSubstrate(): Promise<void> {
    if (!this.config.endpoint) {
      throw new Error('Substrate endpoint is required');
    }

    const wsProvider = new WsProvider(this.config.endpoint);
    this.api = await ApiPromise.create({ provider: wsProvider });

    // Set up event listeners
    this.api.on('connected', () => this.emit('connected'));
    this.api.on('disconnected', () => this.emit('disconnected'));
    this.api.on('error', (error) => this.emit('error', error));
  }

  /**
   * Ensure SDK is connected
   */
  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error('SDK is not connected. Call connect() first.');
    }
  }
}

/**
/**
 */
export function createSDK(config?: SDKConfig): SelendraSDK {
  return new SelendraSDK(config);
}

/**
 * Default SDK instance
 */
export const sdk = createSDK();

/**
 * Legacy export for backward compatibility
 */
export default SelendraSDK;
