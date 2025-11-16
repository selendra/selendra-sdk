/**
 * Address-related types and utilities for the Selendra SDK
 */
import type { Address } from './common';
/**
 * Address format enumeration
 */
export declare enum AddressFormat {
    SS58 = "ss58",
    HEX = "hex",
    ETHEREUM = "ethereum",
    BECH32 = "bech32"
}
/**
 * Address type enumeration
 */
export declare enum AddressType {
    SUBSTRATE = "substrate",
    EVM = "evm",
    UNIFIED = "unified"
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
export declare enum ProxyType {
    ANY = "Any",
    NON_TRANSFER = "NonTransfer",
    GOVERNANCE = "Governance",
    STAKING = "Staking",
    CANCEL_PROXY = "CancelProxy",
    BALANCE_TRANSFER = "BalanceTransfer",
    AUTHOR_MAPPING = "AuthorMapping",
    IDENTITY_JUDGEMENT = "IdentityJudgement",
    AUCTION = "Auction"
}
/**
 * Address validation patterns
 */
export declare const ADDRESS_PATTERNS: {
    /** EVM address pattern (42 characters, starting with 0x) */
    readonly EVM: RegExp;
    /** Hex address pattern (64 characters, starting with 0x) */
    readonly HEX: RegExp;
    /** SS58 address pattern (1, 3, 6, or 7 bytes plus checksum) */
    readonly SS58: RegExp;
};
/**
 * SS58 prefix registry for known networks
 */
export declare const SS58_PREFIXES: {
    /** Polkadot */
    readonly POLKADOT: 0;
    /** Kusama */
    readonly KUSAMA: 2;
    /** Westend */
    readonly WESTEND: 42;
    /** Rococo */
    readonly ROCOCO: 42;
    /** Selendra */
    readonly SELENDRA: 42;
    /** Generic substrate prefix */
    readonly GENERIC: 42;
    /** Bitcoin */
    readonly BITCOIN: 0;
    /** Ethereum */
    readonly ETHEREUM: 42;
};
/**
 * Address utility functions
 */
export declare class AddressUtils {
    /**
     * Validate an address
     */
    static validate(address: Address): AddressValidationResult;
    /**
     * Convert address between formats
     */
    static convert(address: Address, options?: AddressConversionOptions): string | never;
    /**
     * Check if two addresses are equivalent
     */
    static areEqual(address1: Address, address2: Address): boolean;
    /**
     * Get address information
     */
    static getInfo(address: Address): AddressInfo;
    /**
     * Format address for display
     */
    static formatForDisplay(address: Address, options?: {
        maxLength?: number;
        prefixChars?: number;
        suffixChars?: number;
    }): string;
}
//# sourceMappingURL=address.d.ts.map