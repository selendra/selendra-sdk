"use strict";
/**
 * Main SelendraSDK class that provides unified access to both Substrate and EVM functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sdk = exports.Network = exports.SelendraSDK = void 0;
exports.createSDK = createSDK;
const keyring_1 = require("@polkadot/keyring");
const ethers_1 = require("ethers");
const network_1 = require("../types/network");
const connection_1 = require("./connection");
const substrate_1 = require("./substrate");
const evm_1 = require("./evm");
const unified_1 = require("./unified");
/**
 * Main SelendraSDK class
 *
 * Provides unified access to both Substrate and EVM chains in the Selendra ecosystem.
 * Built on top of @polkadot/api and ethers.js for maximum compatibility.
 *
 * @example
 * ```typescript
 * const sdk = new SelendraSDK()
 *   .withEndpoint('wss://rpc.selendra.org')
 *   .withNetwork(Network.Selendra);
 *
 * const chainInfo = await sdk.chainInfo();
 * const balance = await sdk.getBalance('0x...');
 * ```
 */
class SelendraSDK {
    constructor(config = {}) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "connectionManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "substrateClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "evmClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unifiedClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_isConnected", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.config = {
            ss58Format: 42, // Default Selendra format
            timeout: 30000,
            autoConnect: false,
            ...config
        };
        this.connectionManager = new connection_1.ConnectionManager(this.config);
    }
    /**
     * Configure the RPC endpoint
     */
    withEndpoint(endpoint) {
        this.config.endpoint = endpoint;
        return this;
    }
    /**
     * Configure the network
     */
    withNetwork(network) {
        this.config.network = network;
        return this;
    }
    /**
     * Configure additional options
     */
    withOptions(options) {
        this.config = { ...this.config, ...options };
        return this;
    }
    /**
     * Connect to the network
     */
    async connect() {
        if (this._isConnected) {
            return;
        }
        await this.connectionManager.connect();
        // Initialize clients after connection
        const api = await this.connectionManager.getSubstrateApi();
        const provider = await this.connectionManager.getEvmProvider();
        this.substrateClient = new substrate_1.SubstrateClient(api, this.config);
        this.evmClient = new evm_1.EvmClient(provider, this.config);
        this.unifiedClient = new unified_1.UnifiedClient(this.substrateClient, this.evmClient);
        this._isConnected = true;
    }
    /**
     * Disconnect from the network
     */
    async disconnect() {
        await this.connectionManager.disconnect();
        this._isConnected = false;
    }
    /**
     * Check if connected to the network
     */
    isConnected() {
        return this._isConnected;
    }
    /**
     * Get the current network configuration
     */
    getNetwork() {
        if (typeof this.config.network === 'string') {
            return (0, network_1.getNetworkConfig)(this.config.network);
        }
        return this.config.network;
    }
    /**
     * Get chain information
     */
    async chainInfo() {
        this.ensureConnected();
        return await this.unifiedClient.chainInfo();
    }
    /**
     * Get the Substrate client
     */
    get substrate() {
        this.ensureConnected();
        return this.substrateClient;
    }
    /**
     * Get the EVM client
     */
    get evm() {
        this.ensureConnected();
        return this.evmClient;
    }
    /**
     * Get the unified client for cross-chain operations
     */
    get unified() {
        this.ensureConnected();
        return this.unifiedClient;
    }
    /**
     * Create a new account/keyring pair
     */
    createAccount(mnemonic) {
        const keyring = new keyring_1.Keyring({ type: 'sr25519', ss58Format: this.config.ss58Format });
        let pair;
        if (mnemonic) {
            pair = keyring.addFromMnemonic(mnemonic);
        }
        else {
            pair = keyring.addFromUri('//'); // Creates a new account
        }
        return {
            address: pair.address,
            privateKey: pair.address, // Substrate doesn't expose private keys directly
            mnemonic: pair.meta.mnemonic || mnemonic || ''
        };
    }
    /**
     * Create an EVM account
     */
    createEvmAccount() {
        const wallet = ethers_1.ethers.Wallet.createRandom();
        return {
            address: wallet.address,
            privateKey: wallet.privateKey
        };
    }
    /**
     * Get balance for any address type
     */
    async getBalance(address) {
        this.ensureConnected();
        return await this.unifiedClient.getBalance(address);
    }
    /**
     * Transfer tokens between addresses
     */
    async transfer(from, to, amount, options) {
        this.ensureConnected();
        return await this.unifiedClient.transfer(from, to, amount, options);
    }
    /**
     * Get transaction status
     */
    async getTransactionStatus(txHash) {
        this.ensureConnected();
        return await this.unifiedClient.getTransactionStatus(txHash);
    }
    /**
     * Wait for transaction confirmation
     */
    async waitForTransaction(txHash, confirmations) {
        this.ensureConnected();
        return await this.unifiedClient.waitForTransaction(txHash, confirmations);
    }
    /**
     * Convert between different address formats
     */
    convertAddress(address, targetFormat) {
        this.ensureConnected();
        return this.unifiedClient.convertAddress(address, targetFormat);
    }
    /**
     * Get the underlying @polkadot/api instance
     */
    async getApi() {
        this.ensureConnected();
        return this.connectionManager.getSubstrateApi();
    }
    /**
     * Get the underlying ethers provider
     */
    async getEvmProvider() {
        this.ensureConnected();
        return this.connectionManager.getEvmProvider();
    }
    /**
     * Estimate gas for a transaction
     */
    async estimateGas(from, to, amount, data) {
        this.ensureConnected();
        return await this.unifiedClient.estimateGas(from, to, amount, data);
    }
    /**
     * Get current block number
     */
    async getBlockNumber() {
        this.ensureConnected();
        return await this.unifiedClient.getBlockNumber();
    }
    /**
     * Get block information
     */
    async getBlock(blockNumber) {
        this.ensureConnected();
        return await this.unifiedClient.getBlock(blockNumber);
    }
    ensureConnected() {
        if (!this._isConnected) {
            throw new Error('SDK not connected. Call connect() first.');
        }
    }
}
exports.SelendraSDK = SelendraSDK;
/**
 * Network enum for convenience
 */
var Network;
(function (Network) {
    Network["Selendra"] = "selendra_mainnet";
    Network["SelendraTestnet"] = "selendra_testnet";
    Network["Localhost"] = "localhost";
})(Network || (exports.Network = Network = {}));
/**
 * Create a new SDK instance with default configuration
 */
function createSDK(config) {
    return new SelendraSDK(config);
}
/**
 * Default SDK instance for convenience
 */
exports.sdk = new SelendraSDK();
//# sourceMappingURL=index.js.map