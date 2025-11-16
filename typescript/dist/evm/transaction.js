"use strict";
/**
 * EVM Transaction Management for the Selendra SDK
 * Provides transaction building, gas estimation, signing, and tracking
 * Compatible with ethers.js v6 transaction API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionUtils = exports.TransactionTracker = exports.TransactionManager = exports.TransactionBuilder = exports.TransactionStatus = void 0;
const events_1 = require("events");
const config_1 = require("./config");
/**
 * Transaction status enumeration
 */
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["CONFIRMED"] = "confirmed";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["REPLACED"] = "replaced";
    TransactionStatus["CANCELLED"] = "cancelled";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
/**
 * Transaction builder class
 */
class TransactionBuilder {
    constructor(from) {
        Object.defineProperty(this, "transaction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.transaction = {
            from,
            type: '0x2', // Default to EIP-1559
            gas: undefined,
            gasPrice: undefined,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined
        };
    }
    /**
     * Set recipient address
     */
    to(address) {
        this.transaction.to = address;
        return this;
    }
    /**
     * Set value to transfer (in ether)
     */
    value(amount) {
        this.transaction.value = (0, config_1.etherToWei)(amount);
        return this;
    }
    /**
     * Set value to transfer (in wei)
     */
    valueWei(amount) {
        this.transaction.value = amount;
        return this;
    }
    /**
     * Set transaction data
     */
    data(data) {
        this.transaction.data = data;
        return this;
    }
    /**
     * Set gas limit
     */
    gasLimit(limit) {
        this.transaction.gas = limit;
        return this;
    }
    /**
     * Set gas price (for legacy transactions)
     */
    gasPrice(price) {
        const priceWei = typeof price === 'number' ? (0, config_1.gweiToWei)(price) : price;
        this.transaction.gasPrice = priceWei;
        this.transaction.type = '0x0'; // Legacy type
        return this;
    }
    /**
     * Set EIP-1559 gas parameters
     */
    eip1559(maxFee, priorityFee) {
        this.transaction.maxFeePerGas = typeof maxFee === 'number' ? (0, config_1.gweiToWei)(maxFee) : maxFee;
        this.transaction.maxPriorityFeePerGas = typeof priorityFee === 'number' ? (0, config_1.gweiToWei)(priorityFee) : priorityFee;
        this.transaction.type = '0x2'; // EIP-1559 type
        return this;
    }
    /**
     * Set transaction nonce
     */
    nonce(nonceValue) {
        this.transaction.nonce = nonceValue;
        return this;
    }
    /**
     * Set chain ID
     */
    chainId(chainIdValue) {
        this.transaction.chainId = chainIdValue;
        return this;
    }
    /**
     * Set access list (EIP-2930)
     */
    accessList(list) {
        this.transaction.accessList = list;
        if (this.transaction.type !== '0x1') {
            this.transaction.type = '0x1'; // EIP-2930 type
        }
        return this;
    }
    /**
     * Build the transaction request
     */
    build() {
        const tx = { ...this.transaction };
        // Validate required fields
        if (!tx.to && !tx.data) {
            throw new Error('Transaction must have either a "to" address or "data" field');
        }
        return tx;
    }
    /**
     * Create a simple transfer transaction
     */
    static transfer(from, to, amount) {
        return new TransactionBuilder(from)
            .to(to)
            .value(amount)
            .gasLimit(config_1.GAS_ESTIMATION_DEFAULTS.SIMPLE_TRANSFER);
    }
    /**
     * Create a contract deployment transaction
     */
    static deploy(from, bytecode) {
        return new TransactionBuilder(from)
            .data(bytecode)
            .gasLimit(config_1.GAS_ESTIMATION_DEFAULTS.CONTRACT_DEPLOYMENT);
    }
    /**
     * Create a contract interaction transaction
     */
    static contractInteraction(from, to, data) {
        return new TransactionBuilder(from)
            .to(to)
            .data(data)
            .gasLimit(config_1.GAS_ESTIMATION_DEFAULTS.CONTRACT_INTERACTION);
    }
}
exports.TransactionBuilder = TransactionBuilder;
/**
 * Transaction manager for tracking and managing transactions
 */
