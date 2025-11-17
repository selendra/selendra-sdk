"use strict";
/**
 * Hash-related types and utilities for the Selendra SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashUtils = exports.HASH_PATTERNS = exports.HashType = void 0;
/**
 * Hash type enumeration
 */
var HashType;
(function (HashType) {
    /** SHA-256 hash */
    HashType["SHA256"] = "sha256";
    /** Keccak-256 hash (Ethereum) */
    HashType["KECCAK256"] = "keccak256";
    /** Blake2-256 hash (Substrate) */
    HashType["BLAKE2_256"] = "blake2-256";
    /** Blake2-128 hash */
    HashType["BLAKE2_128"] = "blake2-128";
    /** xxHash */
    HashType["XXHASH"] = "xxhash";
    /** MD5 hash (legacy) */
    HashType["MD5"] = "md5";
})(HashType || (exports.HashType = HashType = {}));
/**
 * Hash patterns
 */
exports.HASH_PATTERNS = {
    /** 64-character hex hash (most common) */
    HEX_64: /^0x[a-fA-F0-9]{64}$/,
    /** 40-character hex hash */
    HEX_40: /^0x[a-fA-F0-9]{40}$/,
    /** 32-character hex hash */
    HEX_32: /^0x[a-fA-F0-9]{32}$/,
    /** Hex hash without 0x prefix */
    HEX_NO_PREFIX: /^[a-fA-F0-9]{40,64}$/,
    /** Base64 hash pattern */
    BASE64: /^[A-Za-z0-9+/]+={0,2}$/,
};
/**
 * Hash utility functions
 */
