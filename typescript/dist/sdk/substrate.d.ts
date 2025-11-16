/**
 * Substrate-specific client using @polkadot/api
 */
import { ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';
import type { SubstrateAddress, Balance, ChainInfo, SubstrateTransaction } from '../types';
import type { SDKConfig } from './index';
/**
 * Client for Substrate-specific operations
 */
export declare class SubstrateClient {
    private api;
    private config;
    private keyring;
    constructor(api: ApiPromise, config: SDKConfig);
    /**
     * Get chain information from Substrate
     */
    getChainInfo(): Promise<Partial<ChainInfo>>;
    /**
     * Get balance for a Substrate address
     */
    getBalance(address: SubstrateAddress): Promise<Balance>;
    /**
     * Transfer tokens between Substrate addresses
     */
    transfer(from: SubstrateAddress, to: SubstrateAddress, amount: string | number | BN, options?: {
        nonce?: number;
        tip?: string | number | BN;
        mortal?: boolean;
        era?: number;
    }): Promise<SubstrateTransaction>;
    /**
     * Get transaction status
     */
    getTransactionStatus(txHash: string): Promise<{
        status: 'pending' | 'success' | 'failed';
        blockNumber?: number;
        blockHash?: string;
        events?: any[];
    }>;
    /**
     * Wait for transaction confirmation
     */
    waitForTransaction(txHash: string, confirmations?: number): Promise<{
        status: 'success' | 'failed';
        blockNumber: number;
        blockHash: string;
        events: any[];
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
     * Get account information
     */
    getAccountInfo(address: SubstrateAddress): Promise<{
        nonce: number;
        refCount: number;
        free: string;
        reserved: string;
        frozen: string;
    }>;
    /**
     * Get staking information
     */
    getStakingInfo(address: SubstrateAddress): Promise<{
        active: string;
        unlocking: Array<{
            amount: string;
            era: number;
        }>;
    }>;
    /**
     * Get governance information
     */
    getGovernanceInfo(): Promise<{
        referendumCount: number;
        proposalCount: number;
        activeProposals: Array<{
            index: number;
            hash: string;
            title?: string;
        }>;
    }>;
    /**
     * Get the underlying API instance
     */
    getApi(): ApiPromise;
}
//# sourceMappingURL=substrate.d.ts.map