class TransactionManager extends events_1.EventEmitter {
    constructor(provider) {
        super();
        Object.defineProperty(this, "provider", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: provider
        });
        Object.defineProperty(this, "pendingTransactions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "gasPriceCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxFeePerGasCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxPriorityFeePerGasCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    /**
     * Estimate gas for a transaction
     */
    async estimateGas(tx) {
        try {
            // Get gas limit estimate
            const gasLimit = await this.provider.estimateGas(tx);
            // Get current gas prices
            const gasPrice = await this.getGasPrice();
            const maxFeePerGas = await this.getMaxFeePerGas();
            const maxPriorityFeePerGas = await this.getMaxPriorityFeePerGas();
            // Determine best transaction type
            const supportsEIP1559 = await this.supportsEIP1559();
            const recommendedType = supportsEIP1559 ? '0x2' : '0x0';
            // Calculate estimated costs
            let estimatedCost;
            if (supportsEIP1559) {
                estimatedCost = (BigInt(gasLimit) * BigInt(maxFeePerGas)).toString();
            }
            else {
                estimatedCost = (BigInt(gasLimit) * BigInt(gasPrice)).toString();
            }
            return {
                gasLimit: gasLimit.toString(),
                gasPrice: supportsEIP1559 ? undefined : gasPrice,
                maxFeePerGas: supportsEIP1559 ? maxFeePerGas : undefined,
                maxPriorityFeePerGas: supportsEIP1559 ? maxPriorityFeePerGas : undefined,
                estimatedCost,
                recommendedType
            };
        }
        catch (error) {
            throw new Error(`Gas estimation failed: ${error}`);
        }
    }
    /**
     * Build a complete transaction with optimal gas settings
     */
    async buildTransaction(request, options = {}) {
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
        }
        else if (options.gasLimit === 'auto') {
            const gasEstimation = await this.estimateGas(tx);
            tx.gas = gasEstimation.gasLimit;
        }
        // Set gas price based on transaction type
        const supportsEIP1559 = await this.supportsEIP1559();
        if (tx.type === '0x2' || (tx.type === 'auto' && supportsEIP1559)) {
            // EIP-1559 transaction
            tx.type = '0x2';
            if (options.maxFeePerGas === 'auto' || !tx.maxFeePerGas) {
                tx.maxFeePerGas = await this.getMaxFeePerGas();
            }
            if (options.maxPriorityFeePerGas === 'auto' || !tx.maxPriorityFeePerGas) {
                tx.maxPriorityFeePerGas = await this.getMaxPriorityFeePerGas();
            }
            // Clear legacy gas price for EIP-1559
            delete tx.gasPrice;
        }
        else {
            // Legacy transaction
            tx.type = '0x0';
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
            if (tx.type !== '0x1') {
                tx.type = '0x1'; // EIP-2930 type
            }
        }
        return tx;
    }
    /**
     * Send a transaction and start tracking it
     */
    async sendTransaction(request, options = {}) {
        // Build transaction with optimal settings
        const transaction = await this.buildTransaction(request, options);
        // Send transaction
        const txHash = await this.provider.sendTransaction(transaction);
        // Create tracker
        const tracker = new TransactionTracker(txHash, transaction, this.provider, {
            confirmations: options.confirmations || 1,
            timeout: options.timeout || 300000,
            pollingInterval: options.pollingInterval || 2000,
            replaceable: options.replaceable || false
        });
        // Start tracking
        this.pendingTransactions.set(txHash, tracker);
        this.setupTrackerEvents(tracker);
        return tracker;
    }
    /**
     * Get transaction tracker by hash
     */
    getTracker(txHash) {
        return this.pendingTransactions.get(txHash);
    }
    /**
     * Get all pending transactions
     */
    getPendingTransactions() {
        return Array.from(this.pendingTransactions.values());
    }
    /**
     * Cancel a transaction
     */
    async cancelTransaction(txHash, fromAddress) {
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
        const cancelTx = {
            from: fromAddress,
            to: fromAddress, // Self-transfer
            value: '0x0',
            nonce: tracker.getNonce(),
            gasPrice: (BigInt(gasPrice) * BigInt(110) / BigInt(100)).toString(), // 10% higher
            gas: config_1.GAS_ESTIMATION_DEFAULTS.SIMPLE_TRANSFER.toString()
        };
        return this.provider.sendTransaction(cancelTx);
    }
    /**
     * Speed up a transaction (replace with higher gas price)
     */
    async speedUpTransaction(txHash) {
        const tracker = this.pendingTransactions.get(txHash);
        if (!tracker) {
            throw new Error('Transaction not found');
        }
        if (!tracker.isReplaceable()) {
            throw new Error('Transaction is not replaceable');
        }
        const originalTx = tracker.getTransaction();
        const gasIncrease = BigInt(110) / BigInt(100); // 10% increase
        const speedUpTx = {
            ...originalTx,
            gasPrice: originalTx.gasPrice ? (BigInt(originalTx.gasPrice) * gasIncrease).toString() : undefined,
            maxFeePerGas: originalTx.maxFeePerGas ? (BigInt(originalTx.maxFeePerGas) * gasIncrease).toString() : undefined,
            maxPriorityFeePerGas: originalTx.maxPriorityFeePerGas ?
                (BigInt(originalTx.maxPriorityFeePerGas) * gasIncrease).toString() : undefined
        };
        return this.provider.sendTransaction(speedUpTx);
    }
    /**
     * Get current gas price (cached for 30 seconds)
     */
    async getGasPrice() {
        const now = Date.now();
        if (this.gasPriceCache && now - this.gasPriceCache.timestamp < 30000) {
            return this.gasPriceCache.price;
        }
        const gasPrice = await this.provider.getGasPrice();
        this.gasPriceCache = {
            price: gasPrice.toString(),
            timestamp: now
        };
        return this.gasPriceCache.price;
    }
    /**
     * Get max fee per gas (EIP-1559)
     */
    async getMaxFeePerGas() {
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
            timestamp: now
        };
        return maxFee;
    }
    /**
     * Get max priority fee per gas (EIP-1559)
     */
    async getMaxPriorityFeePerGas() {
        const now = Date.now();
        if (this.maxPriorityFeePerGasCache && now - this.maxPriorityFeePerGasCache.timestamp < 30000) {
            return this.maxPriorityFeePerGasCache.fee;
        }
        const priorityFee = await this.provider.send('eth_maxPriorityFeePerGas', []);
        this.maxPriorityFeePerGasCache = {
            fee: priorityFee,
            timestamp: now
        };
        return priorityFee;
    }
    /**
     * Check if network supports EIP-1559
     */
    async supportsEIP1559() {
        try {
            const block = await this.provider.getBlock('latest');
            return block.baseFeePerGas !== undefined;
        }
        catch {
            return false;
        }
    }
    /**
     * Setup event listeners for transaction tracker
     */
    setupTrackerEvents(tracker) {
        tracker.on('statusChanged', (status, receipt) => {
            this.emit('transactionStatusChanged', tracker.getHash(), status, receipt);
            if (tracker.isFinalized()) {
                this.pendingTransactions.delete(tracker.getHash());
                this.emit('transactionFinalized', tracker.getHash(), status, receipt);
            }
        });
        tracker.on('error', (error) => {
            this.emit('transactionError', tracker.getHash(), error);
            this.pendingTransactions.delete(tracker.getHash());
        });
        // Start tracking
        tracker.startTracking();
    }
    /**
     * Clean up resources
     */
    destroy() {
        // Stop tracking all pending transactions
        for (const tracker of this.pendingTransactions.values()) {
            tracker.stopTracking();
        }
        this.pendingTransactions.clear();
        // Remove all event listeners
        this.removeAllListeners();
    }
}
exports.TransactionManager = TransactionManager;
/**
 * Transaction tracker for monitoring individual transactions
 */
