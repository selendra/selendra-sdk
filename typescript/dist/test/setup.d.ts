/**
 * Jest setup file for Node.js environment tests
 */
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidAddress(): R;
            toBeValidHash(): R;
            toBeValidSignature(): R;
            toBeValidBalance(): R;
        }
    }
}
export declare const testUtils: {
    /**
     * Generate a mock address
     */
    generateMockAddress: (prefix?: string) => string;
    /**
     * Generate a mock hash
     */
    generateMockHash: () => string;
    /**
     * Generate a mock signature
     */
    generateMockSignature: () => string;
    /**
     * Generate a mock balance
     */
    generateMockBalance: () => string;
    /**
     * Wait for async operations
     */
    wait: (ms?: number) => Promise<void>;
    /**
     * Create a mock transaction result
     */
    createMockTransactionResult: (hash?: string) => {
        hash: string;
        status: "finalized";
        blockHash: string;
        blockNumber: number;
        fee: string;
    };
    /**
     * Create a mock network status
     */
    createMockNetworkStatus: () => {
        isConnected: boolean;
        networkName: string;
        chainId: string;
        blockNumber: number;
        blockHash: string;
        genesisHash: string;
        isSyncing: boolean;
        timestamp: number;
    };
};
//# sourceMappingURL=setup.d.ts.map