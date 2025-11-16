/**
 * EVM Transaction Management for the Selendra SDK
 * Provides transaction building, gas estimation, signing, and tracking
 * Compatible with ethers.js v6 transaction API
 */

import { EventEmitter } from 'events';
import type {
  Address,
  Balance,
  TransactionHash,
  BlockNumber,
  GasAmount,
  Nonce,
} from '../types/common';
import { EvmTransactionType } from '../types/evm';
import type {
  EvmTransaction,
  EvmTransactionRequest,
  EvmTransactionReceipt,
  EvmEstimateGasOptions,
} from '../types/evm';
import {
  etherToWei,
  weiToEther,
  gweiToWei,
  GAS_ESTIMATION_DEFAULTS,
  DEFAULT_TX_OVERRIDES,
} from './config';

/**
 * Transaction status enumeration
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  REPLACED = 'replaced',
  CANCELLED = 'cancelled',
}

/**
 * Transaction options for building and sending
 */
export interface TransactionOptions {
  /** Gas limit override */
  gasLimit?: GasAmount | 'auto';
  /** Gas price override */
  gasPrice?: Balance | 'auto';
  /** Maximum fee per gas (EIP-1559) */
  maxFeePerGas?: Balance | 'auto';
  /** Maximum priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: Balance | 'auto';
  /** Transaction type override */
  type?: EvmTransactionType | 'auto';
  /** Number of confirmations to wait for */
  confirmations?: number;
  /** Transaction timeout in milliseconds */
  timeout?: number;
  /** Polling interval in milliseconds */
  pollingInterval?: number;
  /** Replace existing transaction if gas price increases */
  replaceable?: boolean;
  /** Access list for EIP-2930 transactions */
  accessList?: Array<{ address: Address; storageKeys: string[] }>;
}

/**
 * Gas estimation result
 */
export interface GasEstimation {
  /** Estimated gas limit */
  gasLimit: string;
  /** Estimated gas price (legacy) */
  gasPrice?: string;
  /** Estimated max fee per gas (EIP-1559) */
  maxFeePerGas?: string;
  /** Estimated max priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: string;
  /** Estimated total cost */
  estimatedCost: string;
  /** Recommended transaction type */
  recommendedType: EvmTransactionType;
}

/**
 * Transaction builder class
 */
export class TransactionBuilder {
  private transaction: Partial<EvmTransactionRequest>;

  constructor(from?: Address) {
    this.transaction = {
      from,
      type: EvmTransactionType.EIP_1559,
      gas: undefined,
      gasPrice: undefined,
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
    };
  }

  /**
   * Set recipient address
   */
  to(address: Address): TransactionBuilder {
    this.transaction.to = address;
    return this;
  }

  /**
   * Set value to transfer (in ether)
   */
  value(amount: string | number): TransactionBuilder {
    this.transaction.value = etherToWei(amount);
    return this;
  }

  /**
   * Set value to transfer (in wei)
   */
  valueWei(amount: Balance): TransactionBuilder {
    this.transaction.value = amount;
    return this;
  }

  /**
   * Set transaction data
   */
  data(data: string): TransactionBuilder {
    this.transaction.data = data;
    return this;
  }

  /**
   * Set gas limit
   */
  gasLimit(limit: GasAmount): TransactionBuilder {
    this.transaction.gas = limit;
    return this;
  }

  /**
   * Set gas price (for legacy transactions)
   */
  gasPrice(price: string | number): TransactionBuilder {
    const priceWei = typeof price === 'number' ? gweiToWei(price) : price;
    this.transaction.gasPrice = priceWei;
    this.transaction.type = EvmTransactionType.LEGACY;
    return this;
  }

  /**
   * Set EIP-1559 gas parameters
   */
  eip1559(maxFee: string | number, priorityFee: string | number): TransactionBuilder {
    this.transaction.maxFeePerGas = typeof maxFee === 'number' ? gweiToWei(maxFee) : maxFee;
    this.transaction.maxPriorityFeePerGas =
      typeof priorityFee === 'number' ? gweiToWei(priorityFee) : priorityFee;
    this.transaction.type = EvmTransactionType.EIP_1559;
    return this;
  }

