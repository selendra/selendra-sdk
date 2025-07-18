import { ethers } from 'ethers';
import { EVMProvider } from './provider';
import { ContractCallOptions } from '../types';

export class EVMContract {
  private contract: ethers.Contract;
  private provider: EVMProvider;
  private address: string;
  private abi: any[];

  constructor(
    provider: EVMProvider,
    address: string,
    abi: any[],
    signer?: ethers.Signer
  ) {
    this.provider = provider;
    this.address = address;
    this.abi = abi;
    
    const contractProvider = signer || provider.getProvider();
    this.contract = new ethers.Contract(address, abi, contractProvider);
  }

  /**
   * Call a read-only contract method
   */
  async read(methodName: string, params: any[] = []): Promise<any> {
    try {
      const result = await this.contract[methodName](...params);
      return result;
    } catch (error) {
      throw new Error(`Contract read failed: ${error}`);
    }
  }

  /**
   * Call a state-changing contract method
   */
  async write(
    methodName: string,
    params: any[] = [],
    options?: ContractCallOptions
  ): Promise<string> {
    try {
      const signer = this.provider.getSigner();
      if (!signer) {
        throw new Error('Wallet not connected');
      }

      const contractWithSigner = this.contract.connect(signer);
      
      // Prepare transaction options
      const txOptions: any = {};
      if (options?.gasLimit) txOptions.gasLimit = options.gasLimit;
      if (options?.gasPrice) txOptions.gasPrice = options.gasPrice;
      if (options?.maxFeePerGas) txOptions.maxFeePerGas = options.maxFeePerGas;
      if (options?.maxPriorityFeePerGas) txOptions.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      if (options?.value) txOptions.value = options.value;

      // Estimate gas if not provided
      if (!options?.gasLimit) {
        try {
          const gasEstimate = await contractWithSigner[methodName].estimateGas(...params, txOptions);
          txOptions.gasLimit = (gasEstimate * BigInt(120) / BigInt(100)).toString(); // 20% buffer
        } catch (error) {
          console.warn('Gas estimation failed:', error);
          txOptions.gasLimit = '500000'; // Default
        }
      }

      const tx = await contractWithSigner[methodName](...params, txOptions);
      return tx.hash;
    } catch (error) {
      throw new Error(`Contract write failed: ${error}`);
    }
  }

  /**
   * Estimate gas for a contract method call
   */
  async estimateGas(methodName: string, params: any[] = [], options?: ContractCallOptions): Promise<string> {
    try {
      const txOptions: any = {};
      if (options?.value) txOptions.value = options.value;
      if (options?.from) txOptions.from = options.from;

      const gasEstimate = await this.contract[methodName].estimateGas(...params, txOptions);
      return gasEstimate.toString();
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error}`);
    }
  }

  /**
   * Get contract events
   */
  async getEvents(
    eventName: string,
    filter?: any,
    fromBlock?: number,
    toBlock?: number
  ): Promise<any[]> {
    try {
      const events = await this.contract.queryFilter(
        this.contract.filters[eventName](filter),
        fromBlock,
        toBlock
      );
      return events;
    } catch (error) {
      throw new Error(`Failed to get events: ${error}`);
    }
  }

  /**
   * Listen to contract events
   */
  on(eventName: string, callback: (...args: any[]) => void): void {
    this.contract.on(eventName, callback);
  }

  /**
   * Remove event listener
   */
  off(eventName: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.contract.off(eventName, callback);
    } else {
      this.contract.removeAllListeners(eventName);
    }
  }

  /**
   * Get contract address
   */
  getAddress(): string {
    return this.address;
  }

  /**
   * Get contract ABI
   */
  getABI(): any[] {
    return this.abi;
  }

  /**
   * Get contract interface
   */
  getInterface(): ethers.Interface {
    return this.contract.interface;
  }

  /**
   * Encode function data
   */
  encodeFunctionData(methodName: string, params: any[] = []): string {
    return this.contract.interface.encodeFunctionData(methodName, params);
  }

  /**
   * Decode function result
   */
  decodeFunctionResult(methodName: string, data: string): any {
    return this.contract.interface.decodeFunctionResult(methodName, data);
  }

  /**
   * Parse transaction logs
   */
  parseLog(log: any): any {
    try {
      return this.contract.interface.parseLog(log);
    } catch (error) {
      return null;
    }
  }
}

/**
 * ERC-20 Token Contract Helper
 */
export class ERC20Contract extends EVMContract {
  constructor(provider: EVMProvider, address: string, signer?: ethers.Signer) {
    const ERC20_ABI = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)',
      'function balanceOf(address) view returns (uint256)',
      'function allowance(address owner, address spender) view returns (uint256)',
      'function transfer(address to, uint256 amount) returns (bool)',
      'function approve(address spender, uint256 amount) returns (bool)',
      'function transferFrom(address from, address to, uint256 amount) returns (bool)',
      'event Transfer(address indexed from, address indexed to, uint256 value)',
      'event Approval(address indexed owner, address indexed spender, uint256 value)'
    ];

    super(provider, address, ERC20_ABI, signer);
  }

  async name(): Promise<string> {
    return await this.read('name');
  }

  async symbol(): Promise<string> {
    return await this.read('symbol');
  }

  async decimals(): Promise<number> {
    return await this.read('decimals');
  }

  async totalSupply(): Promise<string> {
    return (await this.read('totalSupply')).toString();
  }

  async balanceOf(address: string): Promise<string> {
    return (await this.read('balanceOf', [address])).toString();
  }

  async allowance(owner: string, spender: string): Promise<string> {
    return (await this.read('allowance', [owner, spender])).toString();
  }

  async transfer(to: string, amount: string, options?: ContractCallOptions): Promise<string> {
    return await this.write('transfer', [to, amount], options);
  }

  async approve(spender: string, amount: string, options?: ContractCallOptions): Promise<string> {
    return await this.write('approve', [spender, amount], options);
  }

  async transferFrom(
    from: string,
    to: string,
    amount: string,
    options?: ContractCallOptions
  ): Promise<string> {
    return await this.write('transferFrom', [from, to, amount], options);
  }
}

/**
 * Contract Factory for deploying new contracts
 */
export class ContractFactory {
  private provider: EVMProvider;

  constructor(provider: EVMProvider) {
    this.provider = provider;
  }

  async deploy(
    abi: any[],
    bytecode: string,
    constructorArgs: any[] = [],
    options?: ContractCallOptions
  ): Promise<{ address: string; hash: string }> {
    const signer = this.provider.getSigner();
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const factory = new ethers.ContractFactory(abi, bytecode, signer);
      
      const deployOptions: any = {};
      if (options?.gasLimit) deployOptions.gasLimit = options.gasLimit;
      if (options?.gasPrice) deployOptions.gasPrice = options.gasPrice;
      if (options?.value) deployOptions.value = options.value;

      const contract = await factory.deploy(...constructorArgs, deployOptions);
      await contract.waitForDeployment();

      return {
        address: await contract.getAddress(),
        hash: contract.deploymentTransaction()?.hash || ''
      };
    } catch (error) {
      throw new Error(`Contract deployment failed: ${error}`);
    }
  }
}