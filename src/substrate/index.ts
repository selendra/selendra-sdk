import { NetworkConfig } from '../types';
import { SubstrateAPI } from './api';
import { SubstrateContract, ContractDeployer } from './contract';
import { FormatUtils } from '../utils/format';

export class Substrate {
  private api: SubstrateAPI;
  private networkConfig: NetworkConfig;

  constructor(networkConfig: NetworkConfig, endpoint?: string) {
    this.networkConfig = networkConfig;
    this.api = new SubstrateAPI(networkConfig, endpoint);
  }

  /**
   * Connect to Substrate node
   */
  async connect(): Promise<void> {
    await this.api.connect();
  }

  /**
   * Disconnect from Substrate node
   */
  async disconnect(): Promise<void> {
    await this.api.disconnect();
  }

  /**
   * Create account from mnemonic
   */
  createAccountFromMnemonic(mnemonic: string): any {
    return this.api.createAccountFromMnemonic(mnemonic);
  }

  /**
   * Create account from seed
   */
  createAccountFromSeed(seed: string): any {
    return this.api.createAccountFromSeed(seed);
  }

  /**
   * Get account information
   */
  async getAccount(address: string): Promise<any> {
    return await this.api.getAccount(address);
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    return await this.api.getBalance(address);
  }

  /**
   * Get formatted balance
   */
  async getFormattedBalance(address: string, decimals: number = 4): Promise<string> {
    const balance = await this.getBalance(address);
    return FormatUtils.formatUnits(balance, this.networkConfig.currency.decimals);
  }

  /**
   * Transfer tokens
   */
  async transfer(from: any, to: string, amount: string): Promise<string> {
    const formattedAmount = FormatUtils.parseUnits(amount, this.networkConfig.currency.decimals);
    return await this.api.transfer(from, to, formattedAmount);
  }

  /**
   * Submit extrinsic
   */
  async submitExtrinsic(extrinsic: any, account?: any): Promise<string> {
    return await this.api.submitExtrinsic(extrinsic, account);
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.api.getBlockNumber();
  }

  /**
   * Get block details
   */
  async getBlock(blockHashOrNumber?: string | number): Promise<any> {
    return await this.api.getBlock(blockHashOrNumber);
  }

  /**
   * Get runtime version
   */
  async getRuntimeVersion(): Promise<any> {
    return await this.api.getRuntimeVersion();
  }

  /**
   * Get chain information
   */
  async getChainInfo(): Promise<any> {
    return await this.api.getChainInfo();
  }

  /**
   * Get network properties
   */
  async getNetworkProperties(): Promise<any> {
    return await this.api.getNetworkProperties();
  }

  /**
   * Subscribe to new blocks
   */
  async subscribeToBlocks(callback: (blockNumber: number) => void): Promise<() => void> {
    return await this.api.subscribeToBlocks(callback);
  }

  /**
   * Subscribe to balance changes
   */
  async subscribeToBalance(
    address: string,
    callback: (balance: any) => void
  ): Promise<() => void> {
    return await this.api.subscribeToBalance(address, callback);
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(extrinsic: any, address?: string): Promise<string> {
    return await this.api.estimateFee(extrinsic, address);
  }

  /**
   * Create contract instance
   */
  contract(address: string, abi: any): SubstrateContract {
    return new SubstrateContract(this.api, address, abi);
  }

  /**
   * Get contract deployer
   */
  getContractDeployer(): ContractDeployer {
    return new ContractDeployer(this.api);
  }

  /**
   * Deploy contract
   */
  async deployContract(
    codeHash: string,
    abi: any,
    constructorParams: any[] = [],
    options: any = {},
    account: any
  ): Promise<{ address: string; hash: string }> {
    const deployer = this.getContractDeployer();
    return await deployer.deploy(codeHash, abi, constructorParams, options, account);
  }

  /**
   * Upload contract code
   */
  async uploadCode(
    wasmCode: Uint8Array,
    account: any,
    options: any = {}
  ): Promise<{ codeHash: string; hash: string }> {
    const deployer = this.getContractDeployer();
    return await deployer.uploadCode(wasmCode, account, options);
  }

  /**
   * Instantiate contract
   */
  async instantiateContract(
    codeHash: string,
    abi: any,
    constructorParams: any[] = [],
    options: any = {},
    account: any
  ): Promise<{ address: string; hash: string }> {
    const deployer = this.getContractDeployer();
    return await deployer.instantiate(codeHash, abi, constructorParams, options, account);
  }

  /**
   * Query contract storage
   */
  async queryStorage(key: string): Promise<any> {
    const api = this.api.getAPI();
    const result = await api.rpc.state.getStorage(key);
    return result?.toHuman();
  }

  /**
   * Get events from a block
   */
  async getBlockEvents(blockHash?: string): Promise<any[]> {
    const api = this.api.getAPI();
    const events = await api.query.system.events.at(blockHash);
    return events.map(event => event.toHuman());
  }

  /**
   * Get validator information
   */
  async getValidators(): Promise<any[]> {
    const api = this.api.getAPI();
    const validators = await api.query.session.validators();
    return validators.toHuman() as any[];
  }

  /**
   * Get staking information
   */
  async getStakingInfo(address: string): Promise<any> {
    const api = this.api.getAPI();
    const stakingInfo = await api.query.staking.ledger(address);
    return stakingInfo?.toHuman();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.api.isConnected();
  }

  /**
   * Get underlying API instance
   */
  getAPI(): SubstrateAPI {
    return this.api;
  }

  /**
   * Get SS58 format
   */
  getSS58Format(): number {
    return this.api.getSS58Format();
  }

  /**
   * Encode address with SS58 format
   */
  encodeAddress(publicKey: Uint8Array): string {
    const { encodeAddress } = require('@polkadot/util-crypto');
    return encodeAddress(publicKey, this.getSS58Format());
  }

  /**
   * Decode address
   */
  decodeAddress(address: string): Uint8Array {
    const { decodeAddress } = require('@polkadot/util-crypto');
    return decodeAddress(address);
  }

  /**
   * Validate address
   */
  isValidAddress(address: string): boolean {
    try {
      this.decodeAddress(address);
      return true;
    } catch {
      return false;
    }
  }
}

export { SubstrateAPI, SubstrateContract, ContractDeployer };