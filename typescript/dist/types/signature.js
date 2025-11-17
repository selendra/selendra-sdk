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
                // 65 bytes: 32 for r, 32 for s, 1 for v (130 hex chars + 0x prefix = 132 total)
                return this.isHexSignature(signature, 132);
            case SignatureAlgorithm.EDDSA_ED25519:
                // 64 bytes for Ed25519 (128 hex chars + 0x prefix = 130 total)
                return this.isHexSignature(signature, 130);
            case SignatureAlgorithm.EDDSA_SR25519:
                // 64 bytes for Sr25519 (128 hex chars + 0x prefix = 130 total)
                return this.isHexSignature(signature, 130);
            case SignatureAlgorithm.SCHNORR:
                // 64 bytes for Schnorr (128 hex chars + 0x prefix = 130 total)
                return this.isHexSignature(signature, 130);
            case SignatureAlgorithm.BLS:
                // 48 bytes for compressed BLS signature (96 hex chars + 0x prefix = 98 total) or 96 bytes (192 hex chars + 0x prefix = 194 total)
                return this.isHexSignature(signature, 98) || this.isHexSignature(signature, 194);
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
            metadata: includeMetadata
                ? {
                    createdAt: Date.now(),
                    version: 1,
                    chainId: options.chainId,
                    nonce: options.nonce,
                }
                : undefined,
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
                    verifiedAt: Date.now(),
                };
            }
            return {
                isValid: true,
                signer,
                verifiedAt: Date.now(),
            };
        }
        catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Unknown verification error',
                verifiedAt: Date.now(),
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
            createdAt: Date.now(),
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
            const allSignersAuthorized = verifiedSigners.every((signer) => authorizedSigners.has(signer));
            return {
                isValid: thresholdMet && allSignersAuthorized,
                signer: undefined, // Multiple signers
                verifiedAt: Date.now(),
            };
        }
        catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Unknown multi-signature verification error',
                verifiedAt: Date.now(),
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
                return signature.startsWith('0x')
                    ? signature.toLowerCase()
                    : `0x${signature.toLowerCase()}`;
            case SignatureFormat.BASE64:
                return signature;
            default:
                return signature;
        }
    }
    /**
     * Verify signature using the appropriate algorithm
     *
     * @param signature - Signature to verify
     * @param message - Original message that was signed
     * @param algorithm - Signature algorithm used
     * @param publicKey - Public key of the signer
     * @returns Promise that resolves to true if signature is valid
     *
     * @remarks
     * This is a placeholder implementation that validates signature format.
     * For production use, integrate with appropriate cryptographic libraries:
     *
     * - **ECDSA (secp256k1)**: Use `ethers` or `@noble/secp256k1`
     * - **EdDSA (Ed25519)**: Use `@polkadot/util-crypto` or `@noble/ed25519`
     * - **EdDSA (Sr25519)**: Use `@polkadot/util-crypto`
     * - **Schnorr**: Use `@noble/secp256k1` with schnorr
     * - **BLS**: Use `@noble/bls12-381`
     *
     * @example
     * ```typescript
     * // Example with ethers for ECDSA verification
     * import { ethers } from 'ethers';
     *
     * const messageHash = ethers.hashMessage(message);
     * const recoveredAddress = ethers.recoverAddress(messageHash, signature);
     * const expectedAddress = ethers.computeAddress(publicKey);
     * return recoveredAddress === expectedAddress;
     * ```
     *
     * @example
     * ```typescript
     * // Example with Polkadot for Ed25519 verification
     * import { signatureVerify } from '@polkadot/util-crypto';
     *
     * const result = signatureVerify(message, signature, publicKey);
     * return result.isValid;
     * ```
     */
    static async verifyWithAlgorithm(signature, message, algorithm, publicKey) {
        // Validate signature format first
        if (!this.validate(signature, algorithm)) {
            return false;
        }
        // Check if public key is provided
        if (!publicKey) {
            console.warn('Public key not provided for signature verification');
            return false;
        }
        try {
            switch (algorithm) {
                case SignatureAlgorithm.ECDSA_SECP256K1:
                    // For ECDSA verification, we would use ethers or @noble/secp256k1
                    // Example implementation:
                    // const { ethers } = require('ethers');
                    // const messageHash = typeof message === 'string'
                    //   ? ethers.hashMessage(message)
                    //   : ethers.hashMessage(new Uint8Array(message));
                    // const recoveredAddress = ethers.recoverAddress(messageHash, signature);
                    // const expectedAddress = ethers.computeAddress(publicKey);
                    // return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
                    console.warn('ECDSA verification requires ethers library integration');
                    return false;
                case SignatureAlgorithm.EDDSA_ED25519:
                case SignatureAlgorithm.EDDSA_SR25519:
                    // For EdDSA verification, we would use @polkadot/util-crypto
                    // Example implementation:
                    // const { signatureVerify } = require('@polkadot/util-crypto');
                    // const result = signatureVerify(message, signature, publicKey);
                    // return result.isValid;
                    console.warn('EdDSA verification requires @polkadot/util-crypto integration');
                    return false;
                case SignatureAlgorithm.SCHNORR:
                    // For Schnorr verification, we would use @noble/secp256k1
                    // Example implementation:
                    // const { schnorr } = require('@noble/secp256k1');
                    // const msgBytes = typeof message === 'string'
                    //   ? new TextEncoder().encode(message)
                    //   : message;
                    // return await schnorr.verify(signature, msgBytes, publicKey);
                    console.warn('Schnorr verification requires @noble/secp256k1 integration');
                    return false;
                case SignatureAlgorithm.BLS:
                    // For BLS verification, we would use @noble/bls12-381
                    // Example implementation:
                    // const { verify } = require('@noble/bls12-381');
                    // const msgBytes = typeof message === 'string'
                    //   ? new TextEncoder().encode(message)
                    //   : message;
                    // return await verify(signature, msgBytes, publicKey);
                    console.warn('BLS verification requires @noble/bls12-381 integration');
                    return false;
                default:
                    console.warn(`Unsupported signature algorithm: ${algorithm}`);
                    return false;
            }
        }
        catch (error) {
            console.error('Signature verification error:', error);
            return false;
        }
    }
    /**
     * Recover address from public key
     *
     * @param publicKey - Public key as hex string
     * @param algorithm - Algorithm used to generate the key
     * @returns Address derived from the public key
     *
     * @remarks
     * For production use, integrate with appropriate cryptographic libraries:
     *
     * - **ECDSA (secp256k1)**: Use `ethers.computeAddress()` or equivalent
     * - **EdDSA (Ed25519/Sr25519)**: Use `@polkadot/util-crypto` address encoding
     *
     * @example
     * ```typescript
     * // ECDSA (Ethereum)
     * import { ethers } from 'ethers';
     * const address = ethers.computeAddress(publicKey);
     *
     * // EdDSA (Substrate)
     * import { encodeAddress } from '@polkadot/util-crypto';
     * import { hexToU8a } from '@polkadot/util';
     * const address = encodeAddress(hexToU8a(publicKey), 204);
     * ```
     */
    static async recoverAddress(publicKey, algorithm) {
        try {
            switch (algorithm) {
                case SignatureAlgorithm.ECDSA_SECP256K1:
                    // For Ethereum addresses
                    // const { ethers } = require('ethers');
                    // return ethers.computeAddress(publicKey);
                    console.warn('Address recovery for ECDSA requires ethers integration');
                    return '';
                case SignatureAlgorithm.EDDSA_ED25519:
                case SignatureAlgorithm.EDDSA_SR25519:
                    // For Substrate addresses
                    // const { encodeAddress } = require('@polkadot/util-crypto');
                    // const { hexToU8a } = require('@polkadot/util');
                    // return encodeAddress(hexToU8a(publicKey), 204);
                    console.warn('Address recovery for EdDSA requires @polkadot/util-crypto integration');
                    return '';
                default:
                    console.warn(`Address recovery not supported for algorithm: ${algorithm}`);
                    return '';
            }
        }
        catch (error) {
            console.error('Address recovery error:', error);
            return '';
        }
    }
    static areAddressesEqual(address1, address2) {
        return address1.toLowerCase() === address2.toLowerCase();
    }
    /**
     * Combine multiple signatures into a single multi-signature
     *
     * @param signatures - Array of individual signatures
     * @param algorithm - Algorithm used for signatures
     * @returns Combined multi-signature as hex string
     *
     * @remarks
     * Multi-signature combination is algorithm-specific:
     *
     * - **ECDSA**: Concatenate signatures or use threshold signature schemes
     * - **EdDSA**: Use Substrate's MultiSignature type
     * - **BLS**: Use signature aggregation (native BLS feature)
     * - **Schnorr**: Use MuSig or similar threshold signature protocol
     *
     * For production use, integrate with appropriate multi-signature libraries
     * based on your specific use case and security requirements.
     *
     * @example
     * ```typescript
     * // For Substrate multi-signature
     * // Signatures are typically combined at the extrinsic level
     * const multiSig = {
     *   threshold: 2,
     *   signatories: [...addresses],
     *   signatures: [...sigs]
     * };
     *
     * // For BLS signature aggregation
     * // const { aggregateSignatures } = require('@noble/bls12-381');
     * // const combined = await aggregateSignatures(signatures);
     * ```
     */
    static async combineSignatures(signatures, algorithm) {
        if (signatures.length === 0) {
            throw new Error('No signatures to combine');
        }
        try {
            switch (algorithm) {
                case SignatureAlgorithm.ECDSA_SECP256K1:
                    // ECDSA typically doesn't support native signature aggregation
                    // Instead, collect signatures for threshold verification
                    console.warn('ECDSA multi-signature requires threshold scheme implementation');
                    // For now, concatenate signatures (implementation-specific)
                    return signatures.map(s => s.signature).join('');
                case SignatureAlgorithm.EDDSA_ED25519:
                case SignatureAlgorithm.EDDSA_SR25519:
                    // For Substrate, multi-signatures are handled at the extrinsic level
                    console.warn('EdDSA multi-signature requires Substrate MultiSignature type');
                    return signatures.map(s => s.signature).join('');
                case SignatureAlgorithm.BLS:
                    // BLS supports native signature aggregation
                    // const { aggregateSignatures } = require('@noble/bls12-381');
                    // const sigBytes = signatures.map(s => s.signature);
                    // return await aggregateSignatures(sigBytes);
                    console.warn('BLS signature aggregation requires @noble/bls12-381 integration');
                    return signatures.map(s => s.signature).join('');
                case SignatureAlgorithm.SCHNORR:
                    // Schnorr supports MuSig and similar protocols
                    console.warn('Schnorr multi-signature requires MuSig implementation');
                    return signatures.map(s => s.signature).join('');
                default:
                    throw new Error(`Signature combination not supported for algorithm: ${algorithm}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to combine signatures: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    static hexToBytes(hex) {
        const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
        return new Uint8Array(cleanHex.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    }
    static bytesToHex(bytes) {
        return `0x${Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')}`;
    }
    static base64ToBytes(base64) {
        return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    }
    static bytesToBase64(bytes) {
        return btoa(String.fromCharCode(...Array.from(bytes)));
    }
}
exports.SignatureUtils = SignatureUtils;
//# sourceMappingURL=signature.js.map