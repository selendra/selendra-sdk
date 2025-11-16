/**
 * Unified client for cross-chain operations
 */
import type { Address, Balance, ChainInfo } from '../types';
import type { SubstrateClient } from './substrate';
import type { EvmClient } from './evm';
/**
 * Client for unified cross-chain operations
 */
export declare class UnifiedClient {
    private substrateClient;
    private evmClient;
    constructor(substrateClient: SubstrateClient, evmClient: EvmClient);
    /**
     * Get comprehensive chain information
     */
    chainInfo(): Promise<ChainInfo>;
    /**
     * Get balance for any address type (Substrate or EVM)
     */
    getBalance(address: Address): Promise<Balance>;
    /**
     * Transfer tokens between addresses (cross-chain support)
     */
    transfer(from: Address, to: Address, amount: string | number, options?: {
        gasLimit?: string;
        gasPrice?: string;
        memo?: string;
        privateKey?: string;
    }): Promise<{
        hash: string;
        blockNumber?: number;
    }>;
    /**
     * Get transaction status (works for both Substrate and EVM transactions)
     */
    getTransactionStatus(txHash: string): Promise<{
        status: 'pending' | 'success' | 'failed';
        blockNumber?: number;
        blockHash?: string;
        gasUsed?: string;
        effectiveGasPrice?: string;
    }>;
    /**
     * Wait for transaction confirmation
     */
    waitForTransaction(txHash: string, confirmations?: number): Promise<{
        status: 'success' | 'failed';
        blockNumber: number;
        blockHash: string;
        gasUsed: string;
        effectiveGasPrice: string;
    }>;
    /**
     * Convert between different address formats
     */
    convertAddress(address: Address, targetFormat: 'substrate' | 'evm'): Address;
    /**
     * Estimate gas for a transaction
     */
    estimateGas(from: Address, to: Address, amount: string | number, data?: string): Promise<string>;
    /**
     * Get current block number
     */
    getBlockNumber(): Promise<number>;
    /**
     * Get block information
     */
    getBlock(blockNumber: number | 'latest'): Promise<{
        number: number;
        hash: string;
        parentHash: string;
        timestamp: number;
        transactions: string[];
    }>;
    /**
     * Cross-chain transfer (bridge functionality)
     */
    private crossChainTransfer;
    /**
     * Check if address is a Substrate address
     */
    private isSubstrateAddress;
    /**
     * Check if address is an EVM address
     */
    private isEvmAddress;
    /**
     * Get address type
     */
    private getAddressType;
    /**
     * Convert Substrate address to EVM address
     * This is a simplified conversion - real implementation would use proper conversion logic
     */
    private substrateToEvmAddress;
    /**
     * Convert EVM address to Substrate address
     * This is a simplified conversion - real implementation would use proper conversion logic
     */
    private evmToSubstrateAddress;
}
//# sourceMappingURL=unified.d.ts.map