class TransactionTracker extends events_1.EventEmitter {
    constructor(hash, transaction, provider, options) {
        super();
        Object.defineProperty(this, "hash", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: hash
        });
        Object.defineProperty(this, "transaction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: transaction
        });
        Object.defineProperty(this, "provider", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: provider
        });
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: options
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: TransactionStatus.PENDING
        });
        Object.defineProperty(this, "receipt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isTracking", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "trackingTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "timeoutTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    /**
     * Get transaction hash
     */
    getHash() {
        return this.hash;
    }
    /**
     * Get original transaction
     */
    getTransaction() {
        return { ...this.transaction };
    }
    /**
     * Get transaction nonce
     */
    getNonce() {
        return Number(this.transaction.nonce || 0);
    }
    /**
     * Get current status
     */
    getStatus() {
        return this.status;
    }
    /**
     * Get transaction receipt (if available)
     */
    getReceipt() {
        return this.receipt;
    }
    /**
     * Check if transaction is finalized
     */
    isFinalized() {
        return this.status === TransactionStatus.CONFIRMED ||
            this.status === TransactionStatus.FAILED ||
            this.status === TransactionStatus.CANCELLED;
    }
    /**
     * Check if transaction is replaceable
     */
    isReplaceable() {
        return this.options.replaceable && this.status === TransactionStatus.PENDING;
    }
    /**
     * Start tracking the transaction
     */
    startTracking() {
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
    stopTracking() {
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
    async waitForConfirmation() {
        return new Promise((resolve, reject) => {
            if (this.receipt && this.status === TransactionStatus.CONFIRMED) {
                resolve(this.receipt);
                return;
            }
            if (this.isFinalized() && this.status !== TransactionStatus.CONFIRMED) {
                reject(new Error(`Transaction ${this.status}: ${this.hash}`));
                return;
            }
            const handleStatusChange = (status, receipt) => {
                if (status === TransactionStatus.CONFIRMED && receipt) {
                    resolve(receipt);
                }
                else if (this.isFinalized() && status !== TransactionStatus.CONFIRMED) {
                    reject(new Error(`Transaction ${status}: ${this.hash}`));
                }
            };
            this.once('statusChanged', handleStatusChange);
        });
    }
    /**
     * Start polling for transaction updates
     */
    startPolling() {
        this.trackingTimer = setInterval(async () => {
            try {
                await this.updateStatus();
            }
            catch (error) {
                this.emit('error', error);
                this.stopTracking();
            }
        }, this.options.pollingInterval);
    }
    /**
     * Start timeout timer
     */
    startTimeout() {
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
    async updateStatus() {
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
                    }
                    else {
                        this.status = TransactionStatus.PENDING;
                        this.emit('statusChanged', this.status, receipt);
                    }
                }
                else {
                    this.status = TransactionStatus.FAILED;
                    this.emit('statusChanged', this.status, receipt);
                    this.stopTracking();
                }
            }
            // Transaction is still pending
        }
        catch (error) {
            // Transaction might not be indexed yet, continue polling
            if (this.status !== TransactionStatus.PENDING) {
                this.status = TransactionStatus.PENDING;
                this.emit('statusChanged', this.status);
            }
        }
    }
}
exports.TransactionTracker = TransactionTracker;
/**
 * Transaction utilities
 */
