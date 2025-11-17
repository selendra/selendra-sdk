"use strict";
/**
 * Unified client for cross-chain operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedClient = void 0;
/**
 * Client for unified cross-chain operations
 */
class UnifiedClient {
    constructor(substrateClient, evmClient) {
        Object.defineProperty(this, "substrateClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "evmClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.substrateClient = substrateClient;
        this.evmClient = evmClient;
    }
    /**
     * Get comprehensive chain information
     */
    async chainInfo() {
        const [substrateInfo, evmInfo] = await Promise.all([
            this.substrateClient.getChainInfo(),
            this.evmClient.getChainInfo()
        ]);
        // Merge information from both chains
        return {
            name: substrateInfo.name || evmInfo.name || 'Selendra',
            version: substrateInfo.version || 'unknown',
            chainId: evmInfo.chainId || substrateInfo.chainId || 'selendra',
            blockNumber: Math.max(substrateInfo.blockNumber || 0, evmInfo.blockNumber || 0),
            genesisHash: substrateInfo.genesisHash,
            specVersion: substrateInfo.specVersion,
            implVersion: substrateInfo.implVersion,
            ss58Format: substrateInfo.ss58Format || 42,
            tokenDecimals: substrateInfo.tokenDecimals || evmInfo.tokenDecimals || 12,
            tokenSymbol: substrateInfo.tokenSymbol || evmInfo.tokenSymbol || 'SEL',
            gasLimit: evmInfo.gasLimit
        };
    }
    /**
     * Get balance for any address type (Substrate or EVM)
     */
    async getBalance(address) {
        if (this.isSubstrateAddress(address)) {
            return await this.substrateClient.getBalance(address);
        }
        else if (this.isEvmAddress(address)) {
            return await this.evmClient.getBalance(address);
        }
        else {
            throw new Error(`Invalid address format: ${address}`);
        }
    }
    /**
     * Transfer tokens between addresses (cross-chain support)
     */
    async transfer(from, to, amount, options) {
        const fromType = this.getAddressType(from);
        const toType = this.getAddressType(to);
        // Same-chain transfers
        if (fromType === toType) {
            if (fromType === 'substrate') {
                const result = await this.substrateClient.transfer(from, to, amount, {
                    mortal: true,
                    era: 64
                });
                return { hash: result.hash };
            }
            else {
                if (!options?.privateKey) {
                    throw new Error('Private key required for EVM transfers');
                }
                const result = await this.evmClient.transfer(from, options.privateKey, to, amount.toString(), {
                    gasLimit: options.gasLimit,
                    gasPrice: options.gasPrice
                });
                return { hash: result.hash };
            }
        }
        // Cross-chain transfers (bridge)
        return await this.crossChainTransfer(from, to, amount, options);
    }
    /**
     * Get transaction status (works for both Substrate and EVM transactions)
     */
    async getTransactionStatus(txHash) {
        // Try both chains - one will succeed
        const [substrateStatus, evmStatus] = await Promise.allSettled([
            this.substrateClient.getTransactionStatus(txHash),
            this.evmClient.getTransactionStatus(txHash)
        ]);
        if (substrateStatus.status === 'fulfilled' && substrateStatus.value.status !== 'pending') {
            return {
                status: substrateStatus.value.status,
                blockNumber: substrateStatus.value.blockNumber,
                blockHash: substrateStatus.value.blockHash
            };
        }
        if (evmStatus.status === 'fulfilled' && evmStatus.value.status !== 'pending') {
            return {
                status: evmStatus.value.status,
                blockNumber: evmStatus.value.blockNumber,
                blockHash: evmStatus.value.blockHash,
                gasUsed: evmStatus.value.gasUsed,
                effectiveGasPrice: evmStatus.value.gasPrice
            };
        }
        return { status: 'pending' };
    }
    /**
     * Wait for transaction confirmation
     */
    async waitForTransaction(txHash, confirmations = 1) {
        // Try Substrate first
        try {
            const result = await this.substrateClient.waitForTransaction(txHash, confirmations);
            return {
                status: result.status,
                blockNumber: result.blockNumber,
                blockHash: result.blockHash,
                gasUsed: '0', // Substrate doesn't have gas in the same way
                effectiveGasPrice: '0'
            };
        }
        catch {
            // Try EVM
            try {
                const result = await this.evmClient.waitForTransaction(txHash, confirmations);
                return {
                    status: result.status,
                    blockNumber: result.blockNumber,
                    blockHash: result.blockHash,
                    gasUsed: result.gasUsed,
                    effectiveGasPrice: result.gasPrice
                };
            }
            catch (error) {
                throw new Error(`Transaction confirmation failed: ${error}`);
            }
        }
    }
    /**
     * Convert between different address formats
     */
    convertAddress(address, targetFormat) {
        if (this.isSubstrateAddress(address) && targetFormat === 'evm') {
            return this.substrateToEvmAddress(address);
        }
        else if (this.isEvmAddress(address) && targetFormat === 'substrate') {
            return this.evmToSubstrateAddress(address);
        }
        else {
            // Already in target format
            return address;
        }
    }
    /**
     * Estimate gas for a transaction
     */
    async estimateGas(from, to, amount, data) {
        const fromType = this.getAddressType(from);
        const toType = this.getAddressType(to);
        if (fromType === 'evm' && toType === 'evm') {
            return await this.evmClient.estimateGas(from, to, amount.toString(), data);
        }
        else {
            // Substrate transactions don't use gas in the same way
            // Return a reasonable default
            return '2100000000000000'; // Default from network config
        }
    }
    /**
     * Get current block number
     */
    async getBlockNumber() {
        const [substrateBlock, evmBlock] = await Promise.all([
            this.substrateClient.getBlockNumber(),
            this.evmClient.getBlockNumber()
        ]);
        // Return the higher block number (more recent)
        return Math.max(substrateBlock, evmBlock);
    }
    /**
     * Get block information
     */
    async getBlock(blockNumber) {
        // Try to get block from both chains, return the one with more data
        try {
            return await this.substrateClient.getBlock(blockNumber);
        }
        catch {
            return await this.evmClient.getBlock(blockNumber);
        }
    }
    /**
     * Cross-chain transfer (bridge functionality)
     *
     * Enables transferring tokens between Substrate and EVM layers on Selendra.
     * This is a critical feature for unified accounts that allows seamless asset movement
     * across the different execution environments.
     *
     * @param from - Source address (Substrate or EVM)
     * @param to - Destination address (Substrate or EVM)
     * @param amount - Amount to transfer (in smallest unit)
     * @param options - Transfer options including gas settings and private key for EVM
     * @returns Transaction hash and optional block number
     *
     * @throws Error indicating bridge functionality is under development
     *
     * @remarks
     * **Status: Coming Soon**
     *
     * The bridge implementation will support:
     * - Substrate → EVM transfers via `evm.withdraw` extrinsic
     * - EVM → Substrate transfers via bridge precompile contract
     * - Automatic balance synchronization between layers
     * - Replay protection and nonce management
     * - Fee estimation and optimization
     *
     * **Planned Interface:**
     * ```typescript
     * interface BridgeTransferOptions {
     *   gasLimit?: string;
     *   gasPrice?: string;
     *   memo?: string;
     *   privateKey?: string;
     *   maxSlippage?: number;
     *   deadline?: number;
     * }
     *
     * interface BridgeTransferResult {
     *   hash: string;
     *   blockNumber?: number;
     *   bridgeId?: string;
     *   estimatedConfirmations?: number;
     * }
     * ```
     *
     * **Roadmap:**
     * 1. Q1 2025: Bridge precompile contract deployment
     * 2. Q1 2025: SDK integration and testing
     * 3. Q2 2025: Mainnet launch with audit
     *
     * **Workaround:**
     * For now, please use same-chain transfers. You can convert addresses using
     * `convertAddress()` method to ensure compatibility.
     *
     * @see {@link https://docs.selendra.org/bridge | Bridge Documentation}
     */
    async crossChainTransfer(from, to, amount, options) {
        // Bridge functionality is planned for Q1 2025
        // Will integrate with:
        // - Substrate: pallet-evm-bridge for Substrate → EVM transfers
        // - EVM: Bridge precompile contract at 0x0000000000000000000000000000000000000400
        throw new Error('Cross-chain bridge transfers are under development and will be available in Q1 2025. ' +
            'Current status: Bridge precompile contract in testing phase. ' +
            'For now, please use same-chain transfers or convert addresses using convertAddress() method. ' +
            'See https://docs.selendra.org/bridge for updates.');
    }
    /**
     * Check if address is a Substrate address
     */
    isSubstrateAddress(address) {
        // Substrate addresses start with a number and are longer than EVM addresses
        return /^[1-9][0-9]*[a-zA-Z0-9]+$/.test(address) && address.length > 40;
    }
    /**
     * Check if address is an EVM address
     */
    isEvmAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    /**
     * Get address type
     */
    getAddressType(address) {
        if (this.isSubstrateAddress(address)) {
            return 'substrate';
        }
        else if (this.isEvmAddress(address)) {
            return 'evm';
        }
        else {
            throw new Error(`Invalid address format: ${address}`);
        }
    }
    /**
     * Convert Substrate address to EVM address
     * Uses proper AccountId32 → H160 conversion compatible with Selendra's unified accounts
     *
     * @param substrateAddress - Substrate SS58 address
     * @returns EVM H160 address
     *
     * @remarks
     * This conversion extracts the first 20 bytes from the decoded Substrate address
     * (AccountId32 public key) to create an EVM-compatible H160 address.
     * This matches the on-chain conversion logic used by Selendra's unified accounts pallet.
     */
    substrateToEvmAddress(substrateAddress) {
        try {
            // Import required utilities
            const { decodeAddress } = require('@polkadot/util-crypto');
            const { u8aToHex } = require('@polkadot/util');
            // Decode Substrate address to get 32-byte AccountId
            const accountId = decodeAddress(substrateAddress);
            // Take first 20 bytes for EVM H160 address
            const evmBytes = accountId.slice(0, 20);
            // Convert to hex string
            const evmAddress = u8aToHex(evmBytes);
            return evmAddress;
        }
        catch (error) {
            throw new Error(`Failed to convert Substrate address to EVM: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Convert EVM address to Substrate address
     * Uses proper H160 → AccountId32 conversion compatible with Selendra's unified accounts
     *
     * @param evmAddress - EVM H160 address
     * @returns Substrate SS58 address
     *
     * @remarks
     * This conversion pads the 20-byte EVM address to 32 bytes (AccountId32) and encodes
     * it using SS58 format with Selendra's network prefix (204 for mainnet).
     * The padding matches the on-chain conversion logic used by Selendra's unified accounts pallet.
     */
    evmToSubstrateAddress(evmAddress) {
        try {
            // Import required utilities
            const { encodeAddress } = require('@polkadot/util-crypto');
            const { hexToU8a, isHex } = require('@polkadot/util');
            // Validate EVM address format
            if (!isHex(evmAddress) || evmAddress.length !== 42) {
                throw new Error('Invalid EVM address format: expected 0x followed by 40 hex characters');
            }
            // Convert EVM address hex to bytes
            const evmBytes = hexToU8a(evmAddress);
            // Pad to 32 bytes (AccountId32 format)
            // EVM addresses are 20 bytes, we need 32 bytes for Substrate
            const paddedBytes = new Uint8Array(32);
            paddedBytes.set(evmBytes, 0); // Copy EVM bytes to start
            // Remaining 12 bytes stay as zeros
            // Encode with SS58 format using Selendra's network prefix (204)
            const ss58Prefix = 204;
            const substrateAddress = encodeAddress(paddedBytes, ss58Prefix);
            return substrateAddress;
        }
        catch (error) {
            throw new Error(`Failed to convert EVM address to Substrate: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.UnifiedClient = UnifiedClient;
//# sourceMappingURL=unified.js.map