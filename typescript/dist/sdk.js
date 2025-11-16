"use strict";
/**
 * Selendra SDK - Main Class
 *
 * Comprehensive SDK for interacting with the Selendra blockchain.
 * Supports both Substrate and EVM chains with unified interface.
 *
 * @author Selendra Team <team@selendra.org>
 * @license Apache-2.0
 * @version 0.1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sdk = exports.ChainType = exports.Network = exports.SelendraSDK = void 0;
exports.createSDK = createSDK;
const api_1 = require("@polkadot/api");
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
            ...config
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
     * Get connection information
     */
    getConnectionInfo() {
        return {
            endpoint: this.config.endpoint,
            network: this.config.network,
            chainType: this.config.chainType,
            isConnected: this.isConnected,
            isConnecting: this.isConnecting
        };
    }
    /**
     * Get account information
     */
    async getAccount() {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            return await this.evmClient.getAccount();
        }
        // Placeholder for Substrate account info
        throw new Error('Account information not implemented for Substrate chains yet');
    }
    /**
     * Get balance for an address
     */
    async getBalance(address, options = {}) {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            return await this.evmClient.getBalance(address, options);
        }
        // Placeholder for Substrate balance
        throw new Error('Balance query not implemented for Substrate chains yet');
    }
    /**
     * Submit a transaction
     */
    async submitTransaction(transaction, options = {}) {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            return await this.evmClient.submitTransaction(transaction, options);
        }
        // Placeholder for Substrate transaction
        throw new Error('Transaction submission not implemented for Substrate chains yet');
    }
    /**
     * Get transaction history
     */
    async getTransactionHistory(limit = 100) {
        this.ensureConnected();
        if (this.config.chainType === types_1.ChainType.EVM && this.evmClient) {
            return await this.evmClient.getTransactionHistory(limit);
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
            return await this.evmClient.getContract(address, options);
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
            return await this.evmClient.getCurrentBlock();
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
            endpoint: this.config.endpoint,
            network: this.config.network,
            timeout: this.config.timeout,
            retryAttempts: this.config.retryAttempts,
            retryDelay: this.config.retryDelay
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
 * Network enumeration
 */
var Network;
(function (Network) {
    Network["Selendra"] = "selendra";
    Network["SelendraTestnet"] = "selendra-testnet";
    Network["Ethereum"] = "ethereum";
    Network["Polygon"] = "polygon";
    Network["BSC"] = "bsc";
})(types_1.Network || (types_1.Network = {}));
/**
 * Chain type enumeration
 */
var ChainType;
(function (ChainType) {
    ChainType["Substrate"] = "substrate";
    ChainType["EVM"] = "evm";
})(types_1.ChainType || (types_1.ChainType = {}));
/**
 * Create SDK instance with factory function
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