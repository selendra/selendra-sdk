"use strict";
/**
 * EVM Client for the Selendra SDK
 * Provides ethers.js v6 compatible API for interacting with Selendra's EVM
 * Supports full Ethereum JSON-RPC interface, WebSocket connections, and contract interactions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpProvider = exports.WebSocketProvider = exports.SelendraEvmClient = void 0;
exports.createEvmClient = createEvmClient;
exports.createWebSocketProvider = createWebSocketProvider;
exports.createHttpProvider = createHttpProvider;
const events_1 = require("events");
const transaction_1 = require("./transaction");
const contract_1 = require("./contract");
const config_1 = require("./config");
/**
 * EVM client implementation with ethers.js v6 compatibility
 */
class SelendraEvmClient extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "transactionManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "network", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "blockNumber", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isReady", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "subscriptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.config = (0, config_1.createDefaultEvmClientConfig)(config);
        this.transactionManager = new transaction_1.TransactionManager(this);
        this.setupEventListeners();
    }
    /**
     * Get network information
     */
    async getNetwork() {
        if (!this.network) {
            const [chainId, chainIdStr] = await Promise.all([
                this.send('eth_chainId', []),
                this.send('net_version', [])
            ]);
            const networkConfig = (0, config_1.getSelendraEvmConfig)(this.config.network);
            this.network = {
                name: networkConfig.chainName,
                chainId: typeof chainId === 'string' ? parseInt(chainId, 16) : chainId
            };
        }
        return this.network;
    }
    /**
     * Get block number
     */
    async getBlockNumber() {
        this.blockNumber = await this.send('eth_blockNumber', []);
        return this.blockNumber;
    }
    /**
     * Get block by number or hash
     */
    async getBlock(blockHashOrNumber, includeTransactions) {
        const block = await this.send('eth_getBlockByNumberOrHash', [
            blockHashOrNumber,
            includeTransactions || false
        ]);
        if (!block) {
            return null;
        }
        return this.formatBlock(block);
    }
    /**
     * Get transaction by hash
     */
    async getTransaction(hash) {
        const tx = await this.send('eth_getTransactionByHash', [hash]);
        return tx ? this.formatTransaction(tx) : null;
    }
    /**
     * Get transaction receipt
     */
    async getTransactionReceipt(hash) {
        const receipt = await this.send('eth_getTransactionReceipt', [hash]);
        return receipt ? this.formatTransactionReceipt(receipt) : null;
    }
    /**
     * Send transaction
     */
    async sendTransaction(signedTransaction) {
        const hash = await this.send('eth_sendRawTransaction', [signedTransaction]);
        return {
            hash,
            wait: async () => {
                let receipt = null;
                let attempts = 0;
                const maxAttempts = 50;
                while (!receipt && attempts < maxAttempts) {
                    receipt = await this.getTransactionReceipt(hash);
                    if (!receipt) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        attempts++;
                    }
                }
                if (!receipt) {
                    throw new Error('Transaction receipt not found after timeout');
                }
                return receipt;
            }
        };
    }
    /**
     * Call contract method (read-only)
     */
    async call(transaction, blockTag = 'latest') {
        return this.send('eth_call', [transaction, blockTag]);
    }
    /**
     * Estimate gas for transaction
     */
    async estimateGas(transaction) {
        const gas = await this.send('eth_estimateGas', [transaction]);
        return Number(gas);
    }
    /**
     * Get gas price
     */
    async getGasPrice() {
        return this.send('eth_gasPrice', []);
    }
    /**
     * Get max fee per gas (EIP-1559)
     */
    async getMaxFeePerGas() {
        try {
            return await this.send('eth_maxPriorityFeePerGas', []);
        }
        catch {
            // Fallback to gas price if EIP-1559 not supported
            return this.getGasPrice();
        }
    }
    /**
     * Get max priority fee per gas (EIP-1559)
     */
    async getMaxPriorityFeePerGas() {
        try {
            return await this.send('eth_maxPriorityFeePerGas', []);
        }
        catch {
            // Fallback to gas price if EIP-1559 not supported
            const gasPrice = await this.getGasPrice();
            return (BigInt(gasPrice) / BigInt(2)).toString(); // 50% of gas price
        }
    }
    /**
     * Get balance
     */
    async getBalance(address, blockTag = 'latest') {
        return this.send('eth_getBalance', [address, blockTag]);
    }
    /**
     * Get transaction count (nonce)
     */
    async getTransactionCount(address, blockTag = 'latest') {
        const count = await this.send('eth_getTransactionCount', [address, blockTag]);
        return Number(count);
    }
    /**
     * Get code at address
     */
    async getCode(address, blockTag = 'latest') {
        return this.send('eth_getCode', [address, blockTag]);
    }
    /**
     * Get storage slot value
     */
    async getStorageAt(address, position, blockTag = 'latest') {
        return this.send('eth_getStorageAt', [address, position, blockTag]);
    }
    /**
     * Get logs
     */
    async getLogs(filter) {
        return this.send('eth_getLogs', [filter]);
    }
    /**
     * Subscribe to events (WebSocket only)
     */
    async subscribe(type, params) {
        if (!this.config.enableSubscriptions) {
            throw new Error('Subscriptions are not enabled');
        }
        const subscriptionId = await this.send('eth_subscribe', [type, params]);
        this.subscriptions.set(subscriptionId, { type, params });
        return subscriptionId;
    }
    /**
     * Unsubscribe from events
     */
    async unsubscribe(subscriptionId) {
        const success = await this.send('eth_unsubscribe', [subscriptionId]);
        this.subscriptions.delete(subscriptionId);
        return success;
    }
    /**
     * Create contract instance
     */
    getContract(address, abi) {
        return new contract_1.Contract(address, abi, this);
    }
    /**
     * Create ERC20 contract instance
     */
    getERC20Contract(address) {
        return new contract_1.ERC20Contract(address, this);
    }
    /**
     * Create ERC721 contract instance
     */
    getERC721Contract(address) {
        return new contract_1.ERC721Contract(address, this);
    }
    /**
     * Create contract factory
     */
    getContractFactory(abi, bytecode) {
        return contract_1.ContractFactory.fromContractABI(abi, bytecode, null);
    }
    /**
     * Send JSON-RPC request
     */
    async send(method, params = []) {
        const networkConfig = (0, config_1.getSelendraEvmConfig)(this.config.network);
        const endpoint = networkConfig.rpcUrls.default.http[0]; // Use first HTTP endpoint
        const request = {
            jsonrpc: '2.0',
            id: Date.now(),
            method,
            params
        };
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers
            },
            body: JSON.stringify(request),
            signal: AbortSignal.timeout(this.config.timeout || 30000)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(`RPC Error: ${data.error.message} (${data.error.code})`);
        }
        return data.result;
    }
    /**
     * Batch send multiple requests
     */
    async sendBatch(requests) {
        const networkConfig = (0, config_1.getSelendraEvmConfig)(this.config.network);
        const endpoint = networkConfig.rpcUrls.default.http[0];
        const batchRequest = requests.map((req, index) => ({
            jsonrpc: '2.0',
            id: index + 1,
            method: req.method,
            params: req.params || []
        }));
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers
            },
            body: JSON.stringify(batchRequest),
            signal: AbortSignal.timeout(this.config.timeout || 30000)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
            return data.map(item => {
                if (item.error) {
                    throw new Error(`RPC Error: ${item.error.message} (${item.error.code})`);
                }
                return item.result;
            });
        }
        throw new Error('Invalid batch response format');
    }
    /**
     * Send raw transaction and wait for confirmation
     */
    async sendAndWaitTransaction(signedTransaction, confirmations = 1) {
        const { hash, wait } = await this.sendTransaction(signedTransaction);
        const receipt = await wait();
        if (confirmations > 1) {
            let currentBlock = await this.getBlockNumber();
            const receiptBlock = Number(receipt.blockNumber);
            while (currentBlock - receiptBlock < confirmations) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                currentBlock = await this.getBlockNumber();
            }
        }
        return receipt;
    }
    /**
     * Wait for transaction
     */
    async waitForTransaction(hash, confirmations = 1, timeout = 300000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const receipt = await this.getTransactionReceipt(hash);
            if (receipt) {
                if (confirmations === 1) {
                    return receipt;
                }
                const currentBlock = await this.getBlockNumber();
                const receiptBlock = Number(receipt.blockNumber);
                if (currentBlock - receiptBlock >= confirmations) {
                    return receipt;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        return null;
    }
    /**
     * Check if address is a contract
     */
    async isContract(address) {
        const code = await this.getCode(address);
        return code !== '0x' && code.length > 2;
    }
    /**
     * Get network status
     */
    async getNetworkStatus() {
        const [network, blockNumber, blockHash, genesisHash, syncing] = await Promise.all([
            this.getNetwork(),
            this.getBlockNumber(),
            this.getBlock('latest'),
            this.send('eth_getBlockByNumber', ['0x0', false]),
            this.send('eth_syncing', [])
        ]);
        return {
            isConnected: true,
            networkName: network.name,
            chainId: network.chainId,
            blockNumber,
            blockHash: blockHash?.hash || '0x',
            genesisHash: genesisHash?.hash || '0x',
            isSyncing: typeof syncing === 'object' ? syncing : false,
            timestamp: Date.now()
        };
    }
    /**
     * Get transaction manager
     */
    getTransactionManager() {
        return this.transactionManager;
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Check if client is ready
     */
    isReady() {
        return this.isReady;
    }
    /**
     * Reset connection state
     */
    reset() {
        this.network = undefined;
        this.blockNumber = undefined;
        this.isReady = false;
        this.emit('reset');
    }
    /**
     * Destroy client and cleanup resources
     */
    destroy() {
        this.transactionManager.destroy();
        // Unsubscribe from all active subscriptions
        for (const [subscriptionId] of this.subscriptions) {
            this.unsubscribe(subscriptionId).catch(() => {
                // Ignore errors during cleanup
            });
        }
        this.subscriptions.clear();
        this.removeAllListeners();
        this.reset();
    }
    /**
     * Format block data
     */
    formatBlock(block) {
        return {
            hash: block.hash,
            parentHash: block.parentHash,
            number: parseInt(block.number, 16),
            timestamp: parseInt(block.timestamp, 16),
            gasLimit: block.gasLimit,
            gasUsed: block.gasUsed,
            baseFeePerGas: block.baseFeePerGas,
            miner: block.miner,
            extraData: block.extraData,
            logsBloom: block.logsBloom,
            mixHash: block.mixHash,
            nonce: block.nonce,
            difficulty: block.difficulty,
            totalDifficulty: block.totalDifficulty,
            size: parseInt(block.size, 16),
            stateRoot: block.stateRoot,
            transactionsRoot: block.transactionsRoot,
            receiptsRoot: block.receiptsRoot,
            sha3Uncles: block.sha3Uncles,
            transactions: block.transactions,
            uncles: block.uncles,
            withdrawals: block.withdrawals
        };
    }
    /**
     * Format transaction data
     */
    formatTransaction(tx) {
        return {
            hash: tx.hash,
            nonce: parseInt(tx.nonce, 16),
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber ? parseInt(tx.blockNumber, 16) : undefined,
            transactionIndex: tx.transactionIndex ? parseInt(tx.transactionIndex, 16) : undefined,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            gas: tx.gas,
            gasPrice: tx.gasPrice,
            maxFeePerGas: tx.maxFeePerGas,
            maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
            input: tx.input,
            type: tx.type,
            chainId: tx.chainId ? parseInt(tx.chainId, 16) : undefined,
            v: tx.v ? parseInt(tx.v, 16) : undefined,
            r: tx.r,
            s: tx.s
        };
    }
    /**
     * Format transaction receipt
     */
    formatTransactionReceipt(receipt) {
        return {
            transactionHash: receipt.transactionHash,
            transactionIndex: parseInt(receipt.transactionIndex, 16),
            blockHash: receipt.blockHash,
            blockNumber: parseInt(receipt.blockNumber, 16),
            from: receipt.from,
            to: receipt.to,
            gasUsed: receipt.gasUsed,
            cumulativeGasUsed: receipt.cumulativeGasUsed,
            effectiveGasPrice: receipt.effectiveGasPrice,
            contractAddress: receipt.contractAddress,
            logs: receipt.logs.map((log) => ({
                address: log.address,
                topics: log.topics,
                data: log.data,
                blockHash: log.blockHash,
                blockNumber: log.blockNumber ? parseInt(log.blockNumber, 16) : undefined,
                transactionHash: log.transactionHash,
                transactionIndex: log.transactionIndex ? parseInt(log.transactionIndex, 16) : undefined,
                logIndex: parseInt(log.logIndex, 16),
                removed: log.removed
            })),
            logsBloom: receipt.logsBloom,
            type: receipt.type,
            status: receipt.status ? parseInt(receipt.status, 16) : undefined
        };
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.transactionManager.on('transactionStatusChanged', (hash, status, receipt) => {
            this.emit('transactionStatusChanged', hash, status, receipt);
        });
        this.transactionManager.on('transactionFinalized', (hash, status, receipt) => {
            this.emit('transactionFinalized', hash, status, receipt);
        });
        this.transactionManager.on('transactionError', (hash, error) => {
            this.emit('transactionError', hash, error);
        });
        // Mark as ready
        setTimeout(() => {
            this.isReady = true;
            this.emit('ready');
        }, 0);
    }
}
exports.SelendraEvmClient = SelendraEvmClient;
/**
 * WebSocket provider for real-time updates
 */
class WebSocketProvider extends SelendraEvmClient {
    constructor(config = {}) {
        const networkConfig = (0, config_1.getSelendraEvmConfig)(config.network || 'mainnet');
        const wsUrl = config.wsUrl || networkConfig.rpcUrls.default.webSocket[0];
        super({
            ...config,
            type: 'websocket',
            enableSubscriptions: true
        });
        Object.defineProperty(this, "ws", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "reconnectAttempts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "maxReconnectAttempts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 5
        });
        Object.defineProperty(this, "reconnectDelay", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
        this.connect(wsUrl);
    }
    /**
     * Connect to WebSocket endpoint
     */
    connect(url) {
        try {
            this.ws = new WebSocket(url);
            this.ws.onopen = () => {
                this.reconnectAttempts = 0;
                this.emit('connected');
            };
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                }
                catch (error) {
                    this.emit('error', new Error(`Invalid WebSocket message: ${error}`));
                }
            };
            this.ws.onclose = () => {
                this.emit('disconnected');
                this.attemptReconnect();
            };
            this.ws.onerror = (error) => {
                this.emit('error', error);
            };
        }
        catch (error) {
            this.emit('error', error);
            this.attemptReconnect();
        }
    }
    /**
     * Handle WebSocket message
     */
    handleWebSocketMessage(data) {
        if (data.method === 'eth_subscription') {
            const { params } = data;
            const { subscription, result } = params;
            this.emit('subscription', subscription, result);
            this.emit(`subscription:${subscription}`, result);
        }
        else if (data.id) {
            // Response to a request
            this.emit('response', data);
        }
    }
    /**
     * Attempt to reconnect
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.emit('error', new Error('Max reconnection attempts reached'));
            return;
        }
        setTimeout(() => {
            this.reconnectAttempts++;
            const networkConfig = (0, config_1.getSelendraEvmConfig)(this.config.network);
            const wsUrl = networkConfig.rpcUrls.default.webSocket[0];
            this.connect(wsUrl);
        }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    }
    /**
     * Send WebSocket message
     */
    send(method, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket is not connected'));
                return;
            }
            const request = {
                jsonrpc: '2.0',
                id: Date.now(),
                method,
                params
            };
            const onResponse = (data) => {
                if (data.id === request.id) {
                    this.off('response', onResponse);
                    if (data.error) {
                        reject(new Error(`RPC Error: ${data.error.message} (${data.error.code})`));
                    }
                    else {
                        resolve(data.result);
                    }
                }
            };
            this.on('response', onResponse);
            this.ws.send(JSON.stringify(request));
        });
    }
    /**
     * Disconnect WebSocket
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = undefined;
        }
    }
    /**
     * Destroy WebSocket provider
     */
    destroy() {
        this.disconnect();
        super.destroy();
    }
}
exports.WebSocketProvider = WebSocketProvider;
/**
 * HTTP provider for basic JSON-RPC calls
 */
class HttpProvider extends SelendraEvmClient {
    constructor(config = {}) {
        super({
            ...config,
            type: 'http',
            enableSubscriptions: false
        });
    }
}
exports.HttpProvider = HttpProvider;
/**
 * Factory function to create EVM client
 */
function createEvmClient(config) {
    return new SelendraEvmClient(config);
}
/**
 * Factory function to create WebSocket provider
 */
function createWebSocketProvider(config) {
    return new WebSocketProvider(config);
}
/**
 * Factory function to create HTTP provider
 */
function createHttpProvider(config) {
    return new HttpProvider(config);
}
// Export the main class as default
exports.default = SelendraEvmClient;
//# sourceMappingURL=client.js.map