  /**
   * Set transaction nonce
   */
  nonce(nonceValue: Nonce): TransactionBuilder {
    this.transaction.nonce = nonceValue;
    return this;
  }

  /**
   * Set chain ID
   */
  chainId(chainIdValue: number): TransactionBuilder {
    this.transaction.chainId = chainIdValue;
    return this;
  }

  /**
   * Set access list (EIP-2930)
   */
  accessList(list: Array<{ address: Address; storageKeys: string[] }>): TransactionBuilder {
    this.transaction.accessList = list;
    if (this.transaction.type !== EvmTransactionType.EIP_2930) {
      this.transaction.type = EvmTransactionType.EIP_2930;
    }
    return this;
  }

  /**
   * Build the transaction request
   */
  build(): EvmTransactionRequest {
    const tx = { ...this.transaction } as EvmTransactionRequest;

    // Validate required fields
    if (!tx.to && !tx.data) {
      throw new Error('Transaction must have either a "to" address or "data" field');
    }

    return tx;
  }

  /**
   * Create a simple transfer transaction
   */
  static transfer(from: Address, to: Address, amount: string | number): TransactionBuilder {
    return new TransactionBuilder(from)
      .to(to)
      .value(amount)
      .gasLimit(GAS_ESTIMATION_DEFAULTS.SIMPLE_TRANSFER);
  }

  /**
   * Create a contract deployment transaction
   */
  static deploy(from: Address, bytecode: string): TransactionBuilder {
    return new TransactionBuilder(from)
      .data(bytecode)
      .gasLimit(GAS_ESTIMATION_DEFAULTS.CONTRACT_DEPLOYMENT);
  }

  /**
   * Create a contract interaction transaction
   */
  static contractInteraction(from: Address, to: Address, data: string): TransactionBuilder {
    return new TransactionBuilder(from)
      .to(to)
      .data(data)
      .gasLimit(GAS_ESTIMATION_DEFAULTS.CONTRACT_INTERACTION);
  }
}

/**
 * Transaction manager for tracking and managing transactions
 */
export class TransactionManager extends EventEmitter {
  private pendingTransactions = new Map<string, TransactionTracker>();
  private gasPriceCache?: { price: string; timestamp: number };
  private maxFeePerGasCache?: { fee: string; timestamp: number };
  private maxPriorityFeePerGasCache?: { fee: string; timestamp: number };

