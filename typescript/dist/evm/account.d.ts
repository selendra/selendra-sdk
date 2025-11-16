/**
 * EVM Account Management for the Selendra SDK
 * Provides wallet integration, address management, and signature operations
 * Compatible with ethers.js v6 Wallet API
 */
import type { Address, Balance, TransactionHash } from '../types/common';
import type { EvmWallet, EvmTransactionRequest, TypedDataDomain, TypedDataField } from '../types/evm';
/**
 * EVM Wallet implementation with ethers.js v6 compatibility
 */
export declare class SelendraWallet implements EvmWallet {
    private readonly privateKey;
    readonly address: Address;
    private readonly publicKey;
    /**
     * Create a new wallet instance from a private key
     * @param privateKey - 32-byte private key (with or without 0x prefix)
     */
    constructor(privateKey: string);
    /**
     * Create a random wallet
     * @returns New wallet with randomly generated private key
     */
    static createRandom(): SelendraWallet;
    /**
     * Create wallet from mnemonic phrase
     * @param mnemonic - BIP-39 mnemonic phrase
     * @param path - Derivation path (default: standard Ethereum path)
     * @returns Wallet derived from mnemonic
     */
    static fromMnemonic(mnemonic: string, path?: string): SelendraWallet;
    /**
     * Create wallet from encrypted JSON keystore
     * @param json - Encrypted keystore JSON
     * @param password - Password for decryption
     * @returns Wallet from keystore
     */
    static fromEncryptedJson(json: string | Record<string, unknown>, password: string): Promise<SelendraWallet>;
    /**
     * Get wallet address
     * @returns Ethereum address of the wallet
     */
    getAddress(): Address;
    /**
     * Get private key (use with caution)
     * @returns Private key as hex string
     */
    getPrivateKey(): string;
    /**
     * Get public key
     * @returns Uncompressed public key as hex string
     */
    getPublicKey(): string;
    /**
     * Check if address belongs to this wallet
     * @param address - Address to check
     * @returns True if address matches wallet address
     */
    isAddress(address: Address): boolean;
    /**
     * Get wallet balance
     * @param blockTag - Block number or tag to query balance at
     * @returns Balance in wei as string
     */
    getBalance(blockTag?: string | number): Promise<Balance>;
    /**
     * Get transaction count (nonce)
     * @param blockTag - Block number or tag to query nonce at
     * @returns Transaction count as number
     */
    getTransactionCount(blockTag?: string | number): Promise<number>;
    /**
     * Sign transaction
     * @param transaction - Transaction to sign
     * @returns Signed transaction as hex string
     */
    signTransaction(transaction: EvmTransactionRequest): Promise<string>;
    /**
     * Sign message
     * @param message - Message to sign
     * @returns Signature as hex string
     */
    signMessage(message: string | Uint8Array): Promise<string>;
    /**
     * Sign typed data (EIP-712)
     * @param domain - Typed data domain
     * @param types - Type definitions
     * @param value - Data to sign
     * @returns Signature as hex string
     */
    signTypedData(domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, unknown>): Promise<string>;
    /**
     * Encrypt wallet with password
     * @param password - Password for encryption
     * @param progressCallback - Optional progress callback
     * @returns Encrypted keystore JSON
     */
    encrypt(password: string, progressCallback?: (progress: number) => void): Promise<string>;
    /**
     * Connect wallet to provider (ethers.js compatibility)
     * @param provider - EVM provider/client instance
     * @returns Connected wallet instance
     */
    connect(provider: any): SelendraWallet;
    /**
     * Derive public key from private key
     * @param privateKey - Private key as hex string
     * @returns Uncompressed public key as hex string
     */
    private derivePublicKey;
    /**
     * Convert public key to Ethereum address
     * @param publicKey - Uncompressed public key as hex string
     * @returns Ethereum address as hex string
     */
    private publicKeyToAddress;
    /**
     * Hash transaction for signing
     * @param transaction - Transaction data
     * @returns Transaction hash as hex string
     */
    private hashTransaction;
    /**
     * Hash message for signing (EIP-191)
     * @param message - Message to hash
     * @returns Message hash as hex string
     */
    private hashMessage;
    /**
     * Hash typed data for signing (EIP-712)
     * @param domain - Typed data domain
     * @param types - Type definitions
     * @param value - Data to hash
     * @returns Typed data hash as hex string
     */
    private hashTypedData;
    /**
     * Sign hash with private key
     * @param hash - Hash to sign
     * @returns Signature components
     */
    private signHash;
    /**
     * Prepare transaction for signing
     * @param transaction - Transaction request
     * @returns Transaction data ready for signing
     */
    private prepareTransactionForSigning;
    /**
     * Serialize signed transaction
     * @param transaction - Transaction data
     * @param signature - Signature components
     * @returns Serialized signed transaction as hex string
     */
    private serializeSignedTransaction;
}
/**
 * Connected wallet with provider integration
 */
