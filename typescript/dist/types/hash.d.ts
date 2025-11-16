/**
 * Hash-related types and utilities for the Selendra SDK
 */
import type { Hash } from './common';
/**
 * Hash type enumeration
 */
export declare enum HashType {
    /** SHA-256 hash */
    SHA256 = "sha256",
    /** Keccak-256 hash (Ethereum) */
    KECCAK256 = "keccak256",
    /** Blake2-256 hash (Substrate) */
    BLAKE2_256 = "blake2-256",
    /** Blake2-128 hash */
    BLAKE2_128 = "blake2-128",
    /** xxHash */
    XXHASH = "xxhash",
    /** MD5 hash (legacy) */
    MD5 = "md5"
}
/**
 * Hash validation result
 */
export interface HashValidationResult {
    /** Whether hash is valid */
    isValid: boolean;
    /** Hash type if identifiable */
    type?: HashType;
    /** Error message if invalid */
    error?: string;
    /** Normalized hash (lowercase) */
    normalized?: Hash;
}
/**
 * Hash generation options
 */
export interface HashGenerationOptions {
    /** Hash algorithm */
    algorithm?: HashType;
    /** Input encoding */
    inputEncoding?: 'utf8' | 'hex' | 'base64';
    /** Output encoding */
    outputEncoding?: 'hex' | 'base64';
    /** Include prefix */
    includePrefix?: boolean;
}
/**
 * Merkle tree node
 */
export interface MerkleNode {
    /** Node hash */
    hash: Hash;
    /** Node level in tree */
    level: number;
    /** Node index at level */
    index: number;
    /** Left child */
    left?: MerkleNode;
    /** Right child */
    right?: MerkleNode;
}
/**
 * Merkle proof
 */
export interface MerkleProof {
    /** Root hash */
    root: Hash;
    /** Leaf hash */
    leaf: Hash;
    /** Proof path */
    path: Array<{
        /** Sibling hash */
        hash: Hash;
        /** Whether sibling is on the left */
        isLeft: boolean;
    }>;
    /** Proof depth */
    depth: number;
}
/**
 * Hash patterns
 */
export declare const HASH_PATTERNS: {
    /** 64-character hex hash (most common) */
    readonly HEX_64: RegExp;
    /** 40-character hex hash */
    readonly HEX_40: RegExp;
    /** 32-character hex hash */
    readonly HEX_32: RegExp;
    /** Hex hash without 0x prefix */
    readonly HEX_NO_PREFIX: RegExp;
    /** Base64 hash pattern */
    readonly BASE64: RegExp;
};
/**
 * Hash utility functions
 */
export declare class HashUtils {
    /**
     * Validate a hash
     */
    static validate(hash: Hash): HashValidationResult;
    /**
     * Generate hash from data
     */
    static generate(data: string | Uint8Array, options?: HashGenerationOptions): Promise<Hash>;
    /**
     * Compare two hashes
     */
    static isEqual(hash1: Hash, hash2: Hash): boolean;
    /**
     * Check if hash is a block hash
     */
    static isBlockHash(hash: Hash): boolean;
    /**
     * Check if hash is a transaction hash
     */
    static isTransactionHash(hash: Hash): boolean;
    /**
     * Create Merkle tree from hashes
     */
    static createMerkleTree(hashes: Hash[]): {
        root: Hash;
        tree: MerkleNode[][];
    };
    /**
     * Generate Merkle proof
     */
    static generateMerkleProof(leafHash: Hash, tree: MerkleNode[][]): MerkleProof;
    /**
     * Verify Merkle proof
     */
    static verifyMerkleProof(proof: MerkleProof): boolean;
    private static sha256;
    private static keccak256;
    private static blake2_256;
}
//# sourceMappingURL=hash.d.ts.map