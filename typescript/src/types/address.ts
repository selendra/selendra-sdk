/**
 * Address-related types and utilities for the Selendra SDK
 */

import type { Address, SubstrateAddress, EvmAddress } from './common';

/**
 * Address format enumeration
 */
export enum AddressFormat {
  SS58 = 'ss58',
  HEX = 'hex',
  ETHEREUM = 'ethereum',
  BECH32 = 'bech32'
}

/**
 * Address type enumeration
 */
export enum AddressType {
  SUBSTRATE = 'substrate',
  EVM = 'evm',
  UNIFIED = 'unified'
}

/**
 * Address validation result
 */
export interface AddressValidationResult {
  /** Whether address is valid */
  isValid: boolean;
  /** Address type */
  type?: AddressType;
  /** Address format */
  format?: AddressFormat;
  /** Error message if invalid */
  error?: string;
  /** Normalized address */
  normalized?: Address;
}

/**
 * Address conversion options
 */
export interface AddressConversionOptions {
  /** Target format */
  format?: AddressFormat;
  /** SS58 prefix for Substrate addresses */
  ss58Prefix?: number;
  /** Whether to preserve checksums */
  preserveChecksum?: boolean;
}

/**
 * Address information
 */
export interface AddressInfo {
  /** Original address */
  address: Address;
  /** Address type */
  type: AddressType;
  /** Address format */
  format: AddressFormat;
  /** Whether address is valid */
  isValid: boolean;
  /** Network-specific information */
  networkInfo?: {
    /** SS58 prefix for Substrate */
    ss58Prefix?: number;
    /** Chain ID for EVM */
    chainId?: number;
    /** Whether address is a contract */
    isContract?: boolean;
  };
  /** Address metadata */
  metadata?: AddressMetadata;
}

/**
 * Address metadata
 */
export interface AddressMetadata {
  /** Address label or name */
  label?: string;
  /** Address description */
  description?: string;
  /** Whether address is bookmarked */
  isBookmarked?: boolean;
  /** Tags associated with address */
  tags?: string[];
  /** Creation timestamp */
  createdAt?: number;
  /** Last updated timestamp */
  updatedAt?: number;
}

/**
 * Address book entry
 */
