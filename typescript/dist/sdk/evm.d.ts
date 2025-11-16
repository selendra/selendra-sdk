/**
 * EVM client using ethers.js and existing EVM modules
 */
import { ethers } from 'ethers';
import type { EvmAddress, Balance, ChainInfo, EvmTransaction } from '../types';
import type { SDKConfig } from './index';
/**
 * Client for EVM-specific operations
 */
export declare class EvmClient {
    private provider;
    private config;
    constructor(provider: ethers.JsonRpcProvider, config: SDKConfig);
    /**
     * Get chain information from EVM
     */
    getChainInfo(): Promise<Partial<ChainInfo>>;
    /**
     * Get balance for an EVM address
     */
    getBalance(address: EvmAddress): Promise<Balance>;
    /**
     * Transfer tokens between EVM addresses
     */
    transfer(from: EvmAddress, privateKey: string, to: EvmAddress, amount: string, options?: {
        gasLimit?: string;
        gasPrice?: string;
        nonce?: number;
        data?: string;
    }): Promise<EvmTransaction>;
    /**
     * Get transaction status
     */
    getTransactionStatus(txHash: string): Promise<{
        status: 'pending' | 'success' | 'failed';
        blockNumber?: number;
        blockHash?: string;
        gasUsed?: string;
        gasPrice?: string;
        logs?: any[];
    }>;
    /**
     * Wait for transaction confirmation
     */
    waitForTransaction(txHash: string, confirmations?: number): Promise<{
        status: 'success' | 'failed';
        blockNumber: number;
        blockHash: string;
        gasUsed: string;
        gasPrice: string;
        logs: any[];
    }>;
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
     * Estimate gas for a transaction
     */
    estimateGas(from: EvmAddress, to: EvmAddress, amount: string, data?: string): Promise<string>;
    /**
     * Get gas price
     */
    getGasPrice(): Promise<string>;
    /**
     * Get fee data
     */
    getFeeData(): Promise<{
        gasPrice: string;
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
    }>;
    /**
     * Call a smart contract method (read-only)
     */
    call(to: EvmAddress, data: string, from?: EvmAddress): Promise<string>;
    /**
     * Send raw transaction
     */
    sendRawTransaction(signedTx: string): Promise<string>;
    /**
     * Get transaction count (nonce) for an address
     */
    getTransactionCount(address: EvmAddress): Promise<number>;
    /**
     * Get transaction by hash
     */
    getTransaction(txHash: string): Promise<{
        hash: string;
        from: string;
        to: string;
        value: string;
        gasPrice: string;
        gasLimit: string;
        nonce: number;
        data: string;
    }>;
    /**
     * Get logs matching filter criteria
     */
    getLogs(filter: {
        address?: EvmAddress | EvmAddress[];
        topics?: (string | string[] | null)[];
        fromBlock?: number | 'latest';
        toBlock?: number | 'latest';
    }): Promise<any[]>;
    /**
     * Get the underlying provider instance
     */
    getProvider(): ethers.JsonRpcProvider;
}
//# sourceMappingURL=evm.d.ts.map