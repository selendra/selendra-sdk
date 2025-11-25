/**
 * EIP-712 Signature Utilities for Unified Accounts
 * 
 * Implements the EIP-712 typed structured data signing scheme
 * for claiming unified accounts
 */

import { ethers } from 'ethers';
import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import type { EIP712Domain } from './types.js';

/**
 * UnifiedAccountSignature
 * 
 * Handles EIP-712 signature generation for unified account claims
 */
export class UnifiedAccountSignature {
  private domain: EIP712Domain;
  
  constructor(chainId: number, genesisHash: string) {
    this.domain = {
      name: 'Selendra EVM Claim',
      version: '1',
      chainId,
      salt: genesisHash,
    };
  }
  
  /**
   * Build the EIP-712 domain separator
   * 
   * @returns Domain separator as hex string
   */
  private buildDomainSeparator(): string {
    // Domain type hash
    const domainTypeHash = ethers.keccak256(
      ethers.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,bytes32 salt)')
    );
    
    // Hash individual domain fields
    const nameHash = ethers.keccak256(ethers.toUtf8Bytes(this.domain.name));
    const versionHash = ethers.keccak256(ethers.toUtf8Bytes(this.domain.version));
    
    // Encode chain ID as 32 bytes
    const chainIdBytes = ethers.zeroPadValue(
      ethers.toBeHex(this.domain.chainId),
      32
    );
    
    // Concatenate all parts
    const encoded = ethers.concat([
      domainTypeHash,
      nameHash,
      versionHash,
      chainIdBytes,
      this.domain.salt,
    ]);
    
    return ethers.keccak256(encoded);
  }
  
  /**
   * Build the args hash for the claim message
   * 
   * @param substrateAccountId - Encoded Substrate account ID
   * @returns Args hash as hex string
   */
  private buildArgsHash(substrateAccountId: Uint8Array): string {
    // Claim type hash
    const claimTypeHash = ethers.keccak256(
      ethers.toUtf8Bytes('Claim(bytes substrateAddress)')
    );
    
    // Hash the substrate account ID
    const accountHash = ethers.keccak256(substrateAccountId);
    
    // Concatenate type hash and account hash
    const encoded = ethers.concat([claimTypeHash, accountHash]);
    
    return ethers.keccak256(encoded);
  }
  
  /**
   * Build the complete signing payload
   * 
   * @param substrateAccountId - Substrate account address or raw bytes
   * @returns Signing payload as hex string
   */
  buildSigningPayload(substrateAccountId: string | Uint8Array): string {
    // Convert to bytes if string
    const accountBytes = typeof substrateAccountId === 'string'
      ? decodeAddress(substrateAccountId)
      : substrateAccountId;
    
    // Build domain separator and args hash
    const domainSeparator = this.buildDomainSeparator();
    const argsHash = this.buildArgsHash(accountBytes);
    
    // EIP-712 payload: "\x19\x01" + domainSeparator + argsHash
    const payload = ethers.concat([
      '0x1901',
      domainSeparator,
      argsHash,
    ]);
    
    return ethers.keccak256(payload);
  }
  
  /**
   * Generate EIP-712 signature for claiming
   * 
   * @param substrateAccountId - Substrate account address
   * @param evmPrivateKey - EVM private key (0x-prefixed)
   * @returns Signature as hex string (65 bytes with recovery byte)
   */
  async signClaim(
    substrateAccountId: string,
    evmPrivateKey: string
  ): Promise<string> {
    // Build the signing payload
    const payload = this.buildSigningPayload(substrateAccountId);
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(evmPrivateKey);
    
    // Sign the payload hash directly
    // EIP-712 signatures sign the pre-hashed message
    const messageBytes = ethers.getBytes(payload);
    const signature = await wallet.signMessage(messageBytes);
    
    return signature;
  }
  
  /**
   * Verify a signature matches the expected EVM address
   * 
   * @param substrateAccountId - Substrate account address
   * @param signature - EIP-712 signature
   * @param expectedEvmAddress - Expected EVM address
   * @returns true if signature is valid
   */
  async verifySignature(
    substrateAccountId: string,
    signature: string,
    expectedEvmAddress: string
  ): Promise<boolean> {
    try {
      const payload = this.buildSigningPayload(substrateAccountId);
      const messageBytes = ethers.getBytes(payload);
      
      // Recover the address from the signature
      const recoveredAddress = ethers.verifyMessage(messageBytes, signature);
      
      // Compare addresses (case-insensitive)
      return recoveredAddress.toLowerCase() === expectedEvmAddress.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }
  
  /**
   * Get the EVM address from a private key
   * 
   * @param evmPrivateKey - EVM private key
   * @returns EVM address
   */
  getEvmAddress(evmPrivateKey: string): string {
    const wallet = new ethers.Wallet(evmPrivateKey);
    return wallet.address;
  }
}
