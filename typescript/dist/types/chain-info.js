"use strict";
/**
 * Chain information types for the Selendra SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainUtils = exports.ChainStatus = exports.ConsensusType = exports.ChainType = void 0;
/**
 * Chain type enumeration
 */
var ChainType;
(function (ChainType) {
    ChainType["MAINNET"] = "mainnet";
    ChainType["TESTNET"] = "testnet";
    ChainType["DEVELOPMENT"] = "development";
    ChainType["LOCAL"] = "local";
})(ChainType || (exports.ChainType = ChainType = {}));
/**
 * Consensus type enumeration
 */
var ConsensusType;
(function (ConsensusType) {
    ConsensusType["PROOF_OF_STAKE"] = "proof_of_stake";
    ConsensusType["PROOF_OF_WORK"] = "proof_of_work";
    ConsensusType["PROOF_OF_AUTHORITY"] = "proof_of_authority";
    ConsensusType["DELEGATED_PROOF_OF_STAKE"] = "delegated_proof_of_stake";
    ConsensusType["HYBRID"] = "hybrid";
})(ConsensusType || (exports.ConsensusType = ConsensusType = {}));
/**
 * Chain status enumeration
 */
var ChainStatus;
(function (ChainStatus) {
    ChainStatus["ACTIVE"] = "active";
    ChainStatus["INACTIVE"] = "inactive";
    ChainStatus["MAINTENANCE"] = "maintenance";
    ChainStatus["DEPRECATED"] = "deprecated";
    ChainStatus["UNKNOWN"] = "unknown";
})(ChainStatus || (exports.ChainStatus = ChainStatus = {}));
class ChainUtils {
    /**
     * Check if chain supports EVM
     */
    static supportsEVM(chain) {
        return chain.features.evm;
    }
    /**
     * Check if chain supports Substrate
     */
    static supportsSubstrate(chain) {
        return chain.features.substrate;
    }
    /**
     * Check if chain supports staking
     */
    static supportsStaking(chain) {
        return chain.features.staking;
    }
    /**
     * Check if chain is healthy
     */
    static isHealthy(health) {
        return health.status === 'healthy' && !health.isSyncing && health.activeNodes > 0;
    }
    /**
     * Calculate chain age in days
     */
    static calculateAge(currentBlock, blockTime) {
        const blocksPerDay = (24 * 60 * 60 * 1000) / blockTime;
        return Math.floor(Number(currentBlock) / blocksPerDay);
    }
    /**
     * Format block time for display
     */
    static formatBlockTime(blockTimeMs) {
        if (blockTimeMs < 1000) {
            return `${blockTimeMs}ms`;
        }
        else if (blockTimeMs < 60000) {
            return `${(blockTimeMs / 1000).toFixed(1)}s`;
        }
        else {
            return `${(blockTimeMs / 60000).toFixed(1)}m`;
        }
    }
    /**
     * Get chain explorer URL for transaction
     */
    static getTransactionExplorerUrl(chain, transactionHash) {
        if (!chain.metadata.explorer) {
            return undefined;
        }
        const baseUrl = chain.metadata.explorer.endsWith('/')
            ? chain.metadata.explorer.slice(0, -1)
            : chain.metadata.explorer;
        if (this.supportsEVM(chain)) {
            return `${baseUrl}/tx/${transactionHash}`;
        }
        else {
            return `${baseUrl}/extrinsic/${transactionHash}`;
        }
    }
    /**
     * Get chain explorer URL for block
     */
    static getBlockExplorerUrl(chain, blockHashOrNumber) {
        if (!chain.metadata.explorer) {
            return undefined;
        }
        const baseUrl = chain.metadata.explorer.endsWith('/')
            ? chain.metadata.explorer.slice(0, -1)
            : chain.metadata.explorer;
        if (this.supportsEVM(chain)) {
            return `${baseUrl}/block/${blockHashOrNumber}`;
        }
        else {
            return `${baseUrl}/block/${blockHashOrNumber}`;
        }
    }
    /**
     * Get chain explorer URL for address
     */
    static getAddressExplorerUrl(chain, address) {
        if (!chain.metadata.explorer) {
            return undefined;
        }
        const baseUrl = chain.metadata.explorer.endsWith('/')
            ? chain.metadata.explorer.slice(0, -1)
            : chain.metadata.explorer;
        if (this.supportsEVM(chain)) {
            return `${baseUrl}/address/${address}`;
        }
        else {
            return `${baseUrl}/account/${address}`;
        }
    }
}
exports.ChainUtils = ChainUtils;
//# sourceMappingURL=chain-info.js.map