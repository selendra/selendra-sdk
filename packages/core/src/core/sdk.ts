/**
 * Selendra SDK - Main Class
 *
 * Core SDK class that orchestrates all providers and features
 *
 * @module core/sdk
 */

import EventEmitter from "eventemitter3";
import type { ApiPromise } from "@polkadot/api";
import type { JsonRpcProvider } from "ethers";

import {
  ChainType,
  type SDKConfig,
  type ConnectionInfo,
  type SDKEvents,
} from "../types/index.js";
import { SubstrateProvider, EvmProvider } from "../providers/index.js";
import { mergeConfig, validateConfig, Logger } from "../utils/index.js";
import { UnifiedAccountsManager } from "../unified/index.js";

// Governance pallet imports
import { DemocracyManager } from "../pallets/democracy/index.js";
import { CouncilManager } from "../pallets/council/index.js";
import { TreasuryManager } from "../pallets/treasury/index.js";
import { ElectionsPhragmenManager } from "../pallets/elections-phragmen/index.js";

/**
 * Main Selendra SDK class
 *
 * Provides a unified interface for connecting to both Substrate and EVM
 * based Selendra networks.
 *
 * @example
 * ```typescript
 * // Connect to Substrate chain
 * const sdk = new SelendraSDK({
 *   endpoint: 'wss://rpc.selendra.org',
 *   chainType: ChainType.Substrate,
 * });
 *
 * await sdk.connect();
 * console.log('Connected:', sdk.getConnectionInfo());
 * await sdk.disconnect();
 * ```
 */
export class SelendraSDK extends EventEmitter<SDKEvents> {
  private config: SDKConfig;
  private provider: SubstrateProvider | EvmProvider | null = null;
  private logger: Logger;
  private isConnecting = false;
  private isConnected = false;
  private connectedAt?: number;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private currentRetryAttempt = 0;

  /**
   * Unified Accounts Manager (optional, only available when both Substrate and EVM providers exist)
   * Note: The SDK currently only supports one chain type at a time.
   * This will be enabled in a future update that supports dual-provider mode.
   */
  public unifiedAccounts?: UnifiedAccountsManager;

  // Governance pallet managers (lazy-loaded)
  private _democracy?: DemocracyManager;
  private _council?: CouncilManager;
  private _treasury?: TreasuryManager;
  private _councilElections?: ElectionsPhragmenManager;

  /**
   * Create a new SelendraSDK instance
   *
   * @param config - SDK configuration options
   */
  constructor(config: SDKConfig = {}) {
    super();

    // Validate and merge configuration
    validateConfig(config);
    this.config = mergeConfig(config);

    // Initialize logger
    this.logger = new Logger("SelendraSDK", this.config.debug);
    this.logger.debug("SDK initialized with config:", this.config);
  }

  // ==========================================================================
  // Core Connection Methods
  // ==========================================================================

