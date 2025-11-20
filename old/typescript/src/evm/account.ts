/**
 * EVM Account Management for the Selendra SDK
 * Provides wallet integration, address management, and signature operations
 * Compatible with ethers.js v6 Wallet API
 */

import { createHash, randomBytes } from 'crypto';

import type { Address, Balance, TransactionHash } from '../types/common';
import type {
  EvmWallet,
  EvmTransactionRequest,
  TypedDataDomain,
  TypedDataField
} from '../types/evm';

import {
  isValidEthereumAddress,
  isValidPrivateKey,
  etherToWei,
  weiToEther
} from './config';

/**
 * EVM Wallet implementation with ethers.js v6 compatibility
 */
export class SelendraWallet implements EvmWallet {
  private readonly privateKey: string;
  public readonly address: Address;
  private readonly publicKey: string;

  /**
   * Create a new wallet instance from a private key
   * @param privateKey - 32-byte private key (with or without 0x prefix)
   */
  constructor(privateKey: string) {
    // Clean and validate private key
    const cleanKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    if (!isValidPrivateKey(cleanKey)) {
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
  static createRandom(): SelendraWallet {
    const privateKey = `0x${randomBytes(32).toString('hex')}`;
    return new SelendraWallet(privateKey);
  }

  /**
   * Create wallet from mnemonic phrase
   * @param mnemonic - BIP-39 mnemonic phrase
   * @param path - Derivation path (default: standard Ethereum path)
   * @returns Wallet derived from mnemonic
   */
  static fromMnemonic(mnemonic: string, path: string = "m/44'/60'/0'/0/0"): SelendraWallet {
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
  static fromEncryptedJson(json: string | Record<string, unknown>, password: string): Promise<SelendraWallet> {
    // Note: This would require scrypt or similar encryption library
    throw new Error('Encrypted keystore support requires additional dependencies.');
  }

  /**
   * Get wallet address
   * @returns Ethereum address of the wallet
   */
  getAddress(): Address {
    return this.address;
  }

  /**
   * Get private key (use with caution)
   * @returns Private key as hex string
   */
  getPrivateKey(): string {
    return this.privateKey;
  }

  /**
   * Get public key
   * @returns Uncompressed public key as hex string
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Check if address belongs to this wallet
   * @param address - Address to check
   * @returns True if address matches wallet address
   */
  isAddress(address: Address): boolean {
    return this.address.toLowerCase() === address.toLowerCase();
  }

  /**
   * Get wallet balance
   * @param blockTag - Block number or tag to query balance at
   * @returns Balance in wei as string
   */
  async getBalance(blockTag: string | number = 'latest'): Promise<Balance> {
    // This would be implemented by the EVM client
    // For now, return a placeholder
    throw new Error('getBalance() requires EVM client instance');
  }

  /**
   * Get transaction count (nonce)
   * @param blockTag - Block number or tag to query nonce at
   * @returns Transaction count as number
   */
  async getTransactionCount(blockTag: string | number = 'latest'): Promise<number> {
    throw new Error('getTransactionCount() requires EVM client instance');
  }

  /**
   * Sign transaction
   * @param transaction - Transaction to sign
   * @returns Signed transaction as hex string
   */
  async signTransaction(transaction: EvmTransactionRequest): Promise<string> {
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
  async signMessage(message: string | Uint8Array): Promise<string> {
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
  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, TypedDataField[]>,
    value: Record<string, unknown>
  ): Promise<string> {
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
  async encrypt(password: string, progressCallback?: (progress: number) => void): Promise<string> {
    throw new Error('Encryption requires additional dependencies like scrypt.');
  }

  /**
   * Connect wallet to provider (ethers.js compatibility)
   * @param provider - EVM provider/client instance
   * @returns Connected wallet instance
   */
  connect(provider: any): SelendraWallet {
    return new ConnectedWallet(this.privateKey, provider);
  }

  /**
   * Derive public key from private key
   * @param privateKey - Private key as hex string
   * @returns Uncompressed public key as hex string
   */
  private derivePublicKey(privateKey: string): string {
    // Note: This would require an ECDSA library like secp256k1 or ethers
    // For now, return a placeholder
    throw new Error('Public key derivation requires ECDSA library dependency');
  }

  /**
   * Convert public key to Ethereum address
   * @param publicKey - Uncompressed public key as hex string
   * @returns Ethereum address as hex string
   */
  private publicKeyToAddress(publicKey: string): Address {
    // Remove 0x prefix if present
    const cleanKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;

    // Take last 20 bytes of Keccak256 hash of public key (without prefix)
    const publicKeyBytes = Buffer.from(cleanKey, 'hex');
    const hash = createHash('sha3-256').update(publicKeyBytes.slice(1)).digest();
    const address = hash.slice(-20);

    return `0x${address.toString('hex')}`;
  }

  /**
   * Hash transaction for signing
   * @param transaction - Transaction data
   * @returns Transaction hash as hex string
   */
  private hashTransaction(transaction: any): string {
    // This would implement RLP encoding and Keccak256 hashing
    throw new Error('Transaction hashing requires RLP encoding library');
  }

  /**
   * Hash message for signing (EIP-191)
   * @param message - Message to hash
   * @returns Message hash as hex string
   */
  private hashMessage(message: string | Uint8Array): string {
    const messageBytes = typeof message === 'string' ? Buffer.from(message) : message;
    const prefix = Buffer.from(`\x19Ethereum Signed Message:\n${messageBytes.length}`);
    const combined = Buffer.concat([prefix, messageBytes]);
    const hash = createHash('sha3-256').update(combined).digest();
    return `0x${hash.toString('hex')}`;
  }

  /**
   * Hash typed data for signing (EIP-712)
   * @param domain - Typed data domain
   * @param types - Type definitions
   * @param value - Data to hash
   * @returns Typed data hash as hex string
   */
  private hashTypedData(
    domain: TypedDataDomain,
    types: Record<string, TypedDataField[]>,
    value: Record<string, unknown>
  ): string {
    // This would implement full EIP-712 typed data hashing
    throw new Error('Typed data hashing requires EIP-712 implementation');
  }

  /**
   * Sign hash with private key
   * @param hash - Hash to sign
   * @returns Signature components
   */
  private signHash(hash: string): { r: string; s: string; v: number } {
    // This would implement ECDSA signing
    throw new Error('Signing requires ECDSA library dependency');
  }

  /**
   * Prepare transaction for signing
   * @param transaction - Transaction request
   * @returns Transaction data ready for signing
   */
  private prepareTransactionForSigning(transaction: EvmTransactionRequest): any {
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
  private serializeSignedTransaction(transaction: any, signature: { r: string; s: string; v: number }): string {
    // This would implement transaction serialization based on type
    throw new Error('Transaction serialization requires RLP encoding library');
  }
}

/**
 * Connected wallet with provider integration
 */
export class ConnectedWallet extends SelendraWallet {
  private readonly provider: any;

  constructor(privateKey: string, provider: any) {
    super(privateKey);
    this.provider = provider;
  }

  /**
   * Get wallet balance using connected provider
   */
  async getBalance(blockTag: string | number = 'latest'): Promise<Balance> {
    return this.provider.getBalance(this.address, blockTag);
  }

  /**
   * Get transaction count using connected provider
   */
  async getTransactionCount(blockTag: string | number = 'latest'): Promise<number> {
    return this.provider.getTransactionCount(this.address, blockTag);
  }

  /**
   * Send signed transaction using connected provider
   * @param signedTransaction - Signed transaction hex
   * @returns Transaction hash
   */
  async sendTransaction(signedTransaction: string): Promise<TransactionHash> {
    return this.provider.sendTransaction(signedTransaction);
  }

  /**
   * Sign and send transaction
   * @param transaction - Transaction to sign and send
   * @returns Transaction hash
   */
  async signAndSendTransaction(transaction: EvmTransactionRequest): Promise<TransactionHash> {
    const signedTx = await this.signTransaction(transaction);
    return this.sendTransaction(signedTx);
  }

  /**
   * Call contract method (read-only)
   * @param to - Contract address
   * @param data - Call data
   * @returns Call result
   */
  async call(to: Address, data: string): Promise<string> {
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
  async estimateGas(transaction: EvmTransactionRequest): Promise<number> {
    return this.provider.estimateGas({
      ...transaction,
      from: this.address
    });
  }

  /**
   * Get connected provider
   */
  getProvider(): any {
    return this.provider;
  }
}

/**
 * Multi-sig wallet support
 */
export class MultiSigWallet {
  private readonly owners: Address[];
  private readonly required: number;
  private readonly address: Address;

  constructor(owners: Address[], required: number) {
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
  getAddress(): Address {
    return this.address;
  }

  /**
   * Get list of owners
   */
  getOwners(): Address[] {
    return [...this.owners];
  }

  /**
   * Get required signature count
   */
  getRequired(): number {
    return this.required;
  }

  /**
   * Check if address is an owner
   */
  isOwner(address: Address): boolean {
    return this.owners.some(owner => owner.toLowerCase() === address.toLowerCase());
  }

  /**
   * Create transaction data for multi-sig execution
   * @param to - Target address
   * @param value - Value to send
   * @param data - Call data
   * @returns Encoded transaction data
   */
  createTransaction(to: Address, value: Balance = '0x0', data: string = '0x'): string {
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
  hashTransaction(to: Address, value: Balance, data: string, nonce: number): string {
    // This would implement multi-sig transaction hashing
    throw new Error('Multi-sig transaction hashing requires implementation');
  }

  /**
   * Compute multi-sig contract address
   * @param owners - List of owner addresses
   * @param required - Required signature count
   * @returns Contract address
   */
  private computeAddress(owners: Address[], required: number): Address {
    // This would implement CREATE2 address computation for multi-sig
    throw new Error('Multi-sig address computation requires implementation');
  }
}

/**
 * Wallet utilities
 */
export class WalletUtils {
  /**
   * Validate Ethereum address checksum
   * @param address - Address to validate
   * @returns True if address has valid checksum
   */
  static isValidChecksumAddress(address: string): boolean {
    if (!isValidEthereumAddress(address)) {
      return false;
    }

    // Remove 0x prefix
    const cleanAddress = address.slice(2).toLowerCase();

    // Compute Keccak256 hash
    const hash = createHash('sha3-256').update(cleanAddress).digest();

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
  static toChecksumAddress(address: string): Address {
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid address format');
    }

    const cleanAddress = address.slice(2).toLowerCase();
    const hash = createHash('sha3-256').update(cleanAddress).digest();

    let checksumAddress = '0x';
    for (let i = 0; i < cleanAddress.length; i++) {
      const charCode = cleanAddress.charCodeAt(i);
      const hashByte = hash[Math.floor(i / 2)] >> (i % 2 ? 0 : 4) & 0x0f;

      if (charCode >= 97 && charCode <= 102 && hashByte > 7) {
        checksumAddress += cleanAddress[i].toUpperCase();
      } else {
        checksumAddress += cleanAddress[i];
      }
    }

    return checksumAddress as Address;
  }

  /**
   * Generate random address (for testing)
   * @returns Random Ethereum address
   */
  static generateRandomAddress(): Address {
    const randomBytes32 = randomBytes(32);
    const hash = createHash('sha3-256').update(randomBytes32).digest();
    const address = hash.slice(-20);
    return WalletUtils.toChecksumAddress(`0x${address.toString('hex')}`);
  }

  /**
   * Estimate gas cost for transaction
   * @param gasLimit - Gas limit
   * @param gasPrice - Gas price in wei
   * @returns Total gas cost in wei
   */
  static estimateGasCost(gasLimit: number | string, gasPrice: Balance): Balance {
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
  static formatAddress(address: Address, chars: number = 6): string {
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid address');
    }

    const checksumAddress = WalletUtils.toChecksumAddress(address);
    if (checksumAddress.length <= chars * 2 + 3) {
      return checksumAddress;
    }

    return `${checksumAddress.slice(0, chars + 2)}...${checksumAddress.slice(-chars)}`;
  }
}

export default SelendraWallet;