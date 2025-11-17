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
    private substrateToEvmAddress;
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
    private evmToSubstrateAddress;
}
//# sourceMappingURL=unified.d.ts.map