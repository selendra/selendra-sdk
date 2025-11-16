"use strict";
/**
 * Signature-related types and utilities for the Selendra SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureUtils = exports.SignatureFormat = exports.SignatureAlgorithm = void 0;
/**
 * Signature algorithm enumeration
 */
var SignatureAlgorithm;
(function (SignatureAlgorithm) {
    /** ECDSA with secp256k1 curve (Ethereum) */
    SignatureAlgorithm["ECDSA_SECP256K1"] = "ecdsa_secp256k1";
    /** EdDSA with Ed25519 curve (Substrate) */
    SignatureAlgorithm["EDDSA_ED25519"] = "eddsa_ed25519";
    /** EdDSA with Sr25519 curve (Substrate) */
    SignatureAlgorithm["EDDSA_SR25519"] = "eddsa_sr25519";
    /** Schnorr signatures */
    SignatureAlgorithm["SCHNORR"] = "schnorr";
    /** BLS signatures */
    SignatureAlgorithm["BLS"] = "bls";
})(SignatureAlgorithm || (exports.SignatureAlgorithm = SignatureAlgorithm = {}));
/**
 * Signature format enumeration
 */
var SignatureFormat;
(function (SignatureFormat) {
    /** DER encoded signature */
    SignatureFormat["DER"] = "der";
    /** Compact/IEEE P1363 format */
    SignatureFormat["COMPACT"] = "compact";
    /** Raw signature (r || s) */
    SignatureFormat["RAW"] = "raw";
    /** Base64 encoded */
    SignatureFormat["BASE64"] = "base64";
    /** Hexadecimal */
    SignatureFormat["HEX"] = "hex";
})(SignatureFormat || (exports.SignatureFormat = SignatureFormat = {}));
/**
 * Signature utility functions
 */
