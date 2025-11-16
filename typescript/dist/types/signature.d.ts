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
 * EIP-712 typed data signature
 */
export interface TypedDataSignature extends Signature {
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
    private static verifyWithAlgorithm;
    private static recoverAddress;
    private static areAddressesEqual;
    private static combineSignatures;
    private static hexToBytes;
    private static bytesToHex;
    private static base64ToBytes;
    private static bytesToBase64;
}
//# sourceMappingURL=signature.d.ts.map