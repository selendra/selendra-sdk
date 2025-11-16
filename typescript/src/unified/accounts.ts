/**
 * Unified Accounts Module for Selendra SDK
 *
 * Provides seamless conversion between Substrate SS58 addresses and EVM H160 addresses.
 * This is a critical Selendra feature that enables cross-chain account interoperability.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */

import { ApiPromise } from '@polkadot/api';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { u8aToHex, hexToU8a, isHex } from '@polkadot/util';
import type { Address, Balance } from '../types/common';

/**
 * Unified address that can represent both Substrate and EVM addresses
 */
export class UnifiedAddress {
  private substrateAddress: string;
  private evmAddress: string;

  constructor(address: string, ss58Prefix: number = 204) {
    if (this.isEvmAddress(address)) {
      this.evmAddress = address.toLowerCase();
      this.substrateAddress = this.evmToSubstrate(address, ss58Prefix);
    } else {
      this.substrateAddress = address;
      this.evmAddress = this.substrateToEvm(address);
    }
  }

  /**
   * Check if address is EVM format (0x... 20 bytes)
   */
  private isEvmAddress(address: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

  /**
   * Convert Substrate SS58 address to EVM H160 address
   * Takes the first 20 bytes of the decoded public key
   */
  private substrateToEvm(substrateAddress: string): string {
    try {
      const decoded = decodeAddress(substrateAddress);
      // Take first 20 bytes for EVM address
      const evmBytes = decoded.slice(0, 20);
      return u8aToHex(evmBytes);
    } catch (error) {
      throw new Error(`Failed to convert Substrate address to EVM: ${error}`);
    }
  }

  /**
   * Convert EVM H160 address to Substrate SS58 address
   * Pads EVM address to 32 bytes (AccountId32)
   */
  private evmToSubstrate(evmAddress: string, ss58Prefix: number): string {
    try {
      if (!isHex(evmAddress) || evmAddress.length !== 42) {
        throw new Error('Invalid EVM address format');
      }

      // Convert hex to bytes
      const evmBytes = hexToU8a(evmAddress);

      // Pad to 32 bytes (AccountId32 format)
      // EVM addresses are 20 bytes, we need 32 bytes for Substrate
      const paddedBytes = new Uint8Array(32);
      paddedBytes.set(evmBytes, 0); // Copy EVM bytes to start
      // Remaining 12 bytes stay as zeros

      // Encode with SS58 format
      return encodeAddress(paddedBytes, ss58Prefix);
    } catch (error) {
      throw new Error(`Failed to convert EVM address to Substrate: ${error}`);
    }
  }

  /**
   * Get Substrate SS58 address
   */
  toSubstrate(): string {
    return this.substrateAddress;
  }

  /**
   * Get EVM H160 address
   */
  toEvm(): string {
    return this.evmAddress;
  }

  /**
   * Get both addresses
   */
  getBoth(): { substrate: string; evm: string } {
    return {
      substrate: this.substrateAddress,
      evm: this.evmAddress,
    };
  }

  /**
   * Check if two unified addresses are equal
   */
  equals(other: UnifiedAddress): boolean {
    return this.evmAddress === other.evmAddress;
  }

  /**
   * String representation
   */
  toString(): string {
    return `UnifiedAddress(substrate: ${this.substrateAddress}, evm: ${this.evmAddress})`;
  }
}

/**
 * Unified Account Manager
 * Manages account operations across both Substrate and EVM layers
 */
export class UnifiedAccountManager {
  private api: ApiPromise;
  private ss58Prefix: number;

  constructor(api: ApiPromise, ss58Prefix: number = 204) {
    this.api = api;
    this.ss58Prefix = ss58Prefix;
  }

  /**
   * Create a unified address from any format
   */
  createAddress(address: string): UnifiedAddress {
    return new UnifiedAddress(address, this.ss58Prefix);
  }

