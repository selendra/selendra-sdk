import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { NetworkConfig } from '../types';
import { SUBSTRATE_ENDPOINTS } from '../config/networks';

export class SubstrateAPI {
  private api?: ApiPromise;
  private provider?: WsProvider;
  private keyring?: Keyring;
  private networkConfig: NetworkConfig;
  private endpoint: string;

  constructor(networkConfig: NetworkConfig, endpoint?: string) {
    this.networkConfig = networkConfig;
    this.endpoint = endpoint || this.getDefaultEndpoint();
  }

  private getDefaultEndpoint(): string {
    if (this.networkConfig.chainId === 1961) {
      return SUBSTRATE_ENDPOINTS.mainnet;
    } else if (this.networkConfig.chainId === 1953) {
      return SUBSTRATE_ENDPOINTS.testnet;
    }
    return this.networkConfig.wsUrl;
  }

  /**
   * Connect to Substrate node
   */
  async connect(): Promise<void> {
    try {
      await cryptoWaitReady();
      
      this.provider = new WsProvider(this.endpoint);
      this.api = await ApiPromise.create({ 
        provider: this.provider,
        throwOnConnect: true
      });

      this.keyring = new Keyring({ type: 'sr25519' });

      // Wait for the API to be ready
      await this.api.isReady;
      
      console.log('Connected to Substrate node:', this.endpoint);
    } catch (error) {
      throw new Error(`Failed to connect to Substrate: ${error}`);
    }
  }

  /**
   * Disconnect from Substrate node
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
    }
    if (this.provider) {
      await this.provider.disconnect();
    }
  }

  /**
   * Get the API instance
   */
  getAPI(): ApiPromise {
    if (!this.api) {
      throw new Error('API not connected. Call connect() first.');
    }
    return this.api;
  }

  /**
   * Get the keyring instance
   */
  getKeyring(): Keyring {
    if (!this.keyring) {
      throw new Error('Keyring not initialized. Call connect() first.');
    }
    return this.keyring;
  }

  /**
   * Create account from mnemonic
   */
  createAccountFromMnemonic(mnemonic: string): any {
    const keyring = this.getKeyring();
    return keyring.addFromMnemonic(mnemonic);
  }

  /**
   * Create account from seed
   */
  createAccountFromSeed(seed: string): any {
    const keyring = this.getKeyring();
    return keyring.addFromSeed(seed);
  }

  /**
   * Get account info
   */
  async getAccount(address: string): Promise<any> {
    const api = this.getAPI();
    const account = await api.query.system.account(address);
    return account.toHuman();
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    const account = await this.getAccount(address);
    return account.data.free.toString();
  }

  /**
   * Get account nonce
   */
  async getNonce(address: string): Promise<number> {
    const account = await this.getAccount(address);
    return parseInt(account.nonce.toString());
  }

  /**
   * Submit extrinsic
   */
  async submitExtrinsic(extrinsic: any, account?: any): Promise<string> {
    const api = this.getAPI();
    
    if (account) {
      // Sign and submit
      const hash = await extrinsic.signAndSend(account);
      return hash.toString();
    } else {
      // Submit unsigned
      const hash = await api.rpc.author.submitExtrinsic(extrinsic);
      return hash.toString();
    }
  }

  /**
   * Transfer tokens
   */
  async transfer(from: any, to: string, amount: string): Promise<string> {
    const api = this.getAPI();
    const transfer = api.tx.balances.transfer(to, amount);
    return await this.submitExtrinsic(transfer, from);
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    const api = this.getAPI();
    const header = await api.rpc.chain.getHeader();
    return header.number.toNumber();
  }

  /**
   * Get block by number or hash
   */
  async getBlock(blockHashOrNumber?: string | number): Promise<any> {
    const api = this.getAPI();
    
    let blockHash;
    if (typeof blockHashOrNumber === 'number') {
      blockHash = await api.rpc.chain.getBlockHash(blockHashOrNumber);
    } else if (typeof blockHashOrNumber === 'string') {
      blockHash = blockHashOrNumber;
    } else {
      blockHash = await api.rpc.chain.getBlockHash();
    }

    const block = await api.rpc.chain.getBlock(blockHash);
    return block.toHuman();
  }

  /**
   * Get runtime version
   */
  async getRuntimeVersion(): Promise<any> {
    const api = this.getAPI();
    const version = await api.rpc.state.getRuntimeVersion();
    return version.toHuman();
  }

  /**
   * Get chain info
   */
  async getChainInfo(): Promise<any> {
    const api = this.getAPI();
    const [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version()
    ]);

    return {
      chain: chain.toString(),
      nodeName: nodeName.toString(),
      nodeVersion: nodeVersion.toString()
    };
  }

  /**
   * Subscribe to new blocks
   */
  async subscribeToBlocks(callback: (blockNumber: number) => void): Promise<() => void> {
    const api = this.getAPI();
    const unsubscribe = await api.rpc.chain.subscribeNewHeads((header) => {
      callback(header.number.toNumber());
    });
    return unsubscribe;
  }

  /**
   * Subscribe to balance changes
   */
  async subscribeToBalance(
    address: string,
    callback: (balance: any) => void
  ): Promise<() => void> {
    const api = this.getAPI();
    const unsubscribe = await api.query.system.account(address, (account: any) => {
      callback(account.data.toHuman());
    });
    return unsubscribe;
  }

  /**
   * Get transaction fee estimation
   */
  async estimateFee(extrinsic: any, address?: string): Promise<string> {
    // API instance available via this.getAPI() if needed for future enhancements
    const paymentInfo = await extrinsic.paymentInfo(address);
    return paymentInfo.partialFee.toString();
  }

  /**
   * Check if API is connected
   */
  isConnected(): boolean {
    return this.api?.isConnected || false;
  }

  /**
   * Get network properties
   */
  async getNetworkProperties(): Promise<any> {
    const api = this.getAPI();
    const properties = await api.rpc.system.properties();
    return properties.toHuman();
  }

  /**
   * Get SS58 format for addresses
   */
  getSS58Format(): number {
    const api = this.getAPI();
    return api.registry.chainSS58 || 42; // Default to 42 if not set
  }
}