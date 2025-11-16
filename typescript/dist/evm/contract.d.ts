/**
 * EVM Contract Integration for the Selendra SDK
 * Provides ethers.js v6 compatible Contract class and factory
 * Supports ABI parsing, method calling, events, and batch operations
 */
import { EventEmitter } from 'events';
import type { Address, Balance, TransactionHash } from '../types/common';
import type { EvmContract, EvmTransactionRequest, EvmCallOptions, EvmEstimateGasOptions, EvmLog, EvmFilter, Erc20Contract, Erc721Contract } from '../types/evm';
/**
 * Function fragment interface
 */
export interface FunctionFragment {
    name: string;
    type: 'function';
    inputs: ParamType[];
    outputs: ParamType[];
    stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
    payable: boolean;
    constant: boolean;
    signature: string;
}
/**
 * Event fragment interface
 */
export interface EventFragment {
    name: string;
    type: 'event';
    inputs: ParamType[];
    anonymous: boolean;
    signature: string;
}
/**
 * Constructor fragment interface
 */
export interface ConstructorFragment {
    type: 'constructor';
    inputs: ParamType[];
    payable: boolean;
}
/**
 * Fallback fragment interface
 */
export interface FallbackFragment {
    type: 'fallback';
    stateMutability: 'nonpayable' | 'payable';
    payable: boolean;
}
/**
 * Receive fragment interface
 */
export interface ReceiveFragment {
    type: 'receive';
    stateMutability: 'payable';
    payable: boolean;
}
/**
 * Parameter type interface
 */
export interface ParamType {
    name: string;
    type: string;
    indexed?: boolean;
    components?: ParamType[];
    arrayLength?: number;
    arrayChildren?: ParamType;
}
/**
 * Fragment type union
 */
export type Fragment = FunctionFragment | EventFragment | ConstructorFragment | FallbackFragment | ReceiveFragment;
/**
 * Contract ABI interface
 */
export type ContractABI = (string | Fragment)[];
/**
 * Contract call options
 */
export interface CallOptions extends EvmCallOptions {
    /** Block number to call against */
    blockTag?: string | number;
}
/**
 * Contract transaction options
 */
export interface TransactionOptions extends EvmTransactionRequest {
    /** Gas limit override */
    gasLimit?: number | string;
    /** Gas price override */
    gasPrice?: string;
    /** Maximum fee per gas (EIP-1559) */
    maxFeePerGas?: string;
    /** Maximum priority fee per gas (EIP-1559) */
    maxPriorityFeePerGas?: string;
    /** Number of confirmations to wait for */
    confirmations?: number;
}
/**
 * Event filter options
 */
export interface EventFilterOptions extends EvmFilter {
    /** Event name */
    event?: string;
    /** Event parameters */
    args?: unknown[];
    /** From block */
    fromBlock?: number | 'earliest' | 'latest' | 'pending';
    /** To block */
    toBlock?: number | 'earliest' | 'latest' | 'pending';
}
/**
 * Event subscription
 */
export declare class EventSubscription extends EventEmitter {
    private contract;
    private eventName;
    private filter;
    private isSubscribed;
    private subscriptionId?;
    constructor(contract: Contract, eventName: string, filter?: EventFilterOptions);
    /**
     * Start listening for events
     */
    start(): Promise<void>;
    /**
     * Stop listening for events
     */
    stop(): Promise<void>;
    /**
     * Check if subscription is active
     */
    isActive(): boolean;
    /**
     * Get event filter
     */
    getFilter(): EventFilterOptions;
    /**
     * Build topic array for subscription
     */
    private buildTopics;
    /**
     * Encode value for topic filtering
     */
    private encodeTopicValue;
}
/**
 * Contract interface implementation
 */
export declare class Interface {
    private readonly functions;
    private readonly events;
    private readonly constructorFragment?;
    private readonly fallback?;
    private readonly receive?;
    constructor(abi: ContractABI);
    /**
     * Get function fragment
     */
    getFunction(nameOrSignature: string): FunctionFragment | undefined;
    /**
     * Get event fragment
     */
    getEvent(nameOrSignature: string): EventFragment | undefined;
    /**
     * Get all function names
     */
    getFunctionNames(): string[];
    /**
     * Get all event names
     */
    getEventNames(): string[];
    /**
     * Encode function call data
     */
    encodeFunctionData(functionName: string, args?: unknown[], overrides?: {
        gasLimit?: number;
        value?: Balance;
    }): string;
    /**
     * Decode function result
     */
    decodeFunctionResult(functionName: string, data: string): unknown[];
    /**
     * Parse log
     */
    parseLog(log: EvmLog): {
        name: string;
        args: unknown[];
        signature: string;
    } | null;
    /**
     * Encode constructor arguments
     */
    encodeDeploy(args?: unknown[]): string;
    /**
     * Parse contract ABI
     */
    private parseABI;
    /**
     * Parse individual ABI fragment
     */
    private parseFragment;
    /**
     * Parse function fragment
     */
    private parseFunctionFragment;
    /**
     * Parse event fragment
     */
    private parseEventFragment;
    /**
     * Parse constructor fragment
     */
    private parseConstructorFragment;
    /**
     * Parse fallback fragment
     */
    private parseFallbackFragment;
    /**
     * Parse receive fragment
     */
    private parseReceiveFragment;
    /**
     * Parse parameter type
     */
    private parseParamType;
    /**
     * Create function signature
     */
    private createFunctionSignature;
    /**
     * Create event signature
     */
    private createEventSignature;
    /**
     * Encode arguments
     */
    private encodeArguments;
    /**
     * Decode event log
     */
    private decodeEventLog;
}
/**
 * Contract implementation
 */