class HashUtils {
    /**
     * Validate a hash
     */
    static validate(hash) {
        if (!hash || typeof hash !== 'string') {
            return {
                isValid: false,
                error: 'Hash must be a non-empty string',
            };
        }
        // Normalize hash (remove 0x prefix if present)
        const normalized = hash.startsWith('0x') ? hash.slice(2) : hash;
        // Check if it's valid hex
        if (!/^[a-fA-F0-9]+$/.test(normalized)) {
            return {
                isValid: false,
                error: 'Hash contains non-hexadecimal characters',
            };
        }
        // Check length and determine type
        let type;
        if (normalized.length === 64) {
            type = HashType.SHA256; // Could also be Keccak-256
        }
        else if (normalized.length === 40) {
            type = HashType.BLAKE2_128;
        }
        else if (normalized.length === 32) {
            type = HashType.MD5;
        }
        else {
            return {
                isValid: false,
                error: `Invalid hash length: ${normalized.length} characters`,
            };
        }
        return {
            isValid: true,
            type,
            normalized: `0x${normalized.toLowerCase()}`,
        };
    }
    /**
     * Generate hash from data
     */
    static async generate(data, options = {}) {
        const { algorithm = HashType.SHA256, inputEncoding = 'utf8', outputEncoding = 'hex', includePrefix = true, } = options;
        // Convert input to bytes
        let inputBytes;
        if (typeof data === 'string') {
            switch (inputEncoding) {
                case 'hex':
                    inputBytes = new Uint8Array(data
                        .replace('0x', '')
                        .match(/.{2}/g)
                        ?.map((byte) => parseInt(byte, 16)) || []);
                    break;
                case 'base64':
                    inputBytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
                    break;
                default:
                    inputBytes = new TextEncoder().encode(data);
                    break;
            }
        }
        else {
            inputBytes = data;
        }
        // Generate hash based on algorithm
        let hashBytes;
        // In a real implementation, you would use appropriate crypto libraries
        // This is a placeholder that would need actual implementation
        switch (algorithm) {
            case HashType.SHA256:
                // Use Web Crypto API or appropriate library
                hashBytes = await this.sha256(inputBytes);
                break;
            case HashType.KECCAK256:
                // Use appropriate Keccak library
                hashBytes = await this.keccak256(inputBytes);
                break;
            case HashType.BLAKE2_256:
                // Use appropriate Blake2b library
                hashBytes = await this.blake2_256(inputBytes);
                break;
            default:
                throw new Error(`Hash algorithm ${algorithm} not implemented`);
        }
        // Convert to desired output format
        let result;
        if (outputEncoding === 'hex') {
            result = Array.from(hashBytes)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');
        }
        else {
            result = btoa(String.fromCharCode(...Array.from(hashBytes)));
        }
        // Add prefix if requested
        if (includePrefix && outputEncoding === 'hex') {
            result = `0x${result}`;
        }
        return result;
    }
    /**
     * Compare two hashes
     */
    static isEqual(hash1, hash2) {
        const validation1 = this.validate(hash1);
        const validation2 = this.validate(hash2);
        if (!validation1.isValid || !validation2.isValid) {
            return false;
        }
        return validation1.normalized === validation2.normalized;
    }
    /**
     * Check if hash is a block hash
     */
    static isBlockHash(hash) {
        const validation = this.validate(hash);
        return validation.isValid && validation.type === HashType.SHA256;
    }
    /**
     * Check if hash is a transaction hash
     */
    static isTransactionHash(hash) {
        const validation = this.validate(hash);
        return validation.isValid && validation.type === HashType.SHA256;
    }
    /**
     * Create Merkle tree from hashes
     */
    static createMerkleTree(hashes) {
        if (hashes.length === 0) {
            throw new Error('Cannot create Merkle tree with no hashes');
        }
        // Convert hashes to nodes
        const level0 = hashes.map((hash, index) => ({
            hash,
            level: 0,
            index,
        }));
        const tree = [level0];
        let currentLevel = level0;
        // Build tree levels
        while (currentLevel.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i];
                const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
                // Simple synchronous hash combination (placeholder)
                const combinedHash = `${left.hash}${right.hash}`;
                const nodeHash = `0x${combinedHash.slice(2, 66)}`;
                const node = {
                    hash: nodeHash,
                    level: currentLevel[0].level + 1,
                    index: Math.floor(i / 2),
                    left,
                    right,
                };
                nextLevel.push(node);
            }
            tree.push(nextLevel);
            currentLevel = nextLevel;
        }
        return {
            root: currentLevel[0].hash,
            tree,
        };
    }
    /**
     * Generate Merkle proof
     */
    static generateMerkleProof(leafHash, tree) {
        // Find the leaf node
        const leafIndex = tree[0].findIndex((node) => this.isEqual(node.hash, leafHash));
        if (leafIndex === -1) {
            throw new Error('Leaf hash not found in Merkle tree');
        }
        const path = [];
        let currentIndex = leafIndex;
        // Build proof path
        for (let level = 0; level < tree.length - 1; level++) {
            const isLeft = currentIndex % 2 === 0;
            const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
            if (siblingIndex < tree[level].length) {
                path.push({
                    hash: tree[level][siblingIndex].hash,
                    isLeft,
                });
            }
            currentIndex = Math.floor(currentIndex / 2);
        }
        return {
            root: tree[tree.length - 1][0].hash,
            leaf: leafHash,
            path,
            depth: path.length,
        };
    }
    /**
     * Verify Merkle proof
     */
    static verifyMerkleProof(proof) {
        let currentHash = proof.leaf;
        for (const sibling of proof.path) {
            const combinedHash = sibling.isLeft
                ? `${sibling.hash}${currentHash}`
                : `${currentHash}${sibling.hash}`;
            // Simple synchronous hash combination (placeholder)
            currentHash = `0x${combinedHash.slice(2, 66)}`;
        }
        return this.isEqual(currentHash, proof.root);
    }
    // Placeholder hash implementations (would be replaced with actual crypto libraries)
    static async sha256(data) {
        // This would be implemented with Web Crypto API or appropriate library
        throw new Error('SHA256 implementation not available in this example');
    }
    static async keccak256(data) {
        // This would be implemented with appropriate Keccak library
        throw new Error('Keccak256 implementation not available in this example');
    }
    static async blake2_256(data) {
        // This would be implemented with appropriate Blake2b library
        throw new Error('Blake2-256 implementation not available in this example');
    }
}
exports.HashUtils = HashUtils;
//# sourceMappingURL=hash.js.map