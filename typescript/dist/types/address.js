"use strict";
/**
 * Address-related types and utilities for the Selendra SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressUtils = exports.SS58_PREFIXES = exports.ADDRESS_PATTERNS = exports.ProxyType = exports.AddressType = exports.AddressFormat = void 0;
/**
 * Address format enumeration
 */
var AddressFormat;
(function (AddressFormat) {
    AddressFormat["SS58"] = "ss58";
    AddressFormat["HEX"] = "hex";
    AddressFormat["ETHEREUM"] = "ethereum";
    AddressFormat["BECH32"] = "bech32";
})(AddressFormat || (exports.AddressFormat = AddressFormat = {}));
/**
 * Address type enumeration
 */
var AddressType;
(function (AddressType) {
    AddressType["SUBSTRATE"] = "substrate";
    AddressType["EVM"] = "evm";
    AddressType["UNIFIED"] = "unified";
})(AddressType || (exports.AddressType = AddressType = {}));
/**
 * Proxy type enumeration
 */
var ProxyType;
(function (ProxyType) {
    ProxyType["ANY"] = "Any";
    ProxyType["NON_TRANSFER"] = "NonTransfer";
    ProxyType["GOVERNANCE"] = "Governance";
    ProxyType["STAKING"] = "Staking";
    ProxyType["CANCEL_PROXY"] = "CancelProxy";
    ProxyType["BALANCE_TRANSFER"] = "BalanceTransfer";
    ProxyType["AUTHOR_MAPPING"] = "AuthorMapping";
    ProxyType["IDENTITY_JUDGEMENT"] = "IdentityJudgement";
    ProxyType["AUCTION"] = "Auction";
})(ProxyType || (exports.ProxyType = ProxyType = {}));
/**
 * Address validation patterns
 */
exports.ADDRESS_PATTERNS = {
    /** EVM address pattern (42 characters, starting with 0x) */
    EVM: /^0x[a-fA-F0-9]{40}$/,
    /** Hex address pattern (64 characters, starting with 0x) */
    HEX: /^0x[a-fA-F0-9]{64}$/,
    /** SS58 address pattern (1, 3, 6, or 7 bytes plus checksum) */
    SS58: /^[1-9A-HJ-NP-Za-km-z]{1,}$/
};
/**
 * SS58 prefix registry for known networks
 */
exports.SS58_PREFIXES = {
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
};
/**
 * Address utility functions
 */
class AddressUtils {
    /**
     * Validate an address
     */
    static validate(address) {
        if (!address || typeof address !== 'string') {
            return {
                isValid: false,
                error: 'Address must be a non-empty string'
            };
        }
        // Check EVM address format
        if (exports.ADDRESS_PATTERNS.EVM.test(address)) {
            return {
                isValid: true,
                type: AddressType.EVM,
                format: AddressFormat.ETHEREUM,
                normalized: address.toLowerCase()
            };
        }
        // Check hex address format
        if (exports.ADDRESS_PATTERNS.HEX.test(address)) {
            return {
                isValid: true,
                type: AddressType.SUBSTRATE,
                format: AddressFormat.HEX,
                normalized: address
            };
        }
        // Check SS58 address format
        if (exports.ADDRESS_PATTERNS.SS58.test(address)) {
            try {
                // Additional validation would be done with @polkadot/util-crypto
                return {
                    isValid: true,
                    type: AddressType.SUBSTRATE,
                    format: AddressFormat.SS58,
                    normalized: address
                };
            }
            catch {
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
    static convert(address, options = {}) {
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
    static areEqual(address1, address2) {
        try {
            const normalized1 = this.convert(address1);
            const normalized2 = this.convert(address2);
            return normalized1.toLowerCase() === normalized2.toLowerCase();
        }
        catch {
            return false;
        }
    }
    /**
     * Get address information
     */
    static getInfo(address) {
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
    static formatForDisplay(address, options = {}) {
        const { maxLength = 20, prefixChars = 6, suffixChars = 4 } = options;
        if (address.length <= maxLength) {
            return address;
        }
        const prefix = address.slice(0, prefixChars);
        const suffix = address.slice(-suffixChars);
        return `${prefix}...${suffix}`;
    }
}
exports.AddressUtils = AddressUtils;
//# sourceMappingURL=address.js.map