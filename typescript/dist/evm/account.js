"use strict";
/**
 * EVM Account Management for the Selendra SDK
 * Provides wallet integration, address management, and signature operations
 * Compatible with ethers.js v6 Wallet API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletUtils = exports.MultiSigWallet = exports.ConnectedWallet = exports.SelendraWallet = void 0;
const crypto_1 = require("crypto");
const config_1 = require("./config");
/**
 * EVM Wallet implementation with ethers.js v6 compatibility
 */
class SelendraWallet {
    /**
     * Create a new wallet instance from a private key
     * @param privateKey - 32-byte private key (with or without 0x prefix)
     */
    constructor(privateKey) {
        Object.defineProperty(this, "privateKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "address", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "publicKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Clean and validate private key
        const cleanKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        if (!(0, config_1.isValidPrivateKey)(cleanKey)) {
            throw new Error('Invalid private key format');
        }
        this.privateKey = cleanKey;
        // Derive public key and address
        this.publicKey = this.derivePublicKey(this.privateKey);
        this.address = this.publicKeyToAddress(this.publicKey);
    }
    /**
     * Create a random wallet
     * @returns New wallet with randomly generated private key
     */
    static createRandom() {
        const privateKey = `0x${(0, crypto_1.randomBytes)(32).toString('hex')}`;
        return new SelendraWallet(privateKey);
    }
    /**
     * Create wallet from mnemonic phrase
     * @param mnemonic - BIP-39 mnemonic phrase
     * @param path - Derivation path (default: standard Ethereum path)
     * @returns Wallet derived from mnemonic
     */
    static fromMnemonic(mnemonic, path = "m/44'/60'/0'/0/0") {
        // Note: This would require an external library like ethers or bip39 for full implementation
        // For now, throw an error indicating the dependency
        throw new Error('Mnemonic support requires additional dependencies. Please install ethers or @scure/bip39 for full BIP-39 support.');
    }
    /**
     * Create wallet from encrypted JSON keystore
     * @param json - Encrypted keystore JSON
     * @param password - Password for decryption
     * @returns Wallet from keystore
     */
    static fromEncryptedJson(json, password) {
        // Note: This would require scrypt or similar encryption library
        throw new Error('Encrypted keystore support requires additional dependencies.');
    }
    /**
     * Get wallet address
     * @returns Ethereum address of the wallet
     */
    getAddress() {
        return this.address;
    }
    /**
     * Get private key (use with caution)
     * @returns Private key as hex string
     */
    getPrivateKey() {
        return this.privateKey;
    }
    /**
     * Get public key
     * @returns Uncompressed public key as hex string
     */
    getPublicKey() {
        return this.publicKey;
    }
    /**
     * Check if address belongs to this wallet
     * @param address - Address to check
     * @returns True if address matches wallet address
     */
    isAddress(address) {
        return this.address.toLowerCase() === address.toLowerCase();
    }
    /**
     * Get wallet balance
     * @param blockTag - Block number or tag to query balance at
     * @returns Balance in wei as string
     */
    async getBalance(blockTag = 'latest') {
        // This would be implemented by the EVM client
        // For now, return a placeholder
        throw new Error('getBalance() requires EVM client instance');
    }
    /**
     * Get transaction count (nonce)
     * @param blockTag - Block number or tag to query nonce at
     * @returns Transaction count as number
     */
    async getTransactionCount(blockTag = 'latest') {
        throw new Error('getTransactionCount() requires EVM client instance');
    }
    /**
     * Sign transaction
     * @param transaction - Transaction to sign
     * @returns Signed transaction as hex string
     */
    async signTransaction(transaction) {
        const txData = this.prepareTransactionForSigning(transaction);
        const hash = this.hashTransaction(txData);
        const signature = this.signHash(hash);
        return this.serializeSignedTransaction(txData, signature);
    }
    /**
     * Sign message
     * @param message - Message to sign
     * @returns Signature as hex string
     */
    async signMessage(message) {
        const messageHash = this.hashMessage(message);
        const signature = this.signHash(messageHash);
        return `0x${signature.r}${signature.s}${signature.v.toString(16).padStart(2, '0')}`;
    }
    /**
     * Sign typed data (EIP-712)
     * @param domain - Typed data domain
     * @param types - Type definitions
     * @param value - Data to sign
     * @returns Signature as hex string
     */
    async signTypedData(domain, types, value) {
        const typedDataHash = this.hashTypedData(domain, types, value);
        const signature = this.signHash(typedDataHash);
        return `0x${signature.r}${signature.s}${signature.v.toString(16).padStart(2, '0')}`;
    }
    /**
     * Encrypt wallet with password
     * @param password - Password for encryption
     * @param progressCallback - Optional progress callback
     * @returns Encrypted keystore JSON
     */
    async encrypt(password, progressCallback) {
        throw new Error('Encryption requires additional dependencies like scrypt.');
    }
    /**
     * Connect wallet to provider (ethers.js compatibility)
     * @param provider - EVM provider/client instance
     * @returns Connected wallet instance
     */
    connect(provider) {
        return new ConnectedWallet(this.privateKey, provider);
    }
    /**
     * Derive public key from private key
     * @param privateKey - Private key as hex string
     * @returns Uncompressed public key as hex string
     */
    derivePublicKey(privateKey) {
        // Note: This would require an ECDSA library like secp256k1 or ethers
        // For now, return a placeholder
        throw new Error('Public key derivation requires ECDSA library dependency');
    }
    /**
     * Convert public key to Ethereum address
     * @param publicKey - Uncompressed public key as hex string
     * @returns Ethereum address as hex string
     */
    publicKeyToAddress(publicKey) {
        // Remove 0x prefix if present
        const cleanKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
        // Take last 20 bytes of Keccak256 hash of public key (without prefix)
        const publicKeyBytes = Buffer.from(cleanKey, 'hex');
        const hash = (0, crypto_1.createHash)('sha3-256').update(publicKeyBytes.slice(1)).digest();
        const address = hash.slice(-20);
        return `0x${address.toString('hex')}`;
    }
    /**
     * Hash transaction for signing
     * @param transaction - Transaction data
     * @returns Transaction hash as hex string
     */
    hashTransaction(transaction) {
        // This would implement RLP encoding and Keccak256 hashing
        throw new Error('Transaction hashing requires RLP encoding library');
    }
    /**
     * Hash message for signing (EIP-191)
     * @param message - Message to hash
     * @returns Message hash as hex string
     */
    hashMessage(message) {
        const messageBytes = typeof message === 'string' ? Buffer.from(message) : message;
        const prefix = Buffer.from(`\x19Ethereum Signed Message:\n${messageBytes.length}`);
        const combined = Buffer.concat([prefix, messageBytes]);
        const hash = (0, crypto_1.createHash)('sha3-256').update(combined).digest();
        return `0x${hash.toString('hex')}`;
    }
    /**
     * Hash typed data for signing (EIP-712)
     * @param domain - Typed data domain
     * @param types - Type definitions
     * @param value - Data to hash
     * @returns Typed data hash as hex string
     */
    hashTypedData(domain, types, value) {
        // This would implement full EIP-712 typed data hashing
        throw new Error('Typed data hashing requires EIP-712 implementation');
    }
    /**
     * Sign hash with private key
     * @param hash - Hash to sign
     * @returns Signature components
     */
    signHash(hash) {
        // This would implement ECDSA signing
        throw new Error('Signing requires ECDSA library dependency');
    }
    /**
     * Prepare transaction for signing
     * @param transaction - Transaction request
     * @returns Transaction data ready for signing
     */
    prepareTransactionForSigning(transaction) {
        // Convert transaction to format suitable for RLP encoding
        return {
            nonce: transaction.nonce || 0,
            gasPrice: transaction.gasPrice || '0x0',
            gasLimit: transaction.gas || '0x5208', // 21000 in hex
            to: transaction.to || '0x',
            value: transaction.value || '0x0',
            data: transaction.data || '0x',
            chainId: transaction.chainId || 1961, // Selendra chain ID
            type: transaction.type || '0x2' // EIP-1559 by default
        };
    }
    /**
     * Serialize signed transaction
     * @param transaction - Transaction data
     * @param signature - Signature components
     * @returns Serialized signed transaction as hex string
     */
    serializeSignedTransaction(transaction, signature) {
        // This would implement transaction serialization based on type
        throw new Error('Transaction serialization requires RLP encoding library');
    }
}
exports.SelendraWallet = SelendraWallet;
/**
 * Connected wallet with provider integration
 */
class ConnectedWallet extends SelendraWallet {
    constructor(privateKey, provider) {
        super(privateKey);
        Object.defineProperty(this, "provider", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.provider = provider;
    }
    /**
     * Get wallet balance using connected provider
     */
    async getBalance(blockTag = 'latest') {
        return this.provider.getBalance(this.address, blockTag);
    }
    /**
     * Get transaction count using connected provider
     */
    async getTransactionCount(blockTag = 'latest') {
        return this.provider.getTransactionCount(this.address, blockTag);
    }
    /**
     * Send signed transaction using connected provider
     * @param signedTransaction - Signed transaction hex
     * @returns Transaction hash
     */
    async sendTransaction(signedTransaction) {
        return this.provider.sendTransaction(signedTransaction);
    }
    /**
     * Sign and send transaction
     * @param transaction - Transaction to sign and send
     * @returns Transaction hash
     */
    async signAndSendTransaction(transaction) {
        const signedTx = await this.signTransaction(transaction);
        return this.sendTransaction(signedTx);
    }
    /**
     * Call contract method (read-only)
     * @param to - Contract address
     * @param data - Call data
     * @returns Call result
     */
    async call(to, data) {
        return this.provider.call({
            to,
            data,
            from: this.address
        });
    }
    /**
     * Estimate gas for transaction
     * @param transaction - Transaction to estimate gas for
     * @returns Estimated gas amount
     */
    async estimateGas(transaction) {
        return this.provider.estimateGas({
            ...transaction,
            from: this.address
        });
    }
    /**
     * Get connected provider
     */
    getProvider() {
        return this.provider;
    }
}
exports.ConnectedWallet = ConnectedWallet;
/**
 * Multi-sig wallet support
 */
class MultiSigWallet {
    constructor(owners, required) {
        Object.defineProperty(this, "owners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "required", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "address", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (owners.length < required) {
            throw new Error('Required signatures cannot exceed number of owners');
        }
        this.owners = owners;
        this.required = required;
        this.address = this.computeAddress(owners, required);
    }
    /**
     * Get contract address
     */
    getAddress() {
        return this.address;
    }
    /**
     * Get list of owners
     */
    getOwners() {
        return [...this.owners];
    }
    /**
     * Get required signature count
     */
    getRequired() {
        return this.required;
    }
    /**
     * Check if address is an owner
     */
    isOwner(address) {
        return this.owners.some(owner => owner.toLowerCase() === address.toLowerCase());
    }
    /**
     * Create transaction data for multi-sig execution
     * @param to - Target address
     * @param value - Value to send
     * @param data - Call data
     * @returns Encoded transaction data
     */
    createTransaction(to, value = '0x0', data = '0x') {
        // This would implement ABI encoding for multi-sig transaction
        throw new Error('Multi-sig transaction encoding requires ABI library');
    }
    /**
     * Hash transaction for multi-sig
     * @param to - Target address
     * @param value - Value to send
     * @param data - Call data
     * @param nonce - Transaction nonce
     * @returns Transaction hash
     */
    hashTransaction(to, value, data, nonce) {
        // This would implement multi-sig transaction hashing
        throw new Error('Multi-sig transaction hashing requires implementation');
    }
    /**
     * Compute multi-sig contract address
     * @param owners - List of owner addresses
     * @param required - Required signature count
     * @returns Contract address
     */
    computeAddress(owners, required) {
        // This would implement CREATE2 address computation for multi-sig
        throw new Error('Multi-sig address computation requires implementation');
    }
}
exports.MultiSigWallet = MultiSigWallet;
/**
 * Wallet utilities
 */
class WalletUtils {
    /**
     * Validate Ethereum address checksum
     * @param address - Address to validate
     * @returns True if address has valid checksum
     */
    static isValidChecksumAddress(address) {
        if (!(0, config_1.isValidEthereumAddress)(address)) {
            return false;
        }
        // Remove 0x prefix
        const cleanAddress = address.slice(2).toLowerCase();
        // Compute Keccak256 hash
        const hash = (0, crypto_1.createHash)('sha3-256').update(cleanAddress).digest();
        // Apply checksum rules
        for (let i = 0; i < cleanAddress.length; i++) {
            const charCode = cleanAddress.charCodeAt(i);
            const hashByte = hash[Math.floor(i / 2)] >> (i % 2 ? 0 : 4) & 0x0f;
            if ((charCode >= 97 && charCode <= 102) && hashByte > 7) {
                return false; // Lowercase letter should be uppercase
            }
            if ((charCode >= 65 && charCode <= 90) && hashByte <= 7) {
                return false; // Uppercase letter should be lowercase
            }
        }
        return true;
    }
    /**
     * Convert address to checksum format
     * @param address - Address to checksum
     * @returns Checksummed address
     */
    static toChecksumAddress(address) {
        if (!(0, config_1.isValidEthereumAddress)(address)) {
            throw new Error('Invalid address format');
        }
        const cleanAddress = address.slice(2).toLowerCase();
        const hash = (0, crypto_1.createHash)('sha3-256').update(cleanAddress).digest();
        let checksumAddress = '0x';
        for (let i = 0; i < cleanAddress.length; i++) {
            const charCode = cleanAddress.charCodeAt(i);
            const hashByte = hash[Math.floor(i / 2)] >> (i % 2 ? 0 : 4) & 0x0f;
            if (charCode >= 97 && charCode <= 102 && hashByte > 7) {
                checksumAddress += cleanAddress[i].toUpperCase();
            }
            else {
                checksumAddress += cleanAddress[i];
            }
        }
        return checksumAddress;
    }
    /**
     * Generate random address (for testing)
     * @returns Random Ethereum address
     */
    static generateRandomAddress() {
        const randomBytes32 = (0, crypto_1.randomBytes)(32);
        const hash = (0, crypto_1.createHash)('sha3-256').update(randomBytes32).digest();
        const address = hash.slice(-20);
        return WalletUtils.toChecksumAddress(`0x${address.toString('hex')}`);
    }
    /**
     * Estimate gas cost for transaction
     * @param gasLimit - Gas limit
     * @param gasPrice - Gas price in wei
     * @returns Total gas cost in wei
     */
    static estimateGasCost(gasLimit, gasPrice) {
        const gas = typeof gasLimit === 'string' ? parseInt(gasLimit, 10) : gasLimit;
        const price = typeof gasPrice === 'string' ? BigInt(gasPrice) : gasPrice;
        const cost = BigInt(gas) * price;
        return cost.toString();
    }
    /**
     * Format address for display
     * @param address - Address to format
     * @param chars - Number of characters to show at start/end
     * @returns Formatted address (e.g., 0x1234...5678)
     */
    static formatAddress(address, chars = 6) {
        if (!(0, config_1.isValidEthereumAddress)(address)) {
            throw new Error('Invalid address');
        }
        const checksumAddress = WalletUtils.toChecksumAddress(address);
        if (checksumAddress.length <= chars * 2 + 3) {
            return checksumAddress;
        }
        return `${checksumAddress.slice(0, chars + 2)}...${checksumAddress.slice(-chars)}`;
    }
}
exports.WalletUtils = WalletUtils;
exports.default = SelendraWallet;
//# sourceMappingURL=account.js.map