  /**
   * Convert Substrate address to EVM address
   */
  substrateToEvm(substrateAddress: string): string {
    const unified = new UnifiedAddress(substrateAddress, this.ss58Prefix);
    return unified.toEvm();
  }

  /**
   * Convert EVM address to Substrate address
   */
  evmToSubstrate(evmAddress: string): string {
    const unified = new UnifiedAddress(evmAddress, this.ss58Prefix);
    return unified.toSubstrate();
  }

  /**
   * Get unified balance for an address (both Substrate and EVM)
   * @param address - Either Substrate or EVM address
   * @returns Combined balance information
   */
  async getUnifiedBalance(address: string): Promise<{
    substrate: { free: string; reserved: string; frozen: string };
    evm: string;
    total: string;
  }> {
    const unified = new UnifiedAddress(address, this.ss58Prefix);

    // Query Substrate balance
    const substrateAccount = await this.api.query.system.account(unified.toSubstrate());
    const substrateData = (substrateAccount as any).data;

    const substrateFree = substrateData.free?.toString() || '0';
    const substrateReserved = substrateData.reserved?.toString() || '0';
    const substrateFrozen = substrateData.frozen?.toString() || '0';

    // Query EVM balance (if EVM pallet available)
    let evmBalance = '0';
    try {
      if (this.api.query.evm && this.api.query.evm.accounts) {
        const evmAccount = await this.api.query.evm.accounts(unified.toEvm());
        if (evmAccount && (evmAccount as any).isSome) {
          const evmData = (evmAccount as any).unwrap();
          evmBalance = evmData.balance?.toString() || '0';
        }
      }
    } catch (error) {
      // EVM pallet might not be available
      console.warn('EVM balance query failed:', error);
    }

    // Calculate total (Substrate free + EVM)
    const { BN } = require('@polkadot/util');
    const total = new BN(substrateFree).add(new BN(evmBalance)).toString();

    return {
      substrate: {
        free: substrateFree,
        reserved: substrateReserved,
        frozen: substrateFrozen,
      },
      evm: evmBalance,
      total,
    };
  }

  /**
   * Check if an address has both Substrate and EVM balances
   */
  async hasUnifiedBalance(address: string): Promise<boolean> {
    const balances = await this.getUnifiedBalance(address);
    const { BN } = require('@polkadot/util');

    const substrateHasBalance = new BN(balances.substrate.free).gt(new BN(0));
    const evmHasBalance = new BN(balances.evm).gt(new BN(0));

    return substrateHasBalance && evmHasBalance;
  }

  /**
   * Validate address format (either Substrate or EVM)
   */
  validateAddress(address: string): { valid: boolean; type: 'substrate' | 'evm' | 'invalid' } {
    // Check for empty or null address
    if (!address || address.trim() === '') {
      return { valid: false, type: 'invalid' };
    }

    // Check if EVM address
    if (/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return { valid: true, type: 'evm' };
    }

    // Check if Substrate address
    try {
      decodeAddress(address);
      return { valid: true, type: 'substrate' };
    } catch {
      return { valid: false, type: 'invalid' };
    }
  }

  /**
   * Batch convert multiple addresses
   */
  batchConvert(addresses: string[], toFormat: 'evm' | 'substrate'): string[] {
    return addresses.map((addr) => {
      const unified = new UnifiedAddress(addr, this.ss58Prefix);
      return toFormat === 'evm' ? unified.toEvm() : unified.toSubstrate();
    });
  }

  /**
   * Query on-chain mapping: EVM address -> Substrate address
   * @param evmAddress - EVM address to look up
   * @returns Substrate address if mapping exists, null otherwise
   */
  async getSubstrateAddressFromMapping(evmAddress: string): Promise<string | null> {
    try {
      if (!this.api.query.unifiedAccounts || !this.api.query.unifiedAccounts.evmToNative) {
        console.warn('UnifiedAccounts pallet not available');
        return null;
      }

      const result = await this.api.query.unifiedAccounts.evmToNative(evmAddress);
      if (result && 'isSome' in result && (result as any).isSome) {
        return (result as any).unwrap().toString();
      }
      return null;
    } catch (error) {
      console.error('Error querying EVM->Substrate mapping:', error);
      return null;
    }
  }

