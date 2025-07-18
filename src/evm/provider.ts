import { ethers } from 'ethers';
import { NetworkConfig, TransactionOptions, GasPriceInfo } from '../types';
import { GAS_PRICE_LEVELS } from '../config/networks';

export class EVMProvider {
  private provider: ethers.Provider;
  private signer?: ethers.Signer;
  private networkConfig: NetworkConfig;

  constructor(networkConfig: NetworkConfig, provider?: ethers.Provider) {
    this.networkConfig = networkConfig;
    
    if (provider) {
      this.provider = provider;
    } else {
      this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    }
  }

  /**
   * Connect to wallet (MetaMask, WalletConnect, etc.)
   */
  async connect(provider?: any): Promise<string> {
    if (provider) {
      this.provider = new ethers.BrowserProvider(provider);
    } else if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      throw new Error('No wallet provider found');
    }

    this.signer = await (this.provider as ethers.BrowserProvider).getSigner();
    const address = await this.signer.getAddress();

    // Request account access
    if (typeof window !== 'undefined' && window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    }

    return address;
  }

  /**
   * Get current account address
   */
  async getAccount(): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    return await this.signer.getAddress();
  }

  /**
   * Get account balance
   */
  async getBalance(address?: string): Promise<string> {
    const targetAddress = address || await this.getAccount();
    const balance = await this.provider.getBalance(targetAddress);
    return balance.toString();
  }

  /**
   * Get transaction count (nonce)
   */
  async getTransactionCount(address?: string): Promise<number> {
    const targetAddress = address || await this.getAccount();
    return await this.provider.getTransactionCount(targetAddress);
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice?.toString() || '0';
  }

  /**
   * Get gas price suggestions
   */
  async getGasPrices(): Promise<GasPriceInfo> {
    const baseGasPrice = await this.getGasPrice();
    const base = BigInt(baseGasPrice);

    return {
      slow: (base * BigInt(Math.floor(GAS_PRICE_LEVELS.slow * 100)) / BigInt(100)).toString(),
      standard: (base * BigInt(Math.floor(GAS_PRICE_LEVELS.standard * 100)) / BigInt(100)).toString(),
      fast: (base * BigInt(Math.floor(GAS_PRICE_LEVELS.fast * 100)) / BigInt(100)).toString(),
      instant: (base * BigInt(Math.floor(GAS_PRICE_LEVELS.instant * 100)) / BigInt(100)).toString()
    };
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(transaction: any): Promise<string> {
    try {
      const gasEstimate = await this.provider.estimateGas(transaction);
      // Add 20% buffer
      return (gasEstimate * BigInt(120) / BigInt(100)).toString();
    } catch (error) {
      console.warn('Gas estimation failed, using default:', error);
      return '500000'; // Default gas limit
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(transaction: any, options?: TransactionOptions): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const tx = {
      ...transaction,
      gasLimit: options?.gasLimit || await this.estimateGas(transaction),
      gasPrice: options?.gasPrice || await this.getGasPrice(),
      nonce: options?.nonce || await this.getTransactionCount()
    };

    const txResponse = await this.signer.sendTransaction(tx);
    return txResponse.hash;
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(hash: string, confirmations: number = 1): Promise<ethers.TransactionReceipt | null> {
    return await this.provider.waitForTransaction(hash, confirmations);
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<ethers.TransactionResponse | null> {
    return await this.provider.getTransaction(hash);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash: string): Promise<ethers.TransactionReceipt | null> {
    return await this.provider.getTransactionReceipt(hash);
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get block by number or hash
   */
  async getBlock(blockHashOrNumber: string | number): Promise<ethers.Block | null> {
    return await this.provider.getBlock(blockHashOrNumber);
  }

  /**
   * Get network information
   */
  async getNetwork(): Promise<ethers.Network> {
    return await this.provider.getNetwork();
  }

  /**
   * Switch to Selendra network in wallet
   */
  async switchNetwork(): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Wallet not available');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${this.networkConfig.chainId.toString(16)}` }]
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await this.addNetwork();
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Add Selendra network to wallet
   */
  async addNetwork(): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Wallet not available');
    }

    await window.ethereum.request({
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

  /**
   * Sign message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    return await this.signer.signMessage(message);
  }

  /**
   * Get the underlying provider
   */
  getProvider(): ethers.Provider {
    return this.provider;
  }

  /**
   * Get the signer if available
   */
  getSigner(): ethers.Signer | undefined {
    return this.signer;
  }
}