/**
 * Unified Accounts Utility Functions
 * 
 * Helper functions for address calculations and conversions
 */

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { u8aToHex, hexToU8a } from '@polkadot/util';
import { blake2AsU8a } from '@polkadot/util-crypto';

/**
 * Calculate the default EVM address for a given Substrate account
 * Based on HashedDefaultMappings::to_default_h160
 * 
 * @param accountId - Substrate account address (SS58 format)
 * @returns EVM address (0x-prefixed hex string)
 */
export function calculateDefaultEvmAddress(accountId: string): string {
  // Decode the SS58 address to get the raw public key
  const publicKey = decodeAddress(accountId);
  
  // Create payload: "evm:" + accountId bytes
  const evmPrefix = new TextEncoder().encode('evm:');
  const payload = new Uint8Array(evmPrefix.length + publicKey.length);
  payload.set(evmPrefix, 0);
  payload.set(publicKey, evmPrefix.length);
  
  // Hash with blake2_256
  const hash = blake2AsU8a(payload, 256);
  
  // Take first 20 bytes for EVM address
  const evmAddress = hash.slice(0, 20);
  
  return '0x' + Buffer.from(evmAddress).toString('hex');
}

/**
 * Calculate the default Substrate address for a given EVM address
 * Based on HashedAddressMapping::into_account_id
 * 
 * @param evmAddress - EVM address (0x-prefixed hex string)
 * @param ss58Prefix - SS58 prefix for the network (default: 204 for Selendra)
 * @returns Substrate account address (SS58 format)
 */
export function calculateDefaultSubstrateAddress(
  evmAddress: string,
  ss58Prefix: number = 204
): string {
  // Remove 0x prefix and convert to bytes
  const evmBytes = hexToU8a(evmAddress);
  
  // Hash the EVM address with blake2_256
  const hash = blake2AsU8a(evmBytes, 256);
  
  // Encode as SS58 address
  return encodeAddress(hash, ss58Prefix);
}

/**
 * Validate if a string is a valid Substrate address
 * 
 * @param address - Address to validate
 * @returns true if valid Substrate address
 */
export function isValidSubstrateAddress(address: string): boolean {
  try {
    decodeAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if a string is a valid EVM address
 * 
 * @param address - Address to validate
 * @returns true if valid EVM address
 */
export function isValidEvmAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Determine address type (substrate or evm)
 * 
 * @param address - Address to check
 * @returns 'substrate', 'evm', or null if invalid
 */
export function getAddressType(address: string): 'substrate' | 'evm' | null {
  if (isValidEvmAddress(address)) {
    return 'evm';
  }
  if (isValidSubstrateAddress(address)) {
    return 'substrate';
  }
  return null;
}

/**
 * Format balance from planck to SEL
 * 
 * @param balance - Balance in planck (smallest unit)
 * @param decimals - Token decimals (default: 18)
 * @returns Formatted balance as string
 */
export function formatBalance(balance: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = balance / divisor;
  const fraction = balance % divisor;
  
  const fractionStr = fraction.toString().padStart(decimals, '0');
  return `${whole}.${fractionStr.slice(0, 4)}`;
}

/**
 * Parse balance from SEL to planck
 * 
 * @param balance - Balance in SEL
 * @param decimals - Token decimals (default: 18)
 * @returns Balance in planck
 */
export function parseBalance(balance: string, decimals: number = 18): bigint {
  const [whole, fraction = '0'] = balance.split('.');
  const fractionPadded = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(fractionPadded);
}