  /**
   * Query on-chain mapping: Substrate address -> EVM address
   * @param substrateAddress - Substrate address to look up
   * @returns EVM address if mapping exists, null otherwise
   */
  async getEvmAddressFromMapping(substrateAddress: string): Promise<string | null> {
    try {
      if (!this.api.query.unifiedAccounts || !this.api.query.unifiedAccounts.nativeToEvm) {
        console.warn('UnifiedAccounts pallet not available');
        return null;
      }

      const result = await this.api.query.unifiedAccounts.nativeToEvm(substrateAddress);
      if (result && 'isSome' in result && (result as any).isSome) {
        const h160 = (result as any).unwrap();
        return h160.toString();
      }
      return null;
    } catch (error) {
      console.error('Error querying Substrate->EVM mapping:', error);
      return null;
    }
  }

  /**
   * Check if an address has an on-chain mapping
   * @param address - Either Substrate or EVM address
   */
  async hasMappingOnChain(address: string): Promise<boolean> {
    const isEvm = /^0x[0-9a-fA-F]{40}$/.test(address);

    if (isEvm) {
      const substrate = await this.getSubstrateAddressFromMapping(address);
      return substrate !== null;
    } else {
      const evm = await this.getEvmAddressFromMapping(address);
      return evm !== null;
    }
  }

  /**
   * Claim default EVM address for current signer
   * Creates on-chain mapping between signer's Substrate account and its default EVM address
   * WARNING: Once claimed, mapping cannot be changed
   */
  async claimDefaultEvmAddress(signer: any) {
    if (!this.api.tx.unifiedAccounts || !this.api.tx.unifiedAccounts.claimDefaultEvmAddress) {
      throw new Error('UnifiedAccounts pallet not available');
    }

    const tx = this.api.tx.unifiedAccounts.claimDefaultEvmAddress();

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, events, dispatchError }: any) => {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
            const { docs, name, section } = decoded;
            reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        }