class TransactionUtils {
    /**
     * Calculate transaction fee
     */
    static calculateFee(gasUsed, gasPrice) {
        const gas = typeof gasUsed === 'string' ? BigInt(gasUsed) : BigInt(gasUsed);
        const price = typeof gasPrice === 'string' ? BigInt(gasPrice) : gasPrice;
        return (gas * price).toString();
    }
    /**
     * Calculate EIP-1559 transaction fee
     */
    static calculateEIP1559Fee(gasUsed, baseFee, priorityFee) {
        const gas = typeof gasUsed === 'string' ? BigInt(gasUsed) : BigInt(gasUsed);
        const base = typeof baseFee === 'string' ? BigInt(baseFee) : baseFee;
        const priority = typeof priorityFee === 'string' ? BigInt(priorityFee) : priorityFee;
        const maxFeePerGas = base + priority;
        return (gas * maxFeePerGas).toString();
    }
    /**
     * Format transaction value
     */
    static formatValue(value, decimals = 18) {
        const valueWei = typeof value === 'string' ? BigInt(value) : value;
        const etherValue = Number(valueWei) / (10 ** decimals);
        return etherValue.toLocaleString(undefined, { maximumFractionDigits: 6 });
    }
    /**
     * Validate transaction request
     */
    static validateTransaction(tx) {
        const errors = [];
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
    static createTransactionHash(tx) {
        // This would implement RLP encoding and Keccak256 hashing
        throw new Error('Transaction hash creation requires RLP encoding library');
    }
}
exports.TransactionUtils = TransactionUtils;
exports.default = TransactionManager;
//# sourceMappingURL=transaction.js.map