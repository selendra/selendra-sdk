import { WalletConnection, NetworkConfig } from '../types';

export interface WalletProvider {
  name: string;
  connect(): Promise<WalletConnection>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getAccounts(): Promise<string[]>;
  signMessage(message: string): Promise<string>;
  signTransaction(transaction: any): Promise<any>;
}

/**
 * MetaMask Wallet Provider
 */
export class MetaMaskProvider implements WalletProvider {
  name = 'MetaMask';
  private ethereum: any;
  private networkConfig: NetworkConfig;

  constructor(networkConfig: NetworkConfig) {
    this.networkConfig = networkConfig;
    this.ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null;
  }

  async connect(): Promise<WalletConnection> {
    if (!this.ethereum) {
      throw new Error('MetaMask not detected');
    }

    try {
      // Request account access
      const accounts = await this.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Get current chain ID
      const chainId = await this.ethereum.request({
        method: 'eth_chainId'
      });

      // Check if we're on the correct network
      const currentChainId = parseInt(chainId, 16);
      if (currentChainId !== this.networkConfig.chainId) {
        await this.switchNetwork();
      }

      return {
        address: accounts[0],
        chainId: this.networkConfig.chainId,
        connected: true,
        provider: this.ethereum
      };
    } catch (error) {
      throw new Error(`MetaMask connection failed: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    // MetaMask doesn't have a programmatic disconnect
    // User needs to disconnect manually through the extension
  }

  isConnected(): boolean {
    return this.ethereum?.isConnected?.() || false;
  }

  async getAccounts(): Promise<string[]> {
    if (!this.ethereum) {
      return [];
    }

    try {
      return await this.ethereum.request({
        method: 'eth_accounts'
      });
    } catch {
      return [];
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.ethereum) {
      throw new Error('MetaMask not available');
    }

    const accounts = await this.getAccounts();
    if (accounts.length === 0) {
      throw new Error('No accounts connected');
    }

    return await this.ethereum.request({
      method: 'personal_sign',
      params: [message, accounts[0]]
    });
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.ethereum) {
      throw new Error('MetaMask not available');
    }

    return await this.ethereum.request({
      method: 'eth_sendTransaction',
      params: [transaction]
    });
  }

  private async switchNetwork(): Promise<void> {
    try {
      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${this.networkConfig.chainId.toString(16)}` }]
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await this.addNetwork();
      } else {
        throw switchError;
      }
    }
  }

  private async addNetwork(): Promise<void> {
    await this.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${this.networkConfig.chainId.toString(16)}`,
        chainName: this.networkConfig.name,
        nativeCurrency: this.networkConfig.currency,
        rpcUrls: [this.networkConfig.rpcUrl],
        blockExplorerUrls: [this.networkConfig.explorerUrl]
      }]
    });
  }
}

/**
 * WalletConnect Provider
 */
export class WalletConnectProvider implements WalletProvider {
  name = 'WalletConnect';
  private connector: any;
  private networkConfig: NetworkConfig;

  constructor(networkConfig: NetworkConfig, projectId: string) {
    this.networkConfig = networkConfig;
    // Initialize WalletConnect (would need actual WalletConnect v2 SDK)
    this.initializeConnector(projectId);
  }

  private initializeConnector(projectId: string): void {
    // This would use the actual WalletConnect SDK
    // For now, this is a placeholder implementation
  }

  async connect(): Promise<WalletConnection> {
    try {
      // Connect to WalletConnect
      await this.connector?.connect();
      
      const accounts = await this.getAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts available');
      }

      return {
        address: accounts[0],
        chainId: this.networkConfig.chainId,
        connected: true,
        provider: this.connector
      };
    } catch (error) {
      throw new Error(`WalletConnect connection failed: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connector) {
      await this.connector.disconnect();
    }
  }

  isConnected(): boolean {
    return this.connector?.connected || false;
  }

  async getAccounts(): Promise<string[]> {
    return this.connector?.accounts || [];
  }

  async signMessage(message: string): Promise<string> {
    if (!this.connector) {
      throw new Error('WalletConnect not connected');
    }

    // Implementation would depend on WalletConnect SDK
    throw new Error('Not implemented');
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.connector) {
      throw new Error('WalletConnect not connected');
    }

    // Implementation would depend on WalletConnect SDK
    throw new Error('Not implemented');
  }
}

/**
 * Polkadot.js Wallet Provider (for Substrate)
 */
export class PolkadotJSProvider implements WalletProvider {
  name = 'Polkadot.js';
  private extension: any;
  private networkConfig: NetworkConfig;

  constructor(networkConfig: NetworkConfig) {
    this.networkConfig = networkConfig;
  }

