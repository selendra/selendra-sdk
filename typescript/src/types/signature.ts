/**
 * Signature-related types and utilities for the Selendra SDK
 */

import type { Hash, Address } from './common';

/**
 * Signature algorithm enumeration
 */
export enum SignatureAlgorithm {
  /** ECDSA with secp256k1 curve (Ethereum) */
  ECDSA_SECP256K1 = 'ecdsa_secp256k1',
  /** EdDSA with Ed25519 curve (Substrate) */
  EDDSA_ED25519 = 'eddsa_ed25519',
  /** EdDSA with Sr25519 curve (Substrate) */
  EDDSA_SR25519 = 'eddsa_sr25519',
  /** Schnorr signatures */
  SCHNORR = 'schnorr',
  /** BLS signatures */
  BLS = 'bls',
}

/**
 * Signature format enumeration
 */
export enum SignatureFormat {
  /** DER encoded signature */
  DER = 'der',
  /** Compact/IEEE P1363 format */
  COMPACT = 'compact',
  /** Raw signature (r || s) */
  RAW = 'raw',
  /** Base64 encoded */
  BASE64 = 'base64',
  /** Hexadecimal */
  HEX = 'hex',
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
export class SignatureUtils {
  /**
   * Validate a signature
   */
  static validate(signature: string, algorithm: SignatureAlgorithm): boolean {
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
  static create(
    signature: string,
    algorithm: SignatureAlgorithm,
    options: SigningOptions = {},
  ): Signature {
    const { format = SignatureFormat.HEX, includeMetadata = true } = options;

    // Normalize signature format
    const normalizedSignature = this.normalizeSignature(signature, format);

    const sig: Signature = {
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
  static async verify(
    signature: Signature,
    message: string | Uint8Array,
    expectedSigner?: Address,
  ): Promise<SignatureVerificationResult> {
    try {
      // This would use appropriate crypto libraries for verification
      // This is a placeholder implementation
      const isValid = await this.verifyWithAlgorithm(
        signature.signature,
        message,
        signature.algorithm,
        signature.publicKey,
      );

      let signer: Address | undefined;
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
    } catch (error) {
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
  static async createMultiSignature(
    signatures: Signature[],
    config: MultiSignatureConfig,
  ): Promise<MultiSignature> {
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
  static async verifyMultiSignature(
    multiSignature: MultiSignature,
    message: string | Uint8Array,
  ): Promise<SignatureVerificationResult> {
    try {
      // Verify individual signatures
      let validSignatures = 0;
      const verifiedSigners: Address[] = [];

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
    } catch (error) {
      return {
        isValid: false,
        error:
          error instanceof Error ? error.message : 'Unknown multi-signature verification error',
        verifiedAt: Date.now(),
      };
    }
  }

  /**
   * Convert signature to different format
   */
  static convertFormat(
    signature: string,
    fromFormat: SignatureFormat,
    toFormat: SignatureFormat,
  ): string {
    if (fromFormat === toFormat) {
      return signature;
    }

    // Convert to bytes first
    let signatureBytes: Uint8Array;

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
  private static isHexSignature(signature: string, expectedLength: number): boolean {
    return signature.startsWith('0x') && signature.length === expectedLength;
  }

  private static normalizeSignature(signature: string, format: SignatureFormat): string {
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

  private static async verifyWithAlgorithm(
    signature: string,
    message: string | Uint8Array,
    algorithm: SignatureAlgorithm,
    publicKey?: string,
  ): Promise<boolean> {
    // Placeholder for actual verification implementation
    // Would use appropriate crypto libraries
    return false;
  }

  private static async recoverAddress(
    publicKey: string,
    algorithm: SignatureAlgorithm,
  ): Promise<Address> {
    // Placeholder for address recovery from public key
    // Would use appropriate crypto libraries
    return '';
  }

  private static areAddressesEqual(address1: Address, address2: Address): boolean {
    return address1.toLowerCase() === address2.toLowerCase();
  }

  private static async combineSignatures(
    signatures: Signature[],
    algorithm: SignatureAlgorithm,
  ): Promise<string> {
    // Placeholder for signature combination
    // Would be algorithm-specific implementation
    return '';
  }

  private static hexToBytes(hex: string): Uint8Array {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    return new Uint8Array(cleanHex.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) || []);
  }

  private static bytesToHex(bytes: Uint8Array): string {
    return `0x${Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  private static base64ToBytes(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  }

  private static bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }
}