  constructor(private provider: any) {
    super();
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(tx: EvmTransactionRequest | EvmEstimateGasOptions): Promise<GasEstimation> {
    try {
      // Get gas limit estimate
      const gasLimit = await this.provider.estimateGas(tx);

      // Get current gas prices
      const gasPrice = await this.getGasPrice();
      const maxFeePerGas = await this.getMaxFeePerGas();
      const maxPriorityFeePerGas = await this.getMaxPriorityFeePerGas();

      // Determine best transaction type
      const supportsEIP1559 = await this.supportsEIP1559();
      const recommendedType = supportsEIP1559
        ? EvmTransactionType.EIP_1559
        : EvmTransactionType.LEGACY;

      // Calculate estimated costs
      let estimatedCost: string;
      if (supportsEIP1559) {
        estimatedCost = (BigInt(gasLimit) * BigInt(maxFeePerGas)).toString();
      } else {
        estimatedCost = (BigInt(gasLimit) * BigInt(gasPrice)).toString();
      }

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: supportsEIP1559 ? undefined : gasPrice,
        maxFeePerGas: supportsEIP1559 ? maxFeePerGas : undefined,
        maxPriorityFeePerGas: supportsEIP1559 ? maxPriorityFeePerGas : undefined,
        estimatedCost,
        recommendedType,
      };
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error}`);
    }
  }

  /**
   * Build a complete transaction with optimal gas settings
   */
  async buildTransaction(
    request: EvmTransactionRequest,
    options: TransactionOptions = {},
  ): Promise<EvmTransactionRequest> {
    const tx = { ...request };

    // Set from address if not provided
    if (!tx.from) {
      throw new Error('Transaction must have a "from" address');
    }

    // Get nonce if not provided
    if (tx.nonce === undefined) {
      tx.nonce = await this.provider.getTransactionCount(tx.from, 'latest');
    }

    // Get chain ID if not provided
    if (tx.chainId === undefined) {
      const network = await this.provider.getNetwork();
      tx.chainId = Number(network.chainId);
    }

    // Estimate gas if needed
    if (options.gasLimit !== 'auto' && !tx.gas) {
      const gasEstimation = await this.estimateGas(tx);
      tx.gas = gasEstimation.gasLimit;
    } else if (options.gasLimit === 'auto') {
      const gasEstimation = await this.estimateGas(tx);
      tx.gas = gasEstimation.gasLimit;
    }

    // Set gas price based on transaction type
    const supportsEIP1559 = await this.supportsEIP1559();

    if (
      tx.type === EvmTransactionType.EIP_1559 ||
      (tx.type === ('auto' as any) && supportsEIP1559)
    ) {
      // EIP-1559 transaction
      tx.type = EvmTransactionType.EIP_1559;

      if (options.maxFeePerGas === 'auto' || !tx.maxFeePerGas) {
        tx.maxFeePerGas = await this.getMaxFeePerGas();
      }

      if (options.maxPriorityFeePerGas === 'auto' || !tx.maxPriorityFeePerGas) {
        tx.maxPriorityFeePerGas = await this.getMaxPriorityFeePerGas();
      }

      // Clear legacy gas price for EIP-1559
      delete tx.gasPrice;
    } else {
      // Legacy transaction
      tx.type = EvmTransactionType.LEGACY;

      if (options.gasPrice === 'auto' || !tx.gasPrice) {
        tx.gasPrice = await this.getGasPrice();
      }

      // Clear EIP-1559 fields for legacy
      delete tx.maxFeePerGas;
      delete tx.maxPriorityFeePerGas;
    }

    // Apply access list if provided
    if (options.accessList) {
      tx.accessList = options.accessList;
      if (tx.type === EvmTransactionType.LEGACY) {
        tx.type = EvmTransactionType.EIP_2930;
      }
    }

    return tx;
  }

  /**
   * Send a transaction and start tracking it
   */
  async sendTransaction(
    request: EvmTransactionRequest,
    options: TransactionOptions = {},
  ): Promise<TransactionTracker> {
    // Build transaction with optimal settings
    const transaction = await this.buildTransaction(request, options);

    // Send transaction
    const txHash = await this.provider.sendTransaction(transaction);

    // Create tracker
    const tracker = new TransactionTracker(txHash, transaction, this.provider, {
      confirmations: options.confirmations || 1,
      timeout: options.timeout || 300000,
      pollingInterval: options.pollingInterval || 2000,
      replaceable: options.replaceable || false,
    });

    // Start tracking
    this.pendingTransactions.set(txHash, tracker);
    this.setupTrackerEvents(tracker);

    return tracker;
  }

  /**
   * Get transaction tracker by hash
   */
  getTracker(txHash: TransactionHash): TransactionTracker | undefined {
    return this.pendingTransactions.get(txHash);
  }

  /**
   * Get all pending transactions
   */
  getPendingTransactions(): TransactionTracker[] {
    return Array.from(this.pendingTransactions.values());
  }

  /**
   * Cancel a transaction
   */
  async cancelTransaction(txHash: TransactionHash, fromAddress: Address): Promise<TransactionHash> {
    const tracker = this.pendingTransactions.get(txHash);
    if (!tracker) {
      throw new Error('Transaction not found');
    }

    if (tracker.isFinalized()) {
      throw new Error('Cannot cancel finalized transaction');
    }

    // Get current nonce and gas price
    const nonce = await this.provider.getTransactionCount(fromAddress, 'latest');
    const gasPrice = await this.getGasPrice();

    // Create 0-value transaction with same nonce and higher gas price
    const cancelTx: EvmTransactionRequest = {
      from: fromAddress,
      to: fromAddress, // Self-transfer
      value: '0x0',
      nonce: tracker.getNonce(),
      gasPrice: ((BigInt(gasPrice) * BigInt(110)) / BigInt(100)).toString(), // 10% higher
      gas: GAS_ESTIMATION_DEFAULTS.SIMPLE_TRANSFER.toString(),
    };

    return this.provider.sendTransaction(cancelTx);
  }

  /**
   * Speed up a transaction (replace with higher gas price)
   */
  async speedUpTransaction(txHash: TransactionHash): Promise<TransactionHash> {
    const tracker = this.pendingTransactions.get(txHash);
    if (!tracker) {
      throw new Error('Transaction not found');
    }

    if (!tracker.isReplaceable()) {
      throw new Error('Transaction is not replaceable');
    }

    const originalTx = tracker.getTransaction();
    const gasIncrease = BigInt(110) / BigInt(100); // 10% increase

    const speedUpTx: EvmTransactionRequest = {
      ...originalTx,
      gasPrice: originalTx.gasPrice
        ? (BigInt(originalTx.gasPrice) * gasIncrease).toString()
        : undefined,
      maxFeePerGas: originalTx.maxFeePerGas
        ? (BigInt(originalTx.maxFeePerGas) * gasIncrease).toString()
        : undefined,
      maxPriorityFeePerGas: originalTx.maxPriorityFeePerGas
        ? (BigInt(originalTx.maxPriorityFeePerGas) * gasIncrease).toString()
        : undefined,
    };

    return this.provider.sendTransaction(speedUpTx);
  }

  /**
   * Get current gas price (cached for 30 seconds)
   */
  async getGasPrice(): Promise<string> {
    const now = Date.now();
    if (this.gasPriceCache && now - this.gasPriceCache.timestamp < 30000) {
      return this.gasPriceCache.price;
    }

    const gasPrice = await this.provider.getGasPrice();
    this.gasPriceCache = {
      price: gasPrice.toString(),
      timestamp: now,
    };

    return this.gasPriceCache.price;
  }

  /**
   * Get max fee per gas (EIP-1559)
   */
  async getMaxFeePerGas(): Promise<string> {
    const now = Date.now();
    if (this.maxFeePerGasCache && now - this.maxFeePerGasCache.timestamp < 30000) {
      return this.maxFeePerGasCache.fee;
    }

    const block = await this.provider.getBlock('latest');
    const baseFee = block.baseFeePerGas || '0x0';
    const priorityFee = await this.getMaxPriorityFeePerGas();

    const maxFee = (BigInt(baseFee) * BigInt(2) + BigInt(priorityFee)).toString();

    this.maxFeePerGasCache = {
      fee: maxFee,
      timestamp: now,
    };

    return maxFee;
  }

  /**
   * Get max priority fee per gas (EIP-1559)
   */
  async getMaxPriorityFeePerGas(): Promise<string> {
    const now = Date.now();
    if (this.maxPriorityFeePerGasCache && now - this.maxPriorityFeePerGasCache.timestamp < 30000) {
      return this.maxPriorityFeePerGasCache.fee;
    }

    const priorityFee = await this.provider.send('eth_maxPriorityFeePerGas', []);

    this.maxPriorityFeePerGasCache = {
      fee: priorityFee,
      timestamp: now,
    };

    return priorityFee;
  }

  /**
   * Check if network supports EIP-1559
   */
  async supportsEIP1559(): Promise<boolean> {
    try {
      const block = await this.provider.getBlock('latest');
      return block.baseFeePerGas !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Setup event listeners for transaction tracker
   */
  private setupTrackerEvents(tracker: TransactionTracker): void {
    tracker.on('statusChanged', (status: TransactionStatus, receipt?: EvmTransactionReceipt) => {
      this.emit('transactionStatusChanged', tracker.getHash(), status, receipt);

      if (tracker.isFinalized()) {
        this.pendingTransactions.delete(tracker.getHash());
        this.emit('transactionFinalized', tracker.getHash(), status, receipt);
      }
    });

    tracker.on('error', (error: Error) => {
      this.emit('transactionError', tracker.getHash(), error);
      this.pendingTransactions.delete(tracker.getHash());
    });

    // Start tracking
    tracker.startTracking();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Stop tracking all pending transactions
    for (const tracker of this.pendingTransactions.values()) {
      tracker.stopTracking();
    }
    this.pendingTransactions.clear();

    // Remove all event listeners
    this.removeAllListeners();
  }
}

/**
 * Transaction tracker for monitoring individual transactions
 */
export class TransactionTracker extends EventEmitter {
  private status: TransactionStatus = TransactionStatus.PENDING;
  private receipt?: EvmTransactionReceipt;
  private isTracking = false;
  private trackingTimer?: NodeJS.Timeout;
  private timeoutTimer?: NodeJS.Timeout;

  constructor(
    private readonly hash: TransactionHash,
    private readonly transaction: EvmTransactionRequest,
    private readonly provider: any,
    private readonly options: {
      confirmations: number;
      timeout: number;
      pollingInterval: number;
      replaceable: boolean;
    },
  ) {
    super();
  }

  /**
   * Get transaction hash
   */
  getHash(): TransactionHash {
    return this.hash;
  }

  /**
   * Get original transaction
   */
  getTransaction(): EvmTransactionRequest {
    return { ...this.transaction };
  }

  /**
   * Get transaction nonce
   */
  getNonce(): number {
    return Number(this.transaction.nonce || 0);
  }

  /**
   * Get current status
   */
  getStatus(): TransactionStatus {
    return this.status;
  }

  /**
   * Get transaction receipt (if available)
   */
  getReceipt(): EvmTransactionReceipt | undefined {
    return this.receipt;
  }

  /**
   * Check if transaction is finalized
   */
  isFinalized(): boolean {
    return (
      this.status === TransactionStatus.CONFIRMED ||
      this.status === TransactionStatus.FAILED ||
      this.status === TransactionStatus.CANCELLED
    );
  }

  /**
   * Check if transaction is replaceable
   */
  isReplaceable(): boolean {
    return this.options.replaceable && this.status === TransactionStatus.PENDING;
  }

  /**
   * Start tracking the transaction
   */
  startTracking(): void {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;
    this.startPolling();
    this.startTimeout();
  }

  /**
   * Stop tracking the transaction
   */
  stopTracking(): void {
    this.isTracking = false;

    if (this.trackingTimer) {
      clearInterval(this.trackingTimer);
      this.trackingTimer = undefined;
    }

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(): Promise<EvmTransactionReceipt> {
    return new Promise((resolve, reject) => {
      if (this.receipt && this.status === TransactionStatus.CONFIRMED) {
        resolve(this.receipt);
        return;
      }

      if (this.isFinalized() && this.status !== TransactionStatus.CONFIRMED) {
        reject(new Error(`Transaction ${this.status}: ${this.hash}`));
        return;
      }

      const handleStatusChange = (status: TransactionStatus, receipt?: EvmTransactionReceipt) => {
        if (status === TransactionStatus.CONFIRMED && receipt) {
          resolve(receipt);
        } else if (this.isFinalized() && status !== TransactionStatus.CONFIRMED) {
          reject(new Error(`Transaction ${status}: ${this.hash}`));
        }
      };

      this.once('statusChanged', handleStatusChange);
    });
  }

  /**
   * Start polling for transaction updates
   */
  private startPolling(): void {
    this.trackingTimer = setInterval(async () => {
      try {
        await this.updateStatus();
      } catch (error) {
        this.emit('error', error);
        this.stopTracking();
      }
    }, this.options.pollingInterval);
  }

  /**
   * Start timeout timer
   */
  private startTimeout(): void {
    this.timeoutTimer = setTimeout(() => {
      if (this.status === TransactionStatus.PENDING) {
        this.status = TransactionStatus.FAILED;
        this.emit('statusChanged', this.status);
        this.emit('error', new Error('Transaction timeout'));
      }
      this.stopTracking();
    }, this.options.timeout);
  }

  /**
   * Update transaction status
   */
  private async updateStatus(): Promise<void> {
    try {
      // Get transaction receipt
      const receipt = await this.provider.getTransactionReceipt(this.hash);

      if (receipt) {
        this.receipt = receipt;

        // Check status
        if (receipt.status === 1) {
          // Check if we have enough confirmations
          const currentBlock = await this.provider.getBlockNumber();
          const confirmations = currentBlock - Number(receipt.blockNumber);

          if (confirmations >= this.options.confirmations) {
            this.status = TransactionStatus.CONFIRMED;
            this.emit('statusChanged', this.status, receipt);
            this.stopTracking();
          } else {
            this.status = TransactionStatus.PENDING;
            this.emit('statusChanged', this.status, receipt);
          }
        } else {
          this.status = TransactionStatus.FAILED;
          this.emit('statusChanged', this.status, receipt);
          this.stopTracking();
        }
      }
      // Transaction is still pending
    } catch (error) {
      // Transaction might not be indexed yet, continue polling
      if (this.status !== TransactionStatus.PENDING) {
        this.status = TransactionStatus.PENDING;
        this.emit('statusChanged', this.status);
      }
    }
  }
}

/**
 * Transaction utilities
 */
export class TransactionUtils {
  /**
   * Calculate transaction fee
   */
  static calculateFee(gasUsed: string | number, gasPrice: Balance): Balance {
    const gas = typeof gasUsed === 'string' ? BigInt(gasUsed) : BigInt(gasUsed);
    const price = typeof gasPrice === 'string' ? BigInt(gasPrice) : gasPrice;
    return (gas * price).toString();
  }

  /**
   * Calculate EIP-1559 transaction fee
   */
  static calculateEIP1559Fee(
    gasUsed: string | number,
    baseFee: Balance,
    priorityFee: Balance,
  ): Balance {
    const gas = typeof gasUsed === 'string' ? BigInt(gasUsed) : BigInt(gasUsed);
    const base = typeof baseFee === 'string' ? BigInt(baseFee) : baseFee;
    const priority = typeof priorityFee === 'string' ? BigInt(priorityFee) : priorityFee;

    const maxFeePerGas = base + priority;
    return (gas * maxFeePerGas).toString();
  }

  /**
   * Format transaction value
   */
  static formatValue(value: Balance, decimals: number = 18): string {
    const valueWei = typeof value === 'string' ? BigInt(value) : value;
    const etherValue = Number(valueWei) / 10 ** decimals;
    return etherValue.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }

  /**
   * Validate transaction request
   */
  static validateTransaction(tx: EvmTransactionRequest): string[] {
    const errors: string[] = [];

    if (!tx.from) {
      errors.push('Transaction must have a "from" address');
    }

    if (!tx.to && !tx.data) {
      errors.push('Transaction must have either a "to" address or "data"');
    }

    if (tx.gas && (typeof tx.gas === 'string' ? parseInt(tx.gas, 10) : tx.gas) <= 0) {
      errors.push('Gas limit must be greater than 0');
    }

    if (tx.value && BigInt(tx.value) < 0) {
      errors.push('Transaction value cannot be negative');
    }

    if (tx.nonce && (typeof tx.nonce === 'string' ? parseInt(tx.nonce, 10) : tx.nonce) < 0) {
      errors.push('Transaction nonce cannot be negative');
    }

    return errors;
  }

  /**
   * Create transaction hash from transaction data
   */
  static createTransactionHash(tx: EvmTransaction): TransactionHash {
    // This would implement RLP encoding and Keccak256 hashing
    throw new Error('Transaction hash creation requires RLP encoding library');
  }
}

export default TransactionManager;