  /**
   * Connect to the blockchain network
   *
   * Establishes connection to either Substrate or EVM chain based on
   * the chainType configuration.
   *
   * @throws {Error} If connection fails
   *
   * @example
   * ```typescript
   * const sdk = new SelendraSDK({ endpoint: 'wss://rpc.selendra.org' });
   *
   * sdk.on('connecting', () => console.log('Connecting...'));
   * sdk.on('connected', () => console.log('Connected!'));
   *
   * await sdk.connect();
   * ```
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      this.logger.debug("Already connected");
      return;
    }

    if (this.isConnecting) {
      this.logger.debug("Connection already in progress");
      return;
    }

    this.isConnecting = true;
    this.emit("connecting");
    this.logger.debug(
      `Connecting to ${this.config.chainType} chain at ${this.config.endpoint}`
    );

    try {
      const startTime = Date.now();

      // Initialize provider based on chain type
      await this.initializeProvider();

      // Initialize unified accounts if this is a Substrate connection
      // Note: Unified accounts require both Substrate and EVM providers
      // For now, we can only initialize when connected to Substrate
      if (
        this.config.chainType === ChainType.Substrate &&
        this.provider instanceof SubstrateProvider
      ) {
        await this.initializeUnifiedAccounts();
      }

      // Connection successful
      this.isConnected = true;
      this.connectedAt = Date.now();
      this.currentRetryAttempt = 0;

      const latency = Date.now() - startTime;
      this.logger.debug(`Connected successfully in ${latency}ms`);

      this.emit("connected");
    } catch (error) {
      this.logger.error("Connection failed:", error);
      this.isConnected = false;
      this.emit("error", error as Error);

      // Handle auto-reconnect
      if (
        this.config.autoReconnect &&
        this.currentRetryAttempt < (this.config.retryAttempts || 3)
      ) {
        this.scheduleReconnect();
      }

      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from the blockchain network
   *
   * Gracefully disconnects from the network and cleans up resources.
   *
   * @throws {Error} If disconnection fails
   *
   * @example
   * ```typescript
   * await sdk.disconnect();
   * ```
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected && !this.provider) {
      this.logger.debug("Already disconnected");
      return;
    }

    this.logger.debug("Disconnecting...");

    // Clear any pending reconnect attempts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    try {
      if (this.provider) {
        await this.provider.disconnect();
        this.provider = null;
      }

      // Reset connection state
      this.isConnected = false;
      this.isConnecting = false;
      this.connectedAt = undefined;
      this.currentRetryAttempt = 0;

      this.logger.debug("Disconnected successfully");
      this.emit("disconnected");
    } catch (error) {
      this.logger.error("Disconnection error:", error);
      this.emit("error", error as Error);
      throw error;
    }
  }

  /**
   * Destroy SDK instance and cleanup all resources
   *
   * Calls disconnect() and removes all event listeners.
   * After calling destroy(), the SDK instance should not be reused.
   *
   * @example
   * ```typescript
   * await sdk.destroy();
   * ```
   */
  async destroy(): Promise<void> {
    this.logger.debug("Destroying SDK instance");

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    await this.disconnect();
    this.removeAllListeners();

    // Ensure provider is fully cleaned up
    if (this.provider) {
      this.provider.removeAllListeners();
      this.provider = null;
    }

    this.logger.debug("SDK destroyed");
  }

  // ==========================================================================
  // Connection Information
  // ==========================================================================

  /**
   * Get current connection information
   *
   * @returns {ConnectionInfo} Current connection information
   */
  getConnectionInfo(): ConnectionInfo {
    return {
      endpoint: this.config.endpoint || "",
      network: this.config.network || "",
      chainType: this.config.chainType || ChainType.Substrate,
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      connectedAt: this.connectedAt,
    };
  }

  /**
   * Check if SDK is currently connected
   */
  get connected(): boolean {
    return this.isConnected;
  }

  // ==========================================================================
  // Account & Balance Methods
  // ==========================================================================

