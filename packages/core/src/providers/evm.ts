/**
 * EVM Provider
 * 
 * Handles connections to EVM-based chains using ethers.js
 * 
 * @module providers/evm
 */

import { ethers } from 'ethers';
import { BaseProvider } from './base.js';
import type { SDKConfig } from '../types/index.js';

/**
 * EVM chain provider
 */
export class EvmProvider extends BaseProvider {
  private provider: ethers.JsonRpcProvider | null = null;

  constructor(config: SDKConfig) {
    super(config);
  }

  /**
   * Connect to EVM chain
   */
  async connect(): Promise<void> {
    if (this._isConnected || this.provider) {
      this.log('Already connected');
      return;
    }

    if (!this.config.endpoint) {
      throw new Error('EVM endpoint is required');
    }

    this.log('Connecting to EVM chain...');

    try {
      // Create ethers provider
      this.provider = new ethers.JsonRpcProvider(
        this.config.endpoint,
        undefined, // Let ethers detect network
        { staticNetwork: true }
      );

      // Test connection by getting network info
      const network = await Promise.race([
        this.provider.getNetwork(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Connection timeout')),
            this.config.timeout || 30000
          )
        ),
      ]);

      this.log(`Connected to EVM network: ${network.name} (Chain ID: ${network.chainId})`);

      // Set up event listeners
      this.setupEventListeners();

      this._isConnected = true;
      this.emit('connected');
    } catch (error) {
      this.provider = null;
      throw new Error(
        `Failed to connect to EVM chain: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Disconnect from EVM chain
   */
  async disconnect(): Promise<void> {
    if (!this.provider) {
      this.log('Already disconnected');
      return;
    }

    this.log('Disconnecting from EVM chain...');

    try {
      // Remove event listeners
      this.provider.removeAllListeners();
      this.provider = null;
      this._isConnected = false;
      this.emit('disconnected');
      this.log('Disconnected successfully');
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Get ethers provider instance
   */
  getClient(): ethers.JsonRpcProvider | null {
    return this.provider;
  }

  /**
   * Get provider instance (alias for getClient)
   */
  getProvider(): ethers.JsonRpcProvider | null {
    return this.provider;
  }

  /**
   * Set up event listeners for the provider
   */
  private setupEventListeners(): void {
    if (!this.provider) return;

    this.provider.on('error', (error: any) => {
      this.log('EVM provider error:', error);
      this.emit('error', error);
    });
  }

  // ==========================================================================
  // Transaction Methods
  // ==========================================================================

  /**
   * Send native token (SEL) transfer
   * 
   * @param privateKey - Sender's private key
   * @param to - Recipient address
   * @param amount - Amount in SEL (will be converted to wei)
   * @returns Transaction hash
   */
  async sendTransfer(privateKey: string, to: string, amount: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const amountWei = ethers.parseEther(amount);

      const tx = await wallet.sendTransaction({
        to,
        value: amountWei,
      });

      this.log(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      this.log(`Transaction confirmed: ${tx.hash}`);

      return tx.hash;
    } catch (error) {
      throw new Error(
        `Failed to send transfer: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Send ERC20 token transfer
   * 
   * @param privateKey - Sender's private key
   * @param contractAddress - ERC20 token contract address
   * @param to - Recipient address
   * @param amount - Amount in token units (will be converted based on decimals)
   * @param decimals - Token decimals (default: 18)
   * @returns Transaction hash
   */
  async sendERC20Transfer(
    privateKey: string,
    contractAddress: string,
    to: string,
    amount: string,
    decimals: number = 18
  ): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      
      // ERC20 ABI for transfer function
      const erc20Abi = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)',
        'function balanceOf(address account) view returns (uint256)',
      ];

      const contract = new ethers.Contract(contractAddress, erc20Abi, wallet);
      const amountWei = ethers.parseUnits(amount, decimals);

      const tx = await contract.transfer(to, amountWei);
      this.log(`ERC20 transfer sent: ${tx.hash}`);
      
      await tx.wait();
      this.log(`ERC20 transfer confirmed: ${tx.hash}`);

      return tx.hash;
    } catch (error) {
      throw new Error(
        `Failed to send ERC20 transfer: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Execute custom contract transaction
   * 
   * @param privateKey - Sender's private key
   * @param contractAddress - Contract address
   * @param abi - Contract ABI (array of function signatures)
   * @param functionName - Function name to call
   * @param args - Function arguments
   * @param value - Native token value to send (in SEL, optional)
   * @returns Transaction hash
   */
  async executeContractTransaction(
    privateKey: string,
    contractAddress: string,
    abi: string[],
    functionName: string,
    args: any[] = [],
    value?: string
  ): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contract = new ethers.Contract(contractAddress, abi, wallet);

      const txOptions: any = {};
      if (value) {
        txOptions.value = ethers.parseEther(value);
      }

      const tx = await contract[functionName](...args, txOptions);
      this.log(`Contract transaction sent: ${tx.hash}`);
      
      await tx.wait();
      this.log(`Contract transaction confirmed: ${tx.hash}`);

      return tx.hash;
    } catch (error) {
      throw new Error(
        `Failed to execute contract transaction: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Call contract read-only function
   * 
   * @param contractAddress - Contract address
   * @param abi - Contract ABI
   * @param functionName - Function name to call
   * @param args - Function arguments
   * @returns Function result
   */
  async callContractFunction(
    contractAddress: string,
    abi: string[],
    functionName: string,
    args: any[] = []
  ): Promise<any> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      const contract = new ethers.Contract(contractAddress, abi, this.provider);
      const result = await contract[functionName](...args);
      return result;
    } catch (error) {
      throw new Error(
        `Failed to call contract function: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get ERC20 token balance
   * 
   * @param contractAddress - ERC20 token contract address
   * @param account - Account address
   * @returns Token balance as string
   */
  async getERC20Balance(contractAddress: string, account: string): Promise<string> {
    const erc20Abi = [
      'function balanceOf(address account) view returns (uint256)',
      'function decimals() view returns (uint8)',
    ];

    const balance = await this.callContractFunction(
      contractAddress,
      erc20Abi,
      'balanceOf',
      [account]
    );

    return balance.toString();
  }

  /**
   * Get ERC20 token info
   * 
   * @param contractAddress - ERC20 token contract address
   * @returns Token info (name, symbol, decimals)
   */
  async getERC20Info(contractAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  }> {
    const erc20Abi = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
    ];

    const [name, symbol, decimals] = await Promise.all([
      this.callContractFunction(contractAddress, erc20Abi, 'name'),
      this.callContractFunction(contractAddress, erc20Abi, 'symbol'),
      this.callContractFunction(contractAddress, erc20Abi, 'decimals'),
    ]);

    return { name, symbol, decimals: Number(decimals) };
  }
}