export declare class ConnectedWallet extends SelendraWallet {
    private readonly provider;
    constructor(privateKey: string, provider: any);
    /**
     * Get wallet balance using connected provider
     */
    getBalance(blockTag?: string | number): Promise<Balance>;
    /**
     * Get transaction count using connected provider
     */
    getTransactionCount(blockTag?: string | number): Promise<number>;
    /**
     * Send signed transaction using connected provider
     * @param signedTransaction - Signed transaction hex
     * @returns Transaction hash
     */
    sendTransaction(signedTransaction: string): Promise<TransactionHash>;
    /**
     * Sign and send transaction
     * @param transaction - Transaction to sign and send
     * @returns Transaction hash
     */
    signAndSendTransaction(transaction: EvmTransactionRequest): Promise<TransactionHash>;
    /**
     * Call contract method (read-only)
     * @param to - Contract address
     * @param data - Call data
     * @returns Call result
     */
    call(to: Address, data: string): Promise<string>;
    /**
     * Estimate gas for transaction
     * @param transaction - Transaction to estimate gas for
     * @returns Estimated gas amount
     */
    estimateGas(transaction: EvmTransactionRequest): Promise<number>;
    /**
     * Get connected provider
     */
    getProvider(): any;
}
/**
 * Multi-sig wallet support
 */
export declare class MultiSigWallet {
    private readonly owners;
    private readonly required;
    private readonly address;
    constructor(owners: Address[], required: number);
    /**
     * Get contract address
     */
    getAddress(): Address;
    /**
     * Get list of owners
     */
    getOwners(): Address[];
    /**
     * Get required signature count
     */
    getRequired(): number;
    /**
     * Check if address is an owner
     */
    isOwner(address: Address): boolean;
    /**
     * Create transaction data for multi-sig execution
     * @param to - Target address
     * @param value - Value to send
     * @param data - Call data
     * @returns Encoded transaction data
     */
    createTransaction(to: Address, value?: Balance, data?: string): string;
    /**
     * Hash transaction for multi-sig
     * @param to - Target address
     * @param value - Value to send
     * @param data - Call data
     * @param nonce - Transaction nonce
     * @returns Transaction hash
     */
    hashTransaction(to: Address, value: Balance, data: string, nonce: number): string;
    /**
     * Compute multi-sig contract address
     * @param owners - List of owner addresses
     * @param required - Required signature count
     * @returns Contract address
     */
    private computeAddress;
}
/**
 * Wallet utilities
 */
export declare class WalletUtils {
    /**
     * Validate Ethereum address checksum
     * @param address - Address to validate
     * @returns True if address has valid checksum
     */
    static isValidChecksumAddress(address: string): boolean;
    /**
     * Convert address to checksum format
     * @param address - Address to checksum
     * @returns Checksummed address
     */
    static toChecksumAddress(address: string): Address;
    /**
     * Generate random address (for testing)
     * @returns Random Ethereum address
     */
    static generateRandomAddress(): Address;
    /**
     * Estimate gas cost for transaction
     * @param gasLimit - Gas limit
     * @param gasPrice - Gas price in wei
     * @returns Total gas cost in wei
     */
    static estimateGasCost(gasLimit: number | string, gasPrice: Balance): Balance;
    /**
     * Format address for display
     * @param address - Address to format
     * @param chars - Number of characters to show at start/end
     * @returns Formatted address (e.g., 0x1234...5678)
     */
    static formatAddress(address: Address, chars?: number): string;
}
export default SelendraWallet;
//# sourceMappingURL=account.d.ts.map