export interface AddressBookEntry extends AddressMetadata {
  /** Address */
  address: Address;
  /** Entry ID */
  id: string;
  /** Entry type */
  entryType: 'contact' | 'contract' | 'own' | 'watchlist';
  /** Network ID */
  networkId?: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * Multi-signature address configuration
 */
export interface MultiSigAddressConfig {
  /** Signer addresses */
  signatories: Address[];
  /** Number of required signatures */
  threshold: number;
  /** Multi-signuration type */
  type: 'all' | 'any' | 'threshold';
}

/**
 * Proxy address configuration
 */
export interface ProxyAddressConfig {
  /** Proxy address */
  proxy: Address;
  /** Real address */
  real: Address;
  /** Proxy type */
  type: ProxyType;
  /** Delay in blocks */
  delay?: number;
}

/**
 * Proxy type enumeration
 */
export enum ProxyType {
  ANY = 'Any',
  NON_TRANSFER = 'NonTransfer',
  GOVERNANCE = 'Governance',
  STAKING = 'Staking',
  CANCEL_PROXY = 'CancelProxy',
  BALANCE_TRANSFER = 'BalanceTransfer',
  AUTHOR_MAPPING = 'AuthorMapping',
  IDENTITY_JUDGEMENT = 'IdentityJudgement',
  AUCTION = 'Auction'
}

/**
 * Address validation patterns
 */
export const ADDRESS_PATTERNS = {
  /** EVM address pattern (42 characters, starting with 0x) */
  EVM: /^0x[a-fA-F0-9]{40}$/,
  /** Hex address pattern (64 characters, starting with 0x) */
  HEX: /^0x[a-fA-F0-9]{64}$/,
  /** SS58 address pattern (1, 3, 6, or 7 bytes plus checksum) */
  SS58: /^[1-9A-HJ-NP-Za-km-z]{1,}$/
} as const;

/**
 * SS58 prefix registry for known networks
 */
export const SS58_PREFIXES = {
  /** Polkadot */
  POLKADOT: 0,
  /** Kusama */
  KUSAMA: 2,
  /** Westend */
  WESTEND: 42,
  /** Rococo */
  ROCOCO: 42,
  /** Selendra */
  SELENDRA: 42,
  /** Generic substrate prefix */
  GENERIC: 42,
  /** Bitcoin */
  BITCOIN: 0,
  /** Ethereum */
  ETHEREUM: 42
} as const;

/**
 * Address utility functions
 */
export class AddressUtils {
  /**
   * Validate an address
   */
  static validate(address: Address): AddressValidationResult {
    if (!address || typeof address !== 'string') {
      return {
        isValid: false,
        error: 'Address must be a non-empty string'
      };
    }

    // Check EVM address format
    if (ADDRESS_PATTERNS.EVM.test(address)) {
      return {
        isValid: true,
        type: AddressType.EVM,
        format: AddressFormat.ETHEREUM,
        normalized: address.toLowerCase()
      };
    }

    // Check hex address format
    if (ADDRESS_PATTERNS.HEX.test(address)) {
      return {
        isValid: true,
        type: AddressType.SUBSTRATE,
        format: AddressFormat.HEX,
        normalized: address
      };
    }

    // Check SS58 address format
    if (ADDRESS_PATTERNS.SS58.test(address)) {
      try {
        // Additional validation would be done with @polkadot/util-crypto
        return {
          isValid: true,
          type: AddressType.SUBSTRATE,
          format: AddressFormat.SS58,
          normalized: address
        };
      } catch {
        return {
          isValid: false,
          error: 'Invalid SS58 address format'
        };
      }
    }

    return {
      isValid: false,
      error: 'Unrecognized address format'
    };
  }

  /**
   * Convert address between formats
   */
  static convert(
    address: Address,
    options: AddressConversionOptions = {}
  ): string | never {
    const validation = this.validate(address);

    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid address');
    }

    const { format, ss58Prefix = 42 } = options;

    switch (format) {
      case AddressFormat.ETHEREUM:
        if (validation.type === AddressType.EVM) {
          return address.toLowerCase();
        }
        // Convert Substrate to EVM (would need actual implementation)
        throw new Error('Conversion from Substrate to EVM not implemented');

      case AddressFormat.HEX:
        if (validation.format === AddressFormat.HEX) {
          return address;
        }
        // Convert SS58 to HEX (would need actual implementation)
        throw new Error('Conversion from SS58 to HEX not implemented');

      case AddressFormat.SS58:
        if (validation.format === AddressFormat.SS58) {
          return address;
        }
        // Convert HEX to SS58 (would need actual implementation)
        throw new Error('Conversion from HEX to SS58 not implemented');

      default:
        return validation.normalized || address;
    }
  }

  /**
   * Check if two addresses are equivalent
   */
  static areEqual(address1: Address, address2: Address): boolean {
    try {
      const normalized1 = this.convert(address1);
      const normalized2 = this.convert(address2);
      return normalized1.toLowerCase() === normalized2.toLowerCase();
    } catch {
      return false;
    }
  }

  /**
   * Get address information
   */
  static getInfo(address: Address): AddressInfo {
    const validation = this.validate(address);

    return {
      address,
      type: validation.type || AddressType.UNIFIED,
      format: validation.format || AddressFormat.HEX,
      isValid: validation.isValid
    };
  }

  /**
   * Format address for display
   */
  static formatForDisplay(
    address: Address,
    options: { maxLength?: number; prefixChars?: number; suffixChars?: number } = {}
  ): string {
    const { maxLength = 20, prefixChars = 6, suffixChars = 4 } = options;

    if (address.length <= maxLength) {
      return address;
    }

    const prefix = address.slice(0, prefixChars);
    const suffix = address.slice(-suffixChars);
    return `${prefix}...${suffix}`;
  }
}