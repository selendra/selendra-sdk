"use strict";
/**
 * Selendra SDK - Main Class
 *
 * Comprehensive SDK for interacting with the Selendra blockchain.
 * Supports both Substrate and EVM chains with unified interface.
 *
 * @author Selendra Team <team@selendra.org>
 * @license Apache-2.0
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sdk = exports.SelendraSDK = void 0;
exports.createSDK = createSDK;
const api_1 = require("@polkadot/api");
const keyring_1 = require("@polkadot/keyring");
const eventemitter3_1 = require("eventemitter3");
const types_1 = require("./types");
const evm_1 = require("./evm");
/**
 * Main Selendra SDK class
 */
class SelendraSDK extends eventemitter3_1.EventEmitter {
    constructor(config = {}) {
        super();
        Object.defineProperty(this, "api", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "evmClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isConnecting", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "isConnected", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.config = {
            endpoint: 'wss://rpc.selendra.org',
            network: types_1.Network.Selendra,
            chainType: types_1.ChainType.Substrate,
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            ...config,
        };
    }
    /**
     * Connect to the blockchain
     */
    async connect() {
        if (this.isConnecting || this.isConnected) {
            return;
        }
        this.isConnecting = true;
        this.emit('connecting');
        try {
            if (this.config.chainType === types_1.ChainType.EVM) {
                await this.connectEVM();
            }
            else {
                await this.connectSubstrate();
            }
            this.isConnected = true;
            this.emit('connected');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
        finally {
            this.isConnecting = false;
        }
    }
    /**
     * Disconnect from the blockchain
     */
    async disconnect() {
        try {
            if (this.api) {
                await this.api.disconnect();
                this.api = null;
            }
            if (this.evmClient) {
                await this.evmClient.disconnect();
                this.evmClient = null;
            }
            this.isConnected = false;
            this.emit('disconnected');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Destroy SDK instance and cleanup resources
     * Alias for disconnect()
     */
    async destroy() {
        await this.disconnect();
        this.removeAllListeners();
    }
    /**
     * Get connection information
     */
    getConnectionInfo() {
        return {
            endpoint: this.config.endpoint,
            network: this.config.network,
            chainType: this.config.chainType,
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
        };
    }
    /**
     * Get account information
     */
    async getAccount(address) {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            if (!address) {
                throw new Error('Address is required for EVM account info');
            }
            return await this.evmClient.getAccount(address);
        }
        // Substrate account info
        if (this.api && address) {
            const account = await this.api.query.system.account(address);
            const { nonce, data } = account;
            return {
                address,
                nonce: nonce.toNumber(),
                balance: data.free.toString(),
                type: 'substrate',
                isActive: !data.free.isZero(),
                metadata: {
                    data: {
                        free: data.free.toString(),
                        reserved: data.reserved.toString(),
                    },
                },
            };
        }
        throw new Error('API not connected or address not provided');
    }
    /**
     * Get balance for an address
     */
    async getBalance(address, options = {}) {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            return await this.evmClient.getBalanceInfo(address, options);
        }
        // Substrate balance
        if (this.api) {
            const account = await this.api.query.system.account(address);
            const { data } = account;
            return {
                total: data.free.add(data.reserved).toString(),
                free: data.free.toString(),
                reserved: data.reserved.toString(),
                symbol: 'SEL',
                decimals: 18,
            };
        }
        throw new Error('API not connected');
    }
    /**
     * Submit a transaction
     */
    async submitTransaction(transaction, options = {}) {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            return await this.evmClient.submitTransaction(transaction, options);
        }
        // Substrate transaction (basic transfer)
        if (this.api && transaction.signer && transaction.to && transaction.amount) {
            const keyring = new keyring_1.Keyring({ type: 'sr25519' });
            const sender = keyring.addFromUri(transaction.signer);
            return new Promise((resolve, reject) => {
                this.api.tx.balances
                    .transferKeepAlive(transaction.to, transaction.amount)
                    .signAndSend(sender, ({ status, txHash, events }) => {
                    if (status.isFinalized) {
                        resolve({
                            hash: txHash.toString(),
                            blockHash: status.asFinalized.toString(),
                            from: sender.address,
                            to: transaction.to,
                            value: transaction.amount.toString(),
                            fee: '0',
                            nonce: 0,
                            status: 'finalized',
                            timestamp: Date.now(),
                        });
                    }
                })
                    .catch(reject);
            });
        }
        throw new Error('Invalid transaction or API not connected');
    }
    /**
     * Get transaction history
     */
    async getTransactionHistory(address, limit = 100) {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            const history = await this.evmClient.getTransactionHistory(address, limit);
            // Map to TransactionInfo format
            return history.map((tx) => ({
                ...tx,
                fee: tx.fee || '0', // Ensure fee is always present
            }));
        }
        // Placeholder for Substrate transaction history
        throw new Error('Transaction history not implemented for Substrate chains yet');
    }
    /**
     * Get contract information
     */
    async getContract(address, options = {}) {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            if (!options.abi) {
                throw new Error('ABI is required for contract interaction');
            }
            const contract = this.evmClient.getContract(address, options.abi);
            // Return contract info
            return {
                address,
                name: options.metadata?.name || 'Unknown',
                abi: options.abi,
                bytecode: '', // Would need to fetch with getCode
                creator: '', // Would need historical data
                balance: '0', // Would need to fetch
                metadata: options.metadata,
            };
        }
        // Placeholder for Substrate contracts
        throw new Error('Contract interaction not implemented for Substrate chains yet');
    }
    /**
     * Get contract instance
     */
    async getContractInstance(address, options = {}) {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            return await this.evmClient.getContractInstance(address, options);
        }
        throw new Error('Contract instance not implemented for Substrate chains yet');
    }
    /**
     * Subscribe to balance changes
     */
    subscribeToBalanceChanges(address, callback) {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            return this.evmClient.subscribeToBalanceChanges(address, callback);
        }
        // Return no-op for unsupported chains
        return () => { };
    }
    /**
     * Subscribe to events
     */
    subscribeToEvents(options) {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            return this.evmClient.subscribeToEvents(options);
        }
        // Return no-op for unsupported chains
        return () => { };
    }
    /**
     * Subscribe to blocks
     */
    subscribeToBlocks(options) {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            return this.evmClient.subscribeToBlocks(options);
        }
        // Return no-op for unsupported chains
        return () => { };
    }
    /**
     * Get current block
     */
    async getCurrentBlock() {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            const block = await this.evmClient.getCurrentBlock();
            // Add missing stateRoot field
            return {
                ...block,
                stateRoot: '', // EVM blocks don't have stateRoot in the same way
                author: '', // EVM blocks use miner instead
            };
        }
        // Placeholder for Substrate block info
        throw new Error('Block query not implemented for Substrate chains yet');
    }
    /**
     * Builder pattern for configuring SDK
     */
    withEndpoint(endpoint) {
        this.config.endpoint = endpoint;
        return this;
    }
    withNetwork(network) {
        this.config.network = network;
        return this;
    }
    withChainType(chainType) {
        this.config.chainType = chainType;
        return this;
    }
    withOptions(options) {
        this.config = { ...this.config, ...options };
        return this;
    }
    /**
     * Connect to EVM chain
     */
    async connectEVM() {
        if (!this.config.endpoint) {
            throw new Error('EVM endpoint is required');
        }
        this.evmClient = new evm_1.SelendraEvmClient({
            network: this.config.network || 'mainnet',
            rpcUrls: {
                http: [this.config.endpoint],
            },
        });
        await this.evmClient.connect();
        // Forward events from EVM client
        this.evmClient.on('connected', () => this.emit('connected'));
        this.evmClient.on('disconnected', () => this.emit('disconnected'));
        this.evmClient.on('error', (error) => this.emit('error', error));
    }
    /**
     * Connect to Substrate chain
     */
    async connectSubstrate() {
        if (!this.config.endpoint) {
            throw new Error('Substrate endpoint is required');
        }
        const wsProvider = new api_1.WsProvider(this.config.endpoint);
        this.api = await api_1.ApiPromise.create({ provider: wsProvider });
        // Set up event listeners
        this.api.on('connected', () => this.emit('connected'));
        this.api.on('disconnected', () => this.emit('disconnected'));
        this.api.on('error', (error) => this.emit('error', error));
    }
    /**
     * Ensure SDK is connected
     */
    ensureConnected() {
        if (!this.isConnected) {
            throw new Error('SDK is not connected. Call connect() first.');
        }
    }
}
exports.SelendraSDK = SelendraSDK;
/**
/**
 */
function createSDK(config) {
    return new SelendraSDK(config);
}
/**
 * Default SDK instance
 */
exports.sdk = createSDK();
/**
 * Legacy export for backward compatibility
 */
exports.default = SelendraSDK;
//# sourceMappingURL=sdk.js.map