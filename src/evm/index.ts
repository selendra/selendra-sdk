import { NetworkConfig, TransactionOptions, ContractCallOptions } from '../types';
import { EVMProvider } from './provider';
import { EVMContract, ERC20Contract, ContractFactory } from './contract';
import { FormatUtils } from '../utils/format';

export class EVM {
  private provider: EVMProvider;
  private networkConfig: NetworkConfig;

  constructor(networkConfig: NetworkConfig, provider?: any) {
    this.networkConfig = networkConfig;
    this.provider = new EVMProvider(networkConfig, provider);
  }

  /**
   * Connect to wallet
   */
  async connect(provider?: any): Promise<string> {
    return await this.provider.connect(provider);
  }

  /**
   * Get current account
   */
  async getAccount(): Promise<string> {
    return await this.provider.getAccount();
  }

  /**
   * Get account balance
   */
  async getBalance(address?: string): Promise<string> {
    return await this.provider.getBalance(address);
  }

  /**
   * Get formatted balance
   */
  async getFormattedBalance(address?: string, decimals: number = 4): Promise<string> {
    const balance = await this.getBalance(address);
    return FormatUtils.formatEther(balance, decimals);
  }

  /**
   * Send native token transfer
   */
  async transfer(to: string, amount: string, options?: TransactionOptions): Promise<string> {
    const transaction = {
      to,
      value: FormatUtils.parseEther(amount)
    };
    return await this.provider.sendTransaction(transaction, options);
  }

  /**
   * Send transaction
   */
  async sendTransaction(transaction: any, options?: TransactionOptions): Promise<string> {
    return await this.provider.sendTransaction(transaction, options);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(hash: string, confirmations: number = 1): Promise<any> {
    return await this.provider.waitForTransaction(hash, confirmations);
  }

  /**
   * Get transaction details
   */
  async getTransaction(hash: string): Promise<any> {
    return await this.provider.getTransaction(hash);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash: string): Promise<any> {
    return await this.provider.getTransactionReceipt(hash);
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    return await this.provider.getGasPrice();
  }

  /**
   * Get gas price suggestions
   */
  async getGasPrices(): Promise<any> {
    return await this.provider.getGasPrices();
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(transaction: any): Promise<string> {
    return await this.provider.estimateGas(transaction);
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get block details
   */
  async getBlock(blockHashOrNumber: string | number): Promise<any> {
    return await this.provider.getBlock(blockHashOrNumber);
  }

  /**
   * Get network information
   */
  async getNetwork(): Promise<any> {
    return await this.provider.getNetwork();
  }

  /**
   * Switch to Selendra network
   */
  async switchNetwork(): Promise<void> {
    return await this.provider.switchNetwork();
  }

  /**
   * Sign message
   */
  async signMessage(message: string): Promise<string> {
    return await this.provider.signMessage(message);
  }

  /**
   * Create contract instance
   */
  contract(address: string, abi: any[]): EVMContract {
    return new EVMContract(this.provider, address, abi, this.provider.getSigner());
  }

  /**
   * Create ERC-20 token contract instance
   */
  erc20(address: string): ERC20Contract {
    return new ERC20Contract(this.provider, address, this.provider.getSigner());
  }

  /**
   * Get contract factory for deployment
   */
  getContractFactory(): ContractFactory {
    return new ContractFactory(this.provider);
  }

  /**
   * Deploy contract
   */
  async deployContract(
    abi: any[],
    bytecode: string,
    constructorArgs: any[] = [],
    options?: ContractCallOptions
  ): Promise<{ address: string; hash: string }> {
    const factory = this.getContractFactory();
    return await factory.deploy(abi, bytecode, constructorArgs, options);
  }

  /**
   * Get ERC-20 token information
   */
  async getTokenInfo(tokenAddress: string): Promise<any> {
    const token = this.erc20(tokenAddress);
    
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply()
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply
      };
    } catch (error) {
      throw new Error(`Failed to get token info: ${error}`);
    }
  }

  /**
   * Get ERC-20 token balance
   */
  async getTokenBalance(tokenAddress: string, userAddress?: string): Promise<string> {
    const token = this.erc20(tokenAddress);
    const address = userAddress || await this.getAccount();
    return await token.balanceOf(address);
  }

  /**
   * Get formatted ERC-20 token balance
   */
  async getFormattedTokenBalance(
    tokenAddress: string,
    userAddress?: string,
    decimals?: number
  ): Promise<string> {
    const balance = await this.getTokenBalance(tokenAddress, userAddress);
    
    if (decimals === undefined) {
      const token = this.erc20(tokenAddress);
      decimals = await token.decimals();
    }

    return FormatUtils.formatUnits(balance, decimals);
  }

  /**
   * Transfer ERC-20 tokens
   */
  async transferToken(
    tokenAddress: string,
    to: string,
    amount: string,
    options?: ContractCallOptions
  ): Promise<string> {
    const token = this.erc20(tokenAddress);
    return await token.transfer(to, amount, options);
  }

  /**
   * Approve ERC-20 token spending
   */
  async approveToken(
    tokenAddress: string,
    spender: string,
    amount: string,
    options?: ContractCallOptions
  ): Promise<string> {
    const token = this.erc20(tokenAddress);
    return await token.approve(spender, amount, options);
  }

  /**
   * Get the underlying provider
   */
  getProvider(): EVMProvider {
    return this.provider;
  }
}

export { EVMProvider, EVMContract, ERC20Contract, ContractFactory };