        if (status.isInBlock || status.isFinalized) {
          const claimed = events.find(
            (e: any) =>
              e.event.section === 'unifiedAccounts' && e.event.method === 'AccountClaimed',
          );

          if (claimed) {
            const [accountId, evmAddress] = claimed.event.data;
            resolve({
              accountId: accountId.toString(),
              evmAddress: evmAddress.toString(),
              blockHash: status.asInBlock || status.asFinalized,
            });
          } else {
            reject(new Error('AccountClaimed event not found'));
          }
        }
      });
    });
  }

  /**
   * Claim specific EVM address with signature proof
   * Creates on-chain mapping between signer's Substrate account and provided EVM address
   *
   * @param signer - Substrate signer
   * @param evmAddress - EVM address to claim (must be controlled by user)
   * @param evmSignature - EIP-712 signature from EVM address proving ownership
   *
   * WARNING:
   * - Transfer any XC20/staking rewards from EVM address before claiming
   * - Once claimed, mapping cannot be changed
   *
   * To generate signature:
   * 1. Get signing payload: await manager.buildSigningPayload(substrateAddress)
   * 2. Sign with EVM wallet (MetaMask): await ethereum.request({ method: 'personal_sign', params: [payload, evmAddress] })
   * 3. Pass resulting signature to this method
   */
  async claimEvmAddress(signer: any, evmAddress: string, evmSignature: string) {
    if (!this.api.tx.unifiedAccounts || !this.api.tx.unifiedAccounts.claimEvmAddress) {
      throw new Error('UnifiedAccounts pallet not available');
    }

    // Convert hex signature to bytes array [u8; 65]
    const sigBytes = evmSignature.startsWith('0x') ? evmSignature.slice(2) : evmSignature;
    if (sigBytes.length !== 130) {
      throw new Error('Invalid signature format: expected 65 bytes (130 hex chars)');
    }

    const tx = this.api.tx.unifiedAccounts.claimEvmAddress(evmAddress, `0x${sigBytes}`);

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, events, dispatchError }: any) => {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
            const { docs, name, section } = decoded;
            reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        }

        if (status.isInBlock || status.isFinalized) {
          const claimed = events.find(
            (e: any) =>
              e.event.section === 'unifiedAccounts' && e.event.method === 'AccountClaimed',
          );

          if (claimed) {
            const [accountId, claimedEvmAddress] = claimed.event.data;
            resolve({
              accountId: accountId.toString(),
              evmAddress: claimedEvmAddress.toString(),
              blockHash: status.asInBlock || status.asFinalized,
            });
          } else {
            reject(new Error('AccountClaimed event not found'));
          }
        }
      });
    });
  }

  /**
   * Build EIP-712 signing payload for claiming EVM address
   * User must sign this with their EVM wallet to prove ownership
   *
   * @param substrateAddress - Substrate address that will claim the EVM address
   * @returns Hex string to be signed by EVM wallet
   */
  async buildSigningPayload(substrateAddress: string): Promise<string> {
    // This should match the Rust implementation's build_signing_payload
    // For now, return a placeholder that indicates this needs EIP-712 structure
    const { keccak256 } = require('@ethersproject/keccak256');
    const { defaultAbiCoder } = require('@ethersproject/abi');
    const { decodeAddress } = require('@polkadot/util-crypto');

    // EIP-712 Domain Separator (must match Rust implementation)
    const domain = {
      name: 'Selendra EVM Claim',
      version: '1',
      chainId: 1961, // Selendra mainnet chain ID
      verifyingContract: '0x0000000000000000000000000000000000000000',
    };

    const domainSeparator = keccak256(
      defaultAbiCoder.encode(
        ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
        [
          keccak256(
            Buffer.from(
              'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)',
            ),
          ),
          keccak256(Buffer.from(domain.name)),
          keccak256(Buffer.from(domain.version)),
          domain.chainId,
          domain.verifyingContract,
        ],
      ),
    );

    // Type hash for claim message
    const typeHash = keccak256(Buffer.from('ClaimEvmAddress(bytes32 substrateAddress)'));

    // Hash of substrate address (AccountId)
    const substrateBytes = decodeAddress(substrateAddress);
    const argsHash = keccak256(
      defaultAbiCoder.encode(['bytes32', 'bytes32'], [typeHash, keccak256(substrateBytes)]),
    );

    // Final payload: \x19\x01 + domain separator + args hash
    const payload = Buffer.concat([
      Buffer.from('1901', 'hex'), // \x19\x01
      Buffer.from(domainSeparator.slice(2), 'hex'),
      Buffer.from(argsHash.slice(2), 'hex'),
    ]);

    return '0x' + keccak256(payload).slice(2);
  }
}

/**
 * Utility functions for address conversion
 */
export const UnifiedAccountUtils = {
  /**
   * Quick conversion from Substrate to EVM
   */
  toEvm(substrateAddress: string, ss58Prefix: number = 204): string {
    return new UnifiedAddress(substrateAddress, ss58Prefix).toEvm();
  },

  /**
   * Quick conversion from EVM to Substrate
   */
  toSubstrate(evmAddress: string, ss58Prefix: number = 204): string {
    return new UnifiedAddress(evmAddress, ss58Prefix).toSubstrate();
  },

  /**
   * Check if address is EVM format
   */
  isEvmAddress(address: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  },

  /**
   * Check if address is Substrate format
   */
  isSubstrateAddress(address: string): boolean {
    try {
      decodeAddress(address);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Normalize address to checksummed format
   */
  normalizeAddress(address: string, ss58Prefix: number = 204): string {
    if (UnifiedAccountUtils.isEvmAddress(address)) {
      return address.toLowerCase();
    }
    // Re-encode to ensure correct SS58 prefix
    const decoded = decodeAddress(address);
    return encodeAddress(decoded, ss58Prefix);
  },
};