class SignatureUtils {
    /**
     * Validate a signature
     */
    static validate(signature, algorithm) {
        if (!signature || typeof signature !== 'string') {
            return false;
        }
        switch (algorithm) {
            case SignatureAlgorithm.ECDSA_SECP256K1:
                // 65 bytes: 32 for r, 32 for s, 1 for v
                return this.isHexSignature(signature, 130);
            case SignatureAlgorithm.EDDSA_ED25519:
                // 64 bytes for Ed25519
                return this.isHexSignature(signature, 128);
            case SignatureAlgorithm.EDDSA_SR25519:
                // 64 bytes for Sr25519
                return this.isHexSignature(signature, 128);
            case SignatureAlgorithm.SCHNORR:
                // 64 bytes for Schnorr
                return this.isHexSignature(signature, 128);
            case SignatureAlgorithm.BLS:
                // 48 bytes for compressed BLS signature
                return this.isHexSignature(signature, 96) || this.isHexSignature(signature, 192);
            default:
                return false;
        }
    }
    /**
     * Create signature from components
     */
    static create(signature, algorithm, options = {}) {
        const { format = SignatureFormat.HEX, includeMetadata = true } = options;
        // Normalize signature format
        const normalizedSignature = this.normalizeSignature(signature, format);
        const sig = {
            signature: normalizedSignature,
            algorithm,
            format,
            metadata: includeMetadata ? {
                createdAt: Date.now(),
                version: 1,
                chainId: options.chainId,
                nonce: options.nonce
            } : undefined
        };
        return sig;
    }
    /**
     * Verify signature
     */
    static async verify(signature, message, expectedSigner) {
        try {
            // This would use appropriate crypto libraries for verification
            // This is a placeholder implementation
            const isValid = await this.verifyWithAlgorithm(signature.signature, message, signature.algorithm, signature.publicKey);
            let signer;
            if (isValid && signature.publicKey) {
                // Recover signer from public key
                signer = await this.recoverAddress(signature.publicKey, signature.algorithm);
            }
            // Check if signer matches expected signer
            if (expectedSigner && signer && !this.areAddressesEqual(signer, expectedSigner)) {
                return {
                    isValid: false,
                    error: 'Signer address does not match expected signer',
                    verifiedAt: Date.now()
                };
            }
            return {
                isValid: true,
                signer,
                verifiedAt: Date.now()
            };
        }
        catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Unknown verification error',
                verifiedAt: Date.now()
            };
        }
    }
    /**
     * Create multi-signature
     */
    static async createMultiSignature(signatures, config) {
        if (signatures.length < config.threshold) {
            throw new Error(`Insufficient signatures: ${signatures.length} < ${config.threshold}`);
        }
        // Validate all signatures
        for (const sig of signatures) {
            if (sig.algorithm !== config.algorithm) {
                throw new Error('All signatures must use the same algorithm');
            }
        }
        // Combine signatures (algorithm-specific)
        const combinedSignature = await this.combineSignatures(signatures, config.algorithm);
        return {
            signature: combinedSignature,
            signatures,
            config,
            createdAt: Date.now()
        };
    }
    /**
     * Verify multi-signature
     */
    static async verifyMultiSignature(multiSignature, message) {
        try {
            // Verify individual signatures
            let validSignatures = 0;
            const verifiedSigners = [];
            for (const signature of multiSignature.signatures) {
                const verification = await this.verify(signature, message);
                if (verification.isValid && verification.signer) {
                    validSignatures++;
                    verifiedSigners.push(verification.signer);
                }
            }
            // Check threshold
            const thresholdMet = validSignatures >= multiSignature.config.threshold;
            // Check if signers are authorized
            const authorizedSigners = new Set(multiSignature.config.signers);
            const allSignersAuthorized = verifiedSigners.every(signer => authorizedSigners.has(signer));
            return {
                isValid: thresholdMet && allSignersAuthorized,
                signer: undefined, // Multiple signers
                verifiedAt: Date.now()
            };
        }
        catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Unknown multi-signature verification error',
                verifiedAt: Date.now()
            };
        }
    }
    /**
     * Convert signature to different format
     */
    static convertFormat(signature, fromFormat, toFormat) {
        if (fromFormat === toFormat) {
            return signature;
        }
        // Convert to bytes first
        let signatureBytes;
        switch (fromFormat) {
            case SignatureFormat.HEX:
                signatureBytes = this.hexToBytes(signature);
                break;
            case SignatureFormat.BASE64:
                signatureBytes = this.base64ToBytes(signature);
                break;
            default:
                throw new Error(`Unsupported source format: ${fromFormat}`);
        }
        // Convert to target format
        switch (toFormat) {
            case SignatureFormat.HEX:
                return this.bytesToHex(signatureBytes);
            case SignatureFormat.BASE64:
                return this.bytesToBase64(signatureBytes);
            default:
                throw new Error(`Unsupported target format: ${toFormat}`);
        }
    }
    // Helper methods
    static isHexSignature(signature, expectedLength) {
        return signature.startsWith('0x') && signature.length === expectedLength;
    }
    static normalizeSignature(signature, format) {
        switch (format) {
            case SignatureFormat.HEX:
                return signature.startsWith('0x') ? signature.toLowerCase() : `0x${signature.toLowerCase()}`;
            case SignatureFormat.BASE64:
                return signature;
            default:
                return signature;
        }
    }
    static async verifyWithAlgorithm(signature, message, algorithm, publicKey) {
        // Placeholder for actual verification implementation
        // Would use appropriate crypto libraries
        return false;
    }
    static async recoverAddress(publicKey, algorithm) {
        // Placeholder for address recovery from public key
        // Would use appropriate crypto libraries
        return '';
    }
    static areAddressesEqual(address1, address2) {
        return address1.toLowerCase() === address2.toLowerCase();
    }
    static async combineSignatures(signatures, algorithm) {
        // Placeholder for signature combination
        // Would be algorithm-specific implementation
        return '';
    }
    static hexToBytes(hex) {
        const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
        return new Uint8Array(cleanHex.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);
    }
    static bytesToHex(bytes) {
        return `0x${Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')}`;
    }
    static base64ToBytes(base64) {
        return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    }
    static bytesToBase64(bytes) {
        return btoa(String.fromCharCode(...bytes));
    }
}
exports.SignatureUtils = SignatureUtils;
//# sourceMappingURL=signature.js.map