  async connect(): Promise<WalletConnection> {
    try {
      // Check if Polkadot.js extension is available
      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
      
      const extensions = await web3Enable('Selendra SDK');
      if (extensions.length === 0) {
        throw new Error('Polkadot.js extension not found');
      }

      const accounts = await web3Accounts();
      if (accounts.length === 0) {
        throw new Error('No accounts available');
      }

      this.extension = extensions[0];

      return {
        address: accounts[0].address,
        chainId: this.networkConfig.chainId,
        connected: true,
        provider: this.extension
      };
    } catch (error) {
      throw new Error(`Polkadot.js connection failed: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.extension = null;
  }

  isConnected(): boolean {
    return !!this.extension;
  }

  async getAccounts(): Promise<string[]> {
    try {
      const { web3Accounts } = await import('@polkadot/extension-dapp');
      const accounts = await web3Accounts();
      return accounts.map(account => account.address);
    } catch {
      return [];
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.extension) {
      throw new Error('Polkadot.js not connected');
    }

    try {
      const { web3FromSource } = await import('@polkadot/extension-dapp');
      const accounts = await this.getAccounts();
      
      if (accounts.length === 0) {
        throw new Error('No accounts available');
      }

      const injector = await web3FromSource(this.extension.name);
      const signRaw = injector?.signer?.signRaw;
      
      if (!signRaw) {
        throw new Error('Signing not supported');
      }

      const result = await signRaw({
        address: accounts[0],
        data: message,
        type: 'bytes'
      });

      return result.signature;
    } catch (error) {
      throw new Error(`Message signing failed: ${error}`);
    }
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.extension) {
      throw new Error('Polkadot.js not connected');
    }

    try {
      const { web3FromSource } = await import('@polkadot/extension-dapp');
      const accounts = await this.getAccounts();
      
      if (accounts.length === 0) {
        throw new Error('No accounts available');
      }

      const injector = await web3FromSource(this.extension.name);
      transaction.setSigningOptions({ signer: injector.signer });

      return await transaction.signAndSend(accounts[0]);
    } catch (error) {
      throw new Error(`Transaction signing failed: ${error}`);
    }
  }
}

/**
 * Wallet Manager - manages multiple wallet providers
 */
export class WalletManager {
  private providers: Map<string, WalletProvider> = new Map();
  private currentProvider?: WalletProvider;
  private networkConfig: NetworkConfig;

  constructor(networkConfig: NetworkConfig) {
    this.networkConfig = networkConfig;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize MetaMask provider
    this.providers.set('metamask', new MetaMaskProvider(this.networkConfig));
    
    // Initialize Polkadot.js provider
    this.providers.set('polkadotjs', new PolkadotJSProvider(this.networkConfig));
    
    // WalletConnect would need a project ID
    // this.providers.set('walletconnect', new WalletConnectProvider(this.networkConfig, projectId));
  }

  /**
   * Get available wallet providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Connect to a specific wallet
   */
  async connect(providerName: string): Promise<WalletConnection> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const connection = await provider.connect();
    this.currentProvider = provider;
    return connection;
  }

  /**
   * Disconnect current wallet
   */
  async disconnect(): Promise<void> {
    if (this.currentProvider) {
      await this.currentProvider.disconnect();
      this.currentProvider = undefined;
    }
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): WalletProvider | undefined {
    return this.currentProvider;
  }

  /**
   * Check if any wallet is connected
   */
  isConnected(): boolean {
    return this.currentProvider?.isConnected() || false;
  }

  /**
   * Get accounts from current provider
   */
  async getAccounts(): Promise<string[]> {
    if (!this.currentProvider) {
      return [];
    }
    return await this.currentProvider.getAccounts();
  }

  /**
   * Sign message with current provider
   */
  async signMessage(message: string): Promise<string> {
    if (!this.currentProvider) {
      throw new Error('No wallet connected');
    }
    return await this.currentProvider.signMessage(message);
  }

  /**
   * Sign transaction with current provider
   */
  async signTransaction(transaction: any): Promise<any> {
    if (!this.currentProvider) {
      throw new Error('No wallet connected');
    }
    return await this.currentProvider.signTransaction(transaction);
  }

  /**
   * Auto-detect and connect to available wallet
   */
  async autoConnect(): Promise<WalletConnection | null> {
    for (const [name, provider] of this.providers) {
      try {
        const accounts = await provider.getAccounts();
        if (accounts.length > 0) {
          return await this.connect(name);
        }
      } catch {
        // Continue to next provider
      }
    }
    return null;
  }
}

export * from '../types';