  /**
   * Get account balance
   *
   * For Substrate: Returns free balance in planck (smallest unit)
   * For EVM: Returns balance in wei (smallest unit)
   *
   * @param address - Account address (SS58 for Substrate, 0x for EVM)
   * @returns Balance as bigint or string
   *
   * @example
   * ```typescript
   * // Substrate
   * const balance = await sdk.getBalance('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
   * console.log('Balance:', balance.toString(), 'planck');
   *
   * // EVM
   * const balance = await sdk.getBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
   * console.log('Balance:', balance.toString(), 'wei');
   * ```
   */
  async getBalance(address: string): Promise<bigint | string> {
    if (!this.isConnected || !this.provider) {
      throw new Error("SDK is not connected. Call connect() first.");
    }

    const chainType = this.config.chainType || ChainType.Substrate;

    if (chainType === ChainType.Substrate) {
      const api = this.getApi();
      if (!api) {
        throw new Error("Substrate API not available");
      }

      try {
        const account: any = await api.query.system.account(address);
        return account.data.free.toBigInt();
      } catch (error) {
        throw new Error(
          `Failed to get Substrate balance: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    } else {
      const provider = this.getEvmProvider();
      if (!provider) {
        throw new Error("EVM provider not available");
      }

      try {
        const balance = await provider.getBalance(address);
        return balance;
      } catch (error) {
        throw new Error(
          `Failed to get EVM balance: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  /**
   * Get formatted balance with decimals
   *
   * Converts balance from smallest unit to main unit
   * For Substrate: planck to SEL (18 decimals)
   * For EVM: wei to SEL (18 decimals)
   *
   * @param address - Account address
   * @param decimals - Number of decimals (default: 18)
   * @returns Formatted balance as number
   *
   * @example
   * ```typescript
   * const balance = await sdk.getFormattedBalance('5GrwvaEF...');
   * console.log('Balance:', balance, 'SEL');
   * ```
   */
  async getFormattedBalance(
    address: string,
    decimals: number = 18
  ): Promise<number> {
    const balance = await this.getBalance(address);
    const balanceNum = typeof balance === "bigint" ? balance : BigInt(balance);
    return Number(balanceNum) / Math.pow(10, decimals);
  }

  // ==========================================================================
  // Transaction Methods (EVM only)
  // ==========================================================================

  /**
   * Send native SEL token transfer (EVM only)
   *
   * @param privateKey - Sender's private key
   * @param to - Recipient address
   * @param amount - Amount in SEL (will be converted to wei)
   * @returns Transaction hash
   *
   * @example
   * ```typescript
   * const txHash = await sdk.sendTransfer(
   *   '0x...',
   *   '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
   *   '1.5'
   * );
   * console.log('Transaction:', txHash);
   * ```
   */
  async sendTransfer(
    privateKey: string,
    to: string,
    amount: string
  ): Promise<string>;

  /**
   * Send native SEL token transfer (Substrate only)
   *
   * @param from - Sender's KeyringPair
   * @param to - Recipient address
   * @param amount - Amount in planck (smallest unit)
   * @returns Transaction hash
   *
   * @example
   * ```typescript
   * import { Keyring } from '@polkadot/api';
   * const keyring = new Keyring({ type: 'sr25519' });
   * const pair = keyring.addFromUri('//Alice');
   * const txHash = await sdk.sendTransfer(pair, '5GrwvaEF...', '1000000000000');
   * ```
   */
  async sendTransfer(
    from: any,
    to: string,
    amount: string | bigint
  ): Promise<string>;

  async sendTransfer(
    fromOrPrivateKey: any,
    to: string,
    amount: string | bigint
  ): Promise<string> {
    if (this.config.chainType === ChainType.EVM) {
      if (!(this.provider instanceof EvmProvider)) {
        throw new Error("EVM provider not initialized");
      }
      return this.provider.sendTransfer(
        fromOrPrivateKey as string,
        to,
        amount as string
      );
    } else {
      if (!(this.provider instanceof SubstrateProvider)) {
        throw new Error("Substrate provider not initialized");
      }
      return this.provider.sendTransfer(fromOrPrivateKey, to, amount);
    }
  }

  /**
   * Send native token transfer without waiting for finalization (Substrate only)
   *
   * @param from - Sender's KeyringPair
   * @param to - Recipient address
   * @param amount - Amount in planck (smallest unit)
   * @returns Transaction hash
   *
   * @example
   * ```typescript
   * const txHash = await sdk.sendTransferNoWait(pair, '5GrwvaEF...', '1000000000000');
   * console.log('Transaction submitted:', txHash);
   * ```
   */
  async sendTransferNoWait(
    from: any,
    to: string,
    amount: string | bigint
  ): Promise<string> {
    if (this.config.chainType !== ChainType.Substrate) {
      throw new Error(
        "sendTransferNoWait() is only available for Substrate chains"
      );
    }
    if (!(this.provider instanceof SubstrateProvider)) {
      throw new Error("Substrate provider not initialized");
    }
    return this.provider.sendTransferNoWait(from, to, amount);
  }

  /**
   * Transfer all available balance (Substrate only)
   *
   * @param from - Sender's KeyringPair
   * @param to - Recipient address
   * @returns Transaction hash
   *
   * @example
   * ```typescript
   * const txHash = await sdk.transferAll(pair, '5GrwvaEF...');
   * console.log('All funds transferred:', txHash);
   * ```
   */
  async transferAll(from: any, to: string): Promise<string> {
    if (this.config.chainType !== ChainType.Substrate) {
      throw new Error("transferAll() is only available for Substrate chains");
    }
    if (!(this.provider instanceof SubstrateProvider)) {
      throw new Error("Substrate provider not initialized");
    }
    return this.provider.transferAll(from, to);
  }

  /**
   * Send ERC20 token transfer (EVM only)
   *
   * @param privateKey - Sender's private key
   * @param contractAddress - ERC20 token contract address
   * @param to - Recipient address
   * @param amount - Amount in tokens (human readable)
   * @param decimals - Token decimals (default: 18)
   * @returns Transaction hash
   *
   * @example
   * ```typescript
   * const txHash = await sdk.sendERC20Transfer(
   *   '0x...',
   *   '0x1234...', // USDT contract
   *   '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
   *   '100',
   *   6 // USDT has 6 decimals
   * );
   * ```
   */
  async sendERC20Transfer(
    privateKey: string,
    contractAddress: string,
    to: string,
    amount: string,
    decimals: number = 18
  ): Promise<string> {
    if (this.config.chainType !== ChainType.EVM) {
      throw new Error("sendERC20Transfer() is only available for EVM chains");
    }
    if (!(this.provider instanceof EvmProvider)) {
      throw new Error("EVM provider not initialized");
    }
    return this.provider.sendERC20Transfer(
      privateKey,
      contractAddress,
      to,
      amount,
      decimals
    );
  }

  /**
   * Execute a custom contract transaction (EVM only)
   *
   * @param privateKey - Sender's private key
   * @param contractAddress - Smart contract address
   * @param abi - Contract ABI array
   * @param functionName - Function to call
   * @param args - Function arguments
   * @param value - Optional native token value to send (in SEL)
   * @returns Transaction hash
   *
   * @example
   * ```typescript
   * const txHash = await sdk.executeContractTransaction(
   *   '0x...',
   *   '0x1234...',
   *   contractABI,
   *   'swap',
   *   [tokenIn, tokenOut, amountIn, amountOutMin],
   *   '0.1' // Send 0.1 SEL with transaction
   * );
   * ```
   */
  async executeContractTransaction(
    privateKey: string,
    contractAddress: string,
    abi: string[],
    functionName: string,
    args: any[] = [],
    value?: string
  ): Promise<string> {
    if (this.config.chainType !== ChainType.EVM) {
      throw new Error(
        "executeContractTransaction() is only available for EVM chains"
      );
    }
    if (!(this.provider instanceof EvmProvider)) {
      throw new Error("EVM provider not initialized");
    }
    return this.provider.executeContractTransaction(
      privateKey,
      contractAddress,
      abi,
      functionName,
      args,
      value
    );
  }

  /**
   * Call a contract function (read-only, no gas cost) (EVM only)
   *
   * @param contractAddress - Smart contract address
   * @param abi - Contract ABI array
   * @param functionName - Function to call
   * @param args - Function arguments
   * @returns Function return value
   *
   * @example
   * ```typescript
   * const totalSupply = await sdk.callContractFunction(
   *   '0x1234...',
   *   erc20ABI,
   *   'totalSupply',
   *   []
   * );
   * ```
   */
  async callContractFunction(
    contractAddress: string,
    abi: string[],
    functionName: string,
    args: any[] = []
  ): Promise<any> {
    if (this.config.chainType !== ChainType.EVM) {
      throw new Error(
        "callContractFunction() is only available for EVM chains"
      );
    }
    if (!(this.provider instanceof EvmProvider)) {
      throw new Error("EVM provider not initialized");
    }
    return this.provider.callContractFunction(
      contractAddress,
      abi,
      functionName,
      args
    );
  }

  /**
   * Get ERC20 token balance (EVM only)
   *
   * @param contractAddress - ERC20 token contract address
   * @param account - Account address to check
   * @returns Token balance (raw value in smallest unit)
   *
   * @example
   * ```typescript
   * const balance = await sdk.getERC20Balance(
   *   '0x1234...', // USDT contract
   *   '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
   * );
   * ```
   */
  async getERC20Balance(
    contractAddress: string,
    account: string
  ): Promise<string> {
    if (this.config.chainType !== ChainType.EVM) {
      throw new Error("getERC20Balance() is only available for EVM chains");
    }
    if (!(this.provider instanceof EvmProvider)) {
      throw new Error("EVM provider not initialized");
    }
    return this.provider.getERC20Balance(contractAddress, account);
  }

  /**
   * Get ERC20 token information (EVM only)
   *
   * @param contractAddress - ERC20 token contract address
   * @returns Token info (name, symbol, decimals)
   *
   * @example
   * ```typescript
   * const info = await sdk.getERC20Info('0x1234...');
   * console.log(info.name, info.symbol, info.decimals);
   * ```
   */
  async getERC20Info(contractAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  }> {
    if (this.config.chainType !== ChainType.EVM) {
      throw new Error("getERC20Info() is only available for EVM chains");
    }
    if (!(this.provider instanceof EvmProvider)) {
      throw new Error("EVM provider not initialized");
    }
    return this.provider.getERC20Info(contractAddress);
  }

  // ==========================================================================
  // Contract Methods
  // ==========================================================================

  /**
   * Get a contract instance (EVM only)
   *
   * @param address - Contract address
   * @param abi - Contract ABI
   * @param chainType - Optional chain type (defaults to current config)
   * @returns ethers.Contract instance
   *
   * @example
   * ```typescript
   * const contract = await sdk.getContract(
   *   '0x1234...',
   *   erc20ABI
   * );
   * const balance = await contract.balanceOf('0x...');
   * ```
   */
  async getContract(
    address: string,
    abi: string[],
    chainType?: ChainType
  ): Promise<any> {
    const targetChainType = chainType || this.config.chainType;

    if (targetChainType !== ChainType.EVM) {
      throw new Error("getContract() is only available for EVM chains");
    }

    if (!(this.provider instanceof EvmProvider)) {
      throw new Error("EVM provider not initialized");
    }

    const { ethers } = await import("ethers");
    const provider = this.provider.getProvider();

    if (!provider) {
      throw new Error("EVM provider not connected");
    }

    return new ethers.Contract(address, abi, provider);
  }

  /**
   * Get a contract instance by address (EVM only)
   * Convenience method that uses a minimal ABI for basic interactions
   *
   * @param address - Contract address
   * @param chainType - Optional chain type (defaults to current config)
   * @returns ethers.Contract instance with minimal ABI
   *
   * @example
   * ```typescript
   * const contract = await sdk.getContractInstance('0x1234...');
   * // Use for basic contract checks
   * const code = await contract.getDeployedCode();
   * ```
   */
  async getContractInstance(
    address: string,
    chainType?: ChainType
  ): Promise<any> {
    const targetChainType = chainType || this.config.chainType;

    if (targetChainType !== ChainType.EVM) {
      throw new Error("getContractInstance() is only available for EVM chains");
    }

    if (!(this.provider instanceof EvmProvider)) {
      throw new Error("EVM provider not initialized");
    }

    // Minimal ABI for basic contract interactions
    const minimalABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address) view returns (uint256)",
    ];

    return this.getContract(address, minimalABI, chainType);
  }

  // ==========================================================================
  // Block Information Methods
  // ==========================================================================

  /**
   * Get current block information
   * Returns different data based on chain type
   *
   * @returns Block information object
   *
   * @example
   * ```typescript
   * const block = await sdk.getCurrentBlock();
   * console.log('Block number:', block.number);
   * console.log('Block hash:', block.hash);
   * ```
   */
  async getCurrentBlock(): Promise<any> {
    if (!this.isConnected) {
      throw new Error("SDK not connected");
    }

    if (this.config.chainType === ChainType.EVM) {
      if (!(this.provider instanceof EvmProvider)) {
        throw new Error("EVM provider not initialized");
      }

      const provider = this.provider.getProvider();
      if (!provider) {
        throw new Error("EVM provider not connected");
      }

      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber);

      return {
        number: block?.number,
        hash: block?.hash,
        timestamp: block?.timestamp,
        parentHash: block?.parentHash,
        transactions: block?.transactions,
        gasLimit: block?.gasLimit?.toString(),
        gasUsed: block?.gasUsed?.toString(),
        miner: block?.miner,
        chainType: ChainType.EVM,
      };
    } else {
      // Substrate chain
      if (!(this.provider instanceof SubstrateProvider)) {
        throw new Error("Substrate provider not initialized");
      }

      const api = this.provider.getApi();
      if (!api) {
        throw new Error("Substrate API not initialized");
      }

      const [header, hash] = await Promise.all([
        api.rpc.chain.getHeader(),
        api.rpc.chain.getBlockHash(),
      ]);

      return {
        number: header.number.toNumber(),
        hash: hash.toString(),
        parentHash: header.parentHash.toString(),
        stateRoot: header.stateRoot.toString(),
        extrinsicsRoot: header.extrinsicsRoot.toString(),
        chainType: ChainType.Substrate,
      };
    }
  }

  // ==========================================================================
  // Provider Access Methods
  // ==========================================================================

  /**
   * Get the Polkadot API instance (Substrate only)
   *
   * @returns {ApiPromise | null} Polkadot API instance or null
   * @throws {Error} If called on EVM chain
   */
  getApi(): ApiPromise | null {
    if (this.config.chainType === ChainType.EVM) {
      throw new Error("getApi() is only available for Substrate chains");
    }
    return this.provider instanceof SubstrateProvider
      ? this.provider.getApi()
      : null;
  }

  /**
   * Get the ethers provider instance (EVM only)
   *
   * @returns {JsonRpcProvider | null} Ethers provider or null
   * @throws {Error} If called on Substrate chain
   */
  getEvmProvider(): JsonRpcProvider | null {
    if (this.config.chainType === ChainType.Substrate) {
      throw new Error("getEvmProvider() is only available for EVM chains");
    }
    return this.provider instanceof EvmProvider
      ? this.provider.getProvider()
      : null;
  }

  // ==========================================================================
  // Governance Pallet Access (Substrate only)
  // ==========================================================================

  /**
   * Get the Democracy pallet manager (lazy-loaded)
   *
   * Provides access to on-chain democracy features including referenda,
   * proposals, voting, and delegation.
   *
   * @returns {DemocracyManager} Democracy pallet manager
   * @throws {Error} If called on EVM chain or not connected
   *
   * @example
   * ```typescript
   * const democracy = sdk.democracy;
   *
   * // Get active referenda
   * const referenda = await democracy.queries.getActiveReferenda();
   *
   * // Vote on a referendum
   * const tx = democracy.vote({ refIndex: 0, vote: { Standard: { vote: { aye: true, conviction: 'Locked1x' }, balance: 1000n } } });
   * await tx.signAndSend(signer);
   * ```
   */
  get democracy(): DemocracyManager {
    if (this.config.chainType === ChainType.EVM) {
      throw new Error("democracy is only available for Substrate chains");
    }
    if (!this.isConnected) {
      throw new Error("SDK is not connected. Call connect() first.");
    }

    if (!this._democracy) {
      const api = this.getApi();
      if (!api) {
        throw new Error("Substrate API not available");
      }
      this._democracy = new DemocracyManager(api);
    }

    return this._democracy!;
  }

  /**
   * Get the Council pallet manager (lazy-loaded)
   *
   * Provides access to council collective features including proposals,
   * voting, and member management.
   *
   * @returns {CouncilManager} Council pallet manager
   * @throws {Error} If called on EVM chain or not connected
   *
   * @example
   * ```typescript
   * const council = sdk.council;
   *
   * // Get council members
   * const members = await council.queries.members();
   *
   * // Get proposals with votes
   * const proposals = await council.queries.getProposalsWithVotes();
   * ```
   */
  get council(): CouncilManager {
    if (this.config.chainType === ChainType.EVM) {
      throw new Error("council is only available for Substrate chains");
    }
    if (!this.isConnected) {
      throw new Error("SDK is not connected. Call connect() first.");
    }

    if (!this._council) {
      const api = this.getApi();
      if (!api) {
        throw new Error("Substrate API not available");
      }
      this._council = new CouncilManager(api);
    }

    return this._council!;
  }

  /**
   * Get the Treasury pallet manager (lazy-loaded)
   *
   * Provides access to treasury features including spending proposals,
   * approvals, and treasury pot queries.
   *
   * @returns {TreasuryManager} Treasury pallet manager
   * @throws {Error} If called on EVM chain or not connected
   *
   * @example
   * ```typescript
   * const treasury = sdk.treasury;
   *
   * // Get treasury balance
   * const pot = await treasury.queries.getPot();
   *
   * // Propose spending
   * const tx = treasury.proposeSpend({ value: 1000n, beneficiary: '5GrwvaEF...' });
   * await tx.signAndSend(signer);
   * ```
   */
  get treasury(): TreasuryManager {
    if (this.config.chainType === ChainType.EVM) {
      throw new Error("treasury is only available for Substrate chains");
    }
    if (!this.isConnected) {
      throw new Error("SDK is not connected. Call connect() first.");
    }

    if (!this._treasury) {
      const api = this.getApi();
      if (!api) {
        throw new Error("Substrate API not available");
      }
      this._treasury = new TreasuryManager(api);
    }

    return this._treasury!;
  }

  /**
   * Get the Council Elections pallet manager (lazy-loaded)
   *
   * Provides access to council elections features including voting for
   * candidates, submitting candidacy, and election queries.
   *
   * @returns {ElectionsPhragmenManager} Elections pallet manager
   * @throws {Error} If called on EVM chain or not connected
   *
   * @example
   * ```typescript
   * const elections = sdk.councilElections;
   *
   * // Get current council members
   * const members = await elections.getMembers();
   *
   * // Vote for candidates
   * const tx = elections.vote({ votes: ['5GrwvaEF...', '5FHneW...'], value: 1000n });
   * await tx.signAndSend(signer);
   * ```
   */
  get councilElections(): ElectionsPhragmenManager {
    if (this.config.chainType === ChainType.EVM) {
      throw new Error(
        "councilElections is only available for Substrate chains"
      );
    }
    if (!this.isConnected) {
      throw new Error("SDK is not connected. Call connect() first.");
    }

    if (!this._councilElections) {
      const api = this.getApi();
      if (!api) {
        throw new Error("Substrate API not available");
      }
      this._councilElections = new ElectionsPhragmenManager(api);
    }

    return this._councilElections!;
  }

  // ==========================================================================
  // Builder Pattern Methods
  // ==========================================================================

  /**
   * Set the endpoint URL
   */
  withEndpoint(endpoint: string): SelendraSDK {
    this.config.endpoint = endpoint;
    return this;
  }

  /**
   * Set the network
   */
  withNetwork(network: string): SelendraSDK {
    this.config.network = network;
    return this;
  }

  /**
   * Set the chain type
   */
  withChainType(chainType: ChainType): SelendraSDK {
    this.config.chainType = chainType;
    return this;
  }

  /**
   * Set multiple configuration options at once
   */
  withOptions(options: Partial<SDKConfig>): SelendraSDK {
    this.config = { ...this.config, ...options };
    this.logger.setDebug(this.config.debug || false);
    return this;
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Initialize the appropriate provider based on chain type
   */
  private async initializeProvider(): Promise<void> {
    const chainType = this.config.chainType || ChainType.Substrate;

    if (chainType === ChainType.EVM) {
      this.provider = new EvmProvider(this.config);
    } else {
      this.provider = new SubstrateProvider(this.config);
    }

    // Forward provider events to SDK
    this.provider.on("connected", () => {
      if (!this.isConnected) {
        this.isConnected = true;
        this.emit("connected");
      }
    });

    this.provider.on("disconnected", () => {
      this.isConnected = false;
      this.emit("disconnected");
      if (this.config.autoReconnect) {
        this.scheduleReconnect();
      }
    });

    this.provider.on("error", (error) => {
      this.emit("error", error);
    });

    // Connect the provider
    await this.provider.connect();
  }

  /**
   * Initialize Unified Accounts Manager
   *
   * Note: Currently, this creates a mock EVM provider to enable unified accounts
   * functionality when connected to Substrate. In the future, the SDK will support
   * dual-provider mode where both chains can be active simultaneously.
   *
   * @private
   */
  private async initializeUnifiedAccounts(): Promise<void> {
    try {
      if (!(this.provider instanceof SubstrateProvider)) {
        this.logger.debug(
          "Unified accounts only available for Substrate connections"
        );
        return;
      }

      // Create a temporary EVM provider for unified accounts
      // This uses the same endpoint but switches to HTTP/HTTPS for EVM
      const evmEndpoint = this.config.endpoint
        ?.replace("wss://", "https://")
        .replace("ws://", "http://");

      if (!evmEndpoint) {
        this.logger.debug("Cannot determine EVM endpoint for unified accounts");
        return;
      }

      const evmConfig: SDKConfig = {
        ...this.config,
        endpoint: evmEndpoint,
        chainType: ChainType.EVM,
        debug: this.config.debug,
      };

      const evmProvider = new EvmProvider(evmConfig);

      // Note: We don't actually connect the EVM provider here
      // UnifiedAccountsManager only needs it for signing operations

      // Initialize unified accounts manager
      const chainId = this.config.chainId || 1961; // Selendra testnet chain ID
      const ss58Prefix = 204; // Selendra SS58 prefix

      this.unifiedAccounts = new UnifiedAccountsManager(
        this.provider,
        evmProvider,
        chainId,
        ss58Prefix
      );

      // Initialize the signature helper
      await this.unifiedAccounts.initialize();

      this.logger.debug("Unified accounts initialized");
    } catch (error) {
      this.logger.warn("Failed to initialize unified accounts:", error);
      // Don't throw - unified accounts is optional
      this.unifiedAccounts = undefined;
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    const maxAttempts = this.config.retryAttempts || 3;

    if (this.currentRetryAttempt >= maxAttempts) {
      this.logger.debug("Max retry attempts reached, giving up");
      return;
    }

    this.currentRetryAttempt++;
    const delay = (this.config.retryDelay || 1000) * this.currentRetryAttempt;

    this.logger.debug(
      `Scheduling reconnect attempt ${this.currentRetryAttempt}/${maxAttempts} in ${delay}ms`
    );
    this.emit("reconnecting", this.currentRetryAttempt);

    this.reconnectTimer = setTimeout(() => {
      this.logger.debug("Attempting to reconnect...");
      this.connect().catch((error) => {
        this.logger.error("Reconnection failed:", error);
      });
    }, delay);
  }
}