export declare class Contract extends EventEmitter implements EvmContract {
    readonly provider: any;
    readonly signer?: any;
    readonly address: Address;
    readonly abi: any[];
    readonly interface: Interface;
    constructor(address: Address, abi: ContractABI, provider: any, signer?: any);
    /**
     * Connect contract to a signer
     */
    connect(signer: any): Contract;
    /**
     * Attach to new address
     */
    attach(newAddress: Address): Contract;
    /**
     * Call contract method (read-only)
     */
    call(method: string, params?: unknown[], overrides?: CallOptions): Promise<unknown>;
    /**
     * Send transaction to contract method (write)
     */
    send(method: string, params?: unknown[], overrides?: TransactionOptions): Promise<TransactionHash>;
    /**
     * Estimate gas for contract method call
     */
    estimateGas(method: string, params?: unknown[], overrides?: EvmEstimateGasOptions): Promise<number>;
    /**
     * Get past events
     */
    getPastEvents(eventName: string, filter?: EventFilterOptions): Promise<EvmLog[]>;
    /**
     * Subscribe to contract events
     */
    subscribe(eventName: string, filter?: EventFilterOptions): EventSubscription;
    /**
     * Parse transaction receipt for events
     */
    parseTransactionReceipt(receipt: any): Array<{
        name: string;
        args: unknown[];
        signature: string;
    }>;
    /**
     * Deploy contract (static method)
     */
    static deploy(abi: ContractABI, bytecode: string, args: unknown[], signer: any, overrides?: TransactionOptions): Promise<Contract>;
    /**
     * Get contract bytecode
     */
    getBytecode(): Promise<string>;
    /**
     * Check if contract exists
     */
    exists(): Promise<boolean>;
    /**
     * Build event topics for filtering
     */
    private buildEventTopics;
    /**
     * Encode value for topic filtering
     */
    private encodeTopicValue;
}
/**
 * ERC20 Token Contract
 */
export declare class ERC20Contract extends Contract implements Erc20Contract {
    constructor(address: Address, provider: any, signer?: any);
    name(): Promise<string>;
    symbol(): Promise<string>;
    decimals(): Promise<number>;
    totalSupply(): Promise<Balance>;
    balanceOf(account: Address): Promise<Balance>;
    allowance(owner: Address, spender: Address): Promise<Balance>;
    transfer(to: Address, amount: Balance): Promise<TransactionHash>;
    approve(spender: Address, amount: Balance): Promise<TransactionHash>;
    transferFrom(from: Address, to: Address, amount: Balance): Promise<TransactionHash>;
    /**
     * Get formatted balance with decimals
     */
    getFormattedBalance(account: Address): Promise<string>;
}
/**
 * ERC721 NFT Contract
 */
export declare class ERC721Contract extends Contract implements Erc721Contract {
    constructor(address: Address, provider: any, signer?: any);
    ownerOf(tokenId: bigint): Promise<Address>;
    tokenURI(tokenId: bigint): Promise<string>;
    balanceOf(account: Address): Promise<number>;
    transferFrom(from: Address, to: Address, tokenId: bigint): Promise<TransactionHash>;
    safeTransferFrom(from: Address, to: Address, tokenId: bigint, data?: string): Promise<TransactionHash>;
    approve(approved: Address, tokenId: bigint): Promise<TransactionHash>;
    setApprovalForAll(operator: Address, approved: boolean): Promise<TransactionHash>;
    isApprovedForAll(owner: Address, operator: Address): Promise<boolean>;
}
/**
 * Contract Factory
 */
export declare class ContractFactory {
    readonly interface: Interface;
    readonly bytecode: string;
    readonly signer: any;
    constructor(interface: Interface, bytecode: string, signer: any);
    /**
     * Deploy contract
     */
    deploy(...args: unknown[]): Promise<Contract>;
    /**
     * Get deployment transaction
     */
    getDeployTransaction(...args: unknown[]): EvmTransactionRequest;
    /**
     * Connect to different signer
     */
    connect(signer: any): ContractFactory;
    /**
     * Create contract factory from ABI and bytecode
     */
    static fromContractABI(abi: ContractABI, bytecode: string, signer: any): ContractFactory;
}
export default Contract;
//# sourceMappingURL=contract.d.ts.map