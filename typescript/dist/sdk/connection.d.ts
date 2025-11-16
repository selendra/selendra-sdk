/**
 * Connection manager for handling Substrate and EVM providers
 */
import { ApiPromise } from '@polkadot/api';
import { ethers } from 'ethers';
import type { NetworkConfig } from '../types/network';
import type { SDKConfig } from './index';
/**
 * Manages connections to both Substrate and EVM endpoints
 */
export declare class ConnectionManager {
    private config;
    private substrateApi?;
    private evmProvider?;
    private networkConfig?;
    constructor(config: SDKConfig);
    /**
     * Connect to the configured networks
     */
    connect(): Promise<void>;
    /**
     * Disconnect from all networks
     */
    disconnect(): Promise<void>;
    /**
     * Get the Substrate API instance
     */
    getSubstrateApi(): Promise<ApiPromise>;
    /**
     * Get the EVM provider instance
     */
    getEvmProvider(): Promise<ethers.JsonRpcProvider>;
    /**
     * Get the current network configuration
     */
    getNetworkConfig(): NetworkConfig | undefined;
    private connectSubstrate;
    private connectEvm;
    private getNetworkById;
    private getChainId;
}
//# sourceMappingURL=connection.d.ts.map