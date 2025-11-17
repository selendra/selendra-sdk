/**
 * Signature-related types and utilities for the Selendra SDK
 */
import type { Hash, Address } from './common';
/**
 * Signature algorithm enumeration
 */
export declare enum SignatureAlgorithm {
    /** ECDSA with secp256k1 curve (Ethereum) */
    ECDSA_SECP256K1 = "ecdsa_secp256k1",
    /** EdDSA with Ed25519 curve (Substrate) */
    EDDSA_ED25519 = "eddsa_ed25519",
    /** EdDSA with Sr25519 curve (Substrate) */
    EDDSA_SR25519 = "eddsa_sr25519",
    /** Schnorr signatures */
    SCHNORR = "schnorr",
    /** BLS signatures */
    BLS = "bls"
}
/**
 * Signature format enumeration
 */
export declare enum SignatureFormat {
    /** DER encoded signature */
    DER = "der",
    /** Compact/IEEE P1363 format */
    COMPACT = "compact",
    /** Raw signature (r || s) */
    RAW = "raw",
    /** Base64 encoded */
    BASE64 = "base64",
    /** Hexadecimal */
    HEX = "hex"
}
/**
 * Signature interface
 */
export interface Signature {
    /** Signature value */
    signature: string;
    /** Algorithm used */
    algorithm: SignatureAlgorithm;
    /** Signature format */
    format: SignatureFormat;
    /** Public key of signer */
    publicKey?: string;
    /** Address of signer */
    address?: Address;
    /** Message that was signed */
    message?: string | Uint8Array;
    /** Hash of the message */
    messageHash?: Hash;
    /** Additional signature metadata */
    metadata?: SignatureMetadata;
}
/**
 * Signature metadata
 */
export interface SignatureMetadata {
    /** Timestamp when signature was created */
    createdAt: number;
    /** Signature version */
    version?: number;
    /** Chain ID for replay protection */
    chainId?: number;
    /** Nonce for replay protection */
    nonce?: string;
    /** Additional data */
    [key: string]: unknown;
}
/**
 * Signature verification result
 */
export interface SignatureVerificationResult {
    /** Whether signature is valid */
    isValid: boolean;
    /** Signer address (if verifiable) */
    signer?: Address;
    /** Error message if verification failed */
    error?: string;
    /** Verification timestamp */
    verifiedAt: number;
}
/**
 * Signing options
 */
export interface SigningOptions {
    /** Signature algorithm */
    algorithm?: SignatureAlgorithm;
    /** Signature format */
    format?: SignatureFormat;
    /** Include metadata */
    includeMetadata?: boolean;
    /** Chain ID for replay protection */
    chainId?: number;
    /** Nonce for replay protection */
    nonce?: string;
}
/**
 * Multi-signature configuration
 */
export interface MultiSignatureConfig {
    /** Required signatures */
    threshold: number;
    /** Total signers */
    totalSigners: number;
    /** Signer addresses */
    signers: Address[];
    /** Signature algorithm */
    algorithm: SignatureAlgorithm;
}
/**
 * Multi-signature result
 */
export interface MultiSignature {
    /** Combined signature */
    signature: string;
    /** Individual signatures */
    signatures: Signature[];
    /** Configuration used */
    config: MultiSignatureConfig;
    /** Timestamp when created */
    createdAt: number;
}
/**
 * EIP-712 typed data structure
 */
export interface EIP712TypedData {
    /** EIP-712 domain separator */
    domain: TypedDataDomain;
    /** EIP-712 type definitions */
    types: Record<string, TypedDataField[]>;
    /** Primary type being signed */
    primaryType: string;
    /** Message data to be signed */
    message: Record<string, unknown>;
}
/**
 * EIP-712 typed data signature
 */
export interface TypedDataSignature extends Omit<Signature, 'algorithm' | 'format' | 'message'> {
    /** EIP-712 domain */
    domain: TypedDataDomain;
    /** EIP-712 types */
    types: Record<string, TypedDataField[]>;
    /** EIP-712 message */
    message: Record<string, unknown>;
}
/**
 * EIP-712 domain
 */
export interface TypedDataDomain {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: Address;
    salt?: string;
}
/**
 * EIP-712 typed field
 */
export interface TypedDataField {
    name: string;
    type: string;
}
/**
 * Signature utility functions
 */
export declare class SignatureUtils {
    /**
     * Validate a signature
     */
    static validate(signature: string, algorithm: SignatureAlgorithm): boolean;
    /**
     * Create signature from components
     */
    static create(signature: string, algorithm: SignatureAlgorithm, options?: SigningOptions): Signature;
    /**
     * Verify signature
     */
    static verify(signature: Signature, message: string | Uint8Array, expectedSigner?: Address): Promise<SignatureVerificationResult>;
    /**
     * Create multi-signature
     */
    static createMultiSignature(signatures: Signature[], config: MultiSignatureConfig): Promise<MultiSignature>;
    /**
     * Verify multi-signature
     */
    static verifyMultiSignature(multiSignature: MultiSignature, message: string | Uint8Array): Promise<SignatureVerificationResult>;
    /**
     * Convert signature to different format
     */
    static convertFormat(signature: string, fromFormat: SignatureFormat, toFormat: SignatureFormat): string;
    private static isHexSignature;
    private static normalizeSignature;
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
    private static verifyWithAlgorithm;
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
    private static recoverAddress;
    private static areAddressesEqual;
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
    private static combineSignatures;
    private static hexToBytes;
    private static bytesToHex;
    private static base64ToBytes;
    private static bytesToBase64;
}
//# sourceMappingURL=signature.d.ts.map