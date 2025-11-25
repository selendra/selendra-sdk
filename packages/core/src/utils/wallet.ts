/**
 * Wallet Utilities for Selendra SDK
 * 
 * Provides wallet creation, management, and cryptographic operations
 * for both Substrate and EVM chains.
 */

import { Keyring } from '@polkadot/keyring';
import { mnemonicGenerate, mnemonicValidate, cryptoWaitReady } from '@polkadot/util-crypto';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { ethers } from 'ethers';
import type { KeyringPair } from '@polkadot/keyring/types';

/**
 * Wallet type - Substrate or EVM
 */
export type WalletType = 'substrate' | 'evm';

/**
 * Encrypted JSON wallet format
 */
export interface EncryptedJson {
  encoded: string;
  encoding: {
    content: string[];
    type: string[];
    version: string;
  };
  address: string;
  meta: {
    name?: string;
    whenCreated?: number;
  };
}

/**
 * EIP-712 Domain for typed data signing
 */
export interface EIP712Domain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
  salt?: string;
}

/**
 * Progress callback for encryption/decryption
 */
export type ProgressCallback = (percent: number) => void;

/**
 * SelendraWallet - Unified wallet for Substrate and EVM chains
 */
export class SelendraWallet {
  private substrateAccount?: KeyringPair;
  private evmWallet?: ethers.Wallet;
  private walletType: WalletType;

  /**
   * Create wallet from private key
   * @param privateKey - Private key (hex string with or without 0x prefix)
   * @param type - Wallet type ('substrate' | 'evm')
   */
  constructor(privateKey: string, type: WalletType = 'evm') {
    this.walletType = type;

    if (type === 'evm') {
      // Create EVM wallet
      this.evmWallet = new ethers.Wallet(privateKey);
    } else {
      // Create Substrate wallet
      const keyring = new Keyring({ type: 'sr25519' });
      const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
      this.substrateAccount = keyring.addFromSeed(hexToU8a('0x' + cleanKey));
    }
  }

  /**
   * Create a random wallet
   * @param type - Wallet type ('substrate' | 'evm')
   * @returns New random wallet
   */
  static createRandom(type: WalletType = 'evm'): SelendraWallet {
    if (type === 'evm') {
      const wallet = ethers.Wallet.createRandom();
      return new SelendraWallet(wallet.privateKey, 'evm');
    } else {
      // Generate random Substrate account
      const mnemonic = mnemonicGenerate();
      return SelendraWallet.fromMnemonic(mnemonic, undefined, 'substrate');
    }
  }

  /**
   * Create wallet from mnemonic phrase
   * @param mnemonic - BIP-39 mnemonic phrase
   * @param path - Derivation path (optional)
   * @param type - Wallet type ('substrate' | 'evm')
   * @returns Wallet from mnemonic
   */
  static fromMnemonic(
    mnemonic: string,
    path?: string,
    type: WalletType = 'evm'
  ): SelendraWallet {
    // Validate mnemonic
    if (!mnemonicValidate(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    if (type === 'evm') {
      const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path);
      return new SelendraWallet(hdNode.privateKey, 'evm');
    } else {
      // Create Substrate account from mnemonic
      const keyring = new Keyring({ type: 'sr25519' });
      const uri = path ? `${mnemonic}${path}` : mnemonic;
      const account = keyring.addFromUri(uri);
      
      const wallet = new SelendraWallet('0x' + '00'.repeat(32), 'substrate');
      wallet.substrateAccount = account;
      return wallet;
    }
  }

  /**
   * Create wallet from encrypted JSON
   * @param json - Encrypted JSON wallet
   * @param password - Password to decrypt
   * @param type - Wallet type
   * @returns Decrypted wallet
   */
  static async fromEncryptedJson(
    json: string | EncryptedJson,
    password: string,
    type: WalletType = 'evm'
  ): Promise<SelendraWallet> {
    if (type === 'evm') {
      const wallet = await ethers.Wallet.fromEncryptedJson(
        typeof json === 'string' ? json : JSON.stringify(json),
        password
      );
      return new SelendraWallet(wallet.privateKey, 'evm');
    } else {
      // Decrypt Substrate account
      await cryptoWaitReady();
      const keyring = new Keyring({ type: 'sr25519' });
      const jsonObj = typeof json === 'string' ? JSON.parse(json) : json;
      const account = keyring.addFromJson(jsonObj);
      account.unlock(password);
      
      const wallet = new SelendraWallet('0x' + '00'.repeat(32), 'substrate');
      wallet.substrateAccount = account;
      return wallet;
    }
  }

  /**
   * Get wallet address
   * @param ss58Format - SS58 format for Substrate addresses (default: 204 for Selendra)
   * @returns Wallet address
   */
  getAddress(ss58Format: number = 204): string {
    if (this.walletType === 'evm') {
      if (!this.evmWallet) throw new Error('EVM wallet not initialized');
      return this.evmWallet.address;
    } else {
      if (!this.substrateAccount) throw new Error('Substrate account not initialized');
      return this.substrateAccount.address;
    }
  }

  /**
   * Get private key
   * @returns Private key as hex string
   */
  getPrivateKey(): string {
    if (this.walletType === 'evm') {
      if (!this.evmWallet) throw new Error('EVM wallet not initialized');
      return this.evmWallet.privateKey;
    } else {
      if (!this.substrateAccount) throw new Error('Substrate account not initialized');
      // @ts-ignore - secretKey exists at runtime
      const secretKey = this.substrateAccount.secretKey;
      if (!secretKey) {
        throw new Error('Cannot extract private key from this Substrate account (may be derived from mnemonic)');
      }
      return '0x' + Buffer.from(secretKey).toString('hex');
    }
  }

  /**
   * Get public key
   * @returns Public key as hex string
   */
  getPublicKey(): string {
    if (this.walletType === 'evm') {
      if (!this.evmWallet) throw new Error('EVM wallet not initialized');
      // Get public key from signing key
      return this.evmWallet.signingKey.publicKey;
    } else {
      if (!this.substrateAccount) throw new Error('Substrate account not initialized');
      return u8aToHex(this.substrateAccount.publicKey);
    }
  }

  /**
   * Get wallet balance (requires provider)
   * @param provider - EVM provider or Substrate API
   * @param blockTag - Block tag for EVM queries
   * @returns Balance in smallest unit (wei/planck)
   */
  async getBalance(provider: any, blockTag?: string | number): Promise<bigint> {
    if (this.walletType === 'evm') {
      if (!this.evmWallet) throw new Error('EVM wallet not initialized');
      const balance = await provider.getBalance(this.evmWallet.address, blockTag);
      return BigInt(balance.toString());
    } else {
      if (!this.substrateAccount) throw new Error('Substrate account not initialized');
      const accountInfo = await provider.query.system.account(this.substrateAccount.address);
      return BigInt(accountInfo.data.free.toString());
    }
  }

  /**
   * Get transaction count (nonce)
   * @param provider - EVM provider or Substrate API
   * @param blockTag - Block tag for EVM queries
   * @returns Transaction count
   */
  async getTransactionCount(provider: any, blockTag?: string | number): Promise<number> {
    if (this.walletType === 'evm') {
      if (!this.evmWallet) throw new Error('EVM wallet not initialized');
      return await provider.getTransactionCount(this.evmWallet.address, blockTag);
    } else {
      if (!this.substrateAccount) throw new Error('Substrate account not initialized');
      const nonce = await provider.query.system.account(this.substrateAccount.address);
      return nonce.nonce.toNumber();
    }
  }

  /**
   * Sign transaction
   * @param transaction - Transaction object
   * @returns Signed transaction
   */
  async signTransaction(transaction: any): Promise<string> {
    if (this.walletType === 'evm') {
      if (!this.evmWallet) throw new Error('EVM wallet not initialized');
      return await this.evmWallet.signTransaction(transaction);
    } else {
      throw new Error('Use Substrate API extrinsic.signAndSend() for Substrate transactions');
    }
  }

  /**
   * Sign message
   * @param message - Message to sign (string or bytes)
   * @returns Signature as hex string
   */
  async signMessage(message: string | Uint8Array): Promise<string> {
    if (this.walletType === 'evm') {
      if (!this.evmWallet) throw new Error('EVM wallet not initialized');
      return await this.evmWallet.signMessage(message);
    } else {
      if (!this.substrateAccount) throw new Error('Substrate account not initialized');
      const messageBytes = typeof message === 'string' 
        ? new TextEncoder().encode(message)
        : message;
      const signature = this.substrateAccount.sign(messageBytes);
      return u8aToHex(signature);
    }
  }

  /**
   * Sign typed data (EIP-712)
   * @param domain - EIP-712 domain
   * @param types - EIP-712 types
   * @param value - Data to sign
   * @returns Signature as hex string
   */
  async signTypedData(
    domain: EIP712Domain,
    types: Record<string, any>,
    value: Record<string, any>
  ): Promise<string> {
    if (this.walletType !== 'evm') {
      throw new Error('EIP-712 signing is only supported for EVM wallets');
    }
    if (!this.evmWallet) throw new Error('EVM wallet not initialized');

    return await this.evmWallet.signTypedData(domain, types, value);
  }

  /**
   * Encrypt wallet to JSON
   * @param password - Password for encryption
   * @param progressCallback - Progress callback (0-100)
   * @returns Encrypted JSON string
   */
  async encrypt(
    password: string,
    progressCallback?: ProgressCallback
  ): Promise<string> {
    if (this.walletType === 'evm') {
      if (!this.evmWallet) throw new Error('EVM wallet not initialized');
      return await this.evmWallet.encrypt(password, progressCallback);
    } else {
      if (!this.substrateAccount) throw new Error('Substrate account not initialized');
      await cryptoWaitReady();
      
      // Polkadot keyring encryption doesn't support progress callback
      const json = this.substrateAccount.toJson(password);
      return JSON.stringify(json);
    }
  }

  /**
   * Get the underlying Substrate account (if applicable)
   * @returns KeyringPair or undefined
   */
  getSubstrateAccount(): KeyringPair | undefined {
    return this.substrateAccount;
  }

  /**
   * Get the underlying EVM wallet (if applicable)
   * @returns ethers.Wallet or undefined
   */
  getEvmWallet(): ethers.Wallet | undefined {
    return this.evmWallet;
  }

  /**
   * Connect EVM wallet to provider
   * @param provider - EVM provider
   * @returns Connected wallet
   */
  connect(provider: ethers.Provider): ethers.Wallet {
    if (this.walletType !== 'evm') {
      throw new Error('connect() is only supported for EVM wallets');
    }
    if (!this.evmWallet) throw new Error('EVM wallet not initialized');
    
    return this.evmWallet.connect(provider);
  }
}

/**
 * Wallet utility functions
 */
export class WalletUtils {
  /**
   * Generate BIP-39 mnemonic
   * @param wordCount - Number of words (12, 15, 18, 21, 24)
   * @returns Mnemonic phrase
   */
  static generateMnemonic(wordCount?: 12 | 15 | 18 | 21 | 24): string {
    return mnemonicGenerate(wordCount);
  }

  /**
   * Validate BIP-39 mnemonic
   * @param mnemonic - Mnemonic to validate
   * @returns True if valid
   */
  static validateMnemonic(mnemonic: string): boolean {
    return mnemonicValidate(mnemonic);
  }

  /**
   * Encrypt private key with password
   * @param privateKey - Private key to encrypt
   * @param password - Password
   * @param type - Wallet type
   * @returns Encrypted JSON string
   */
  static async encryptKey(
    privateKey: string,
    password: string,
    type: WalletType = 'evm'
  ): Promise<string> {
    const wallet = new SelendraWallet(privateKey, type);
    return await wallet.encrypt(password);
  }

  /**
   * Decrypt encrypted key with password
   * @param encryptedJson - Encrypted JSON
   * @param password - Password
   * @param type - Wallet type
   * @returns SelendraWallet instance
   */
  static async decryptKey(
    encryptedJson: string,
    password: string,
    type: WalletType = 'evm'
  ): Promise<SelendraWallet> {
    return await SelendraWallet.fromEncryptedJson(encryptedJson, password, type);
  }

  /**
   * Derive EVM address from Substrate account
   * @param substrateAddress - Substrate address or KeyringPair
   * @returns Derived EVM address (0x...)
   */
  static deriveEvmAddress(substrateAddress: string | KeyringPair): string {
    const keyring = new Keyring({ type: 'sr25519' });
    const account = typeof substrateAddress === 'string'
      ? keyring.addFromAddress(substrateAddress)
      : substrateAddress;

    const evmAccount = account.derive('//evm');
    // @ts-ignore - secretKey exists at runtime
    const secretKey = evmAccount.secretKey;
    
    if (!secretKey) {
      throw new Error('Cannot derive EVM address: secretKey not available from Substrate account');
    }
    
    const evmWallet = new ethers.Wallet('0x' + Buffer.from(secretKey).toString('hex'));
    return evmWallet.address;
  }

  /**
   * Check if string is valid Ethereum address
   * @param address - Address to check
   * @returns True if valid
   */
  static isValidEvmAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Check if string is valid private key
   * @param key - Private key to check
   * @returns True if valid
   */
  static isValidPrivateKey(key: string): boolean {
    try {
      const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
      return /^[0-9a-fA-F]{64}$/.test(cleanKey);
    } catch {
      return false;
    }
  }

  /**
   * Format address for display
   * @param address - Address to format
   * @param prefixLength - Number of chars at start
   * @param suffixLength - Number of chars at end
   * @returns Formatted address (e.g., "0x1234...5678")
   */
  static formatAddress(
    address: string,
    prefixLength: number = 6,
    suffixLength: number = 4
  ): string {
    if (address.length <= prefixLength + suffixLength) {
      return address;
    }
    return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
  }
}
