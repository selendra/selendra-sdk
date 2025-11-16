/**
 * EVM Events Module for the Selendra SDK
 * Provides event subscription, filtering, and management capabilities
 * Compatible with ethers.js v6 event API
 */
import { EventEmitter } from 'events';
import type { Address, BlockNumber, BlockHash } from '../types/common';
import type { EvmLog } from '../types/evm';
import { Contract } from './contract';
/**
 * Event filter interface
 */
export interface EventFilter {
    /** Contract address or addresses */
    address?: Address | Address[];
    /** Event topics */
    topics?: (string | string[] | null)[];
    /** From block */
    fromBlock?: BlockNumber | 'earliest' | 'latest' | 'pending';
    /** To block */
    toBlock?: BlockNumber | 'earliest' | 'latest' | 'pending';
}
/**
 * Event subscription options
 */
export interface EventSubscriptionOptions {
    /** Whether subscription should persist across reconnections */
    persist?: boolean;
    /** Maximum number of events to receive */
    maxEvents?: number;
    /** Subscription timeout in milliseconds */
    timeout?: number;
    /** Callback for subscription errors */
    onError?: (error: Error) => void;
    /** Callback for subscription completion */
    onComplete?: () => void;
}
/**
 * Parsed event data
 */
export interface ParsedEvent {
    /** Event name */
    name: string;
    /** Event signature */
    signature: string;
    /** Event arguments */
    args: unknown[];
    /** Raw log data */
    log: EvmLog;
    /** Contract address that emitted the event */
    address: Address;
    /** Block number */
    blockNumber?: BlockNumber;
    /** Block hash */
    blockHash?: BlockHash;
    /** Transaction hash */
    transactionHash?: string;
    /** Log index */
    logIndex?: number;
    /** Whether event was removed (chain reorg) */
    removed?: boolean;
}
/**
 * Event query result
 */
export interface EventQueryResult {
    /** Array of logs matching the filter */
    logs: EvmLog[];
    /** Array of parsed events */
    events: ParsedEvent[];
    /** Total number of logs found */
    count: number;
    /** Block range of the query */
    fromBlock: BlockNumber | 'earliest' | 'latest' | 'pending';
    toBlock: BlockNumber | 'earliest' | 'latest' | 'pending';
}
/**
 * Event manager for handling subscriptions and queries
 */
export declare class EventManager extends EventEmitter {
    private provider;
    private subscriptions;
    private nextSubscriptionId;
    constructor(provider: any);
    /**
     * Subscribe to events matching a filter
     */
    subscribe(filter: EventFilter, options?: EventSubscriptionOptions): Promise<EventSubscription>;
    /**
     * Subscribe to contract events
     */
    subscribeContract(contract: Contract, eventName: string, args?: unknown[], options?: EventSubscriptionOptions): Promise<EventSubscription>;
    /**
     * Query past events
     */
    query(filter: EventFilter, contracts?: Contract[]): Promise<EventQueryResult>;
    /**
     * Get events for a transaction
     */
    getTransactionEvents(transactionHash: string, contracts?: Contract[]): Promise<ParsedEvent[]>;
    /**
     * Get all active subscriptions
     */
    getActiveSubscriptions(): EventSubscription[];
    /**
     * Get subscription by ID
     */
    getSubscription(id: string): EventSubscription | undefined;
    /**
     * Unsubscribe from all events
     */
    unsubscribeAll(): Promise<void>;
    /**
     * Setup provider event listeners
     */
    private setupProviderEvents;
    /**
     * Setup subscription event listeners
     */
    private setupSubscriptionEvents;
    /**
     * Encode value for topic filtering
     */
    private encodeTopicValue;
}
/**
 * Event subscription class
 */
export declare class EventSubscription extends EventEmitter {
    readonly id: string;
    private readonly filter;
    private readonly provider;
    private readonly options;
    private isStarted;
    private subscriptionId?;
    private eventCount;
    private timeoutTimer?;
    constructor(id: string, filter: EventFilter, provider: any, options?: EventSubscriptionOptions);
    /**
     * Start the subscription
     */
    start(): Promise<void>;
    /**
     * Stop the subscription
     */
    stop(): Promise<void>;
    /**
     * Check if subscription is active
     */
    isActive(): boolean;
    /**
     * Get subscription filter
     */
    getFilter(): EventFilter;
    /**
     * Get subscription options
     */
    getOptions(): EventSubscriptionOptions;
    /**
     * Get event count
     */
    getEventCount(): number;
    /**
     * Setup WebSocket events
     */
    private setupWebSocketEvents;
    /**
     * Start polling for HTTP providers
     */
    private startPolling;
    /**
     * Handle received log
     */
    private handleLog;
    /**
     * Setup subscription timeout
     */
    private setupTimeout;
}
/**
 * Event filters utilities
 */
export declare class EventFilters {
    /**
     * Create filter for specific contract address
     */
    static address(address: Address | Address[]): EventFilter;
    /**
     * Create filter for specific topics
     */
    static topics(topics: (string | string[] | null)[]): EventFilter;
    /**
     * Create filter for block range
     */
    static blockRange(fromBlock: BlockNumber | 'earliest' | 'latest' | 'pending', toBlock: BlockNumber | 'earliest' | 'latest' | 'pending'): EventFilter;
    /**
     * Create filter for transfer events (ERC20/ERC721)
     */
    static transferEvents(from?: Address | null, to?: Address | null): EventFilter;
    /**
     * Create filter for approval events (ERC20/ERC721)
     */
    static approvalEvents(owner?: Address | null, spender?: Address | null): EventFilter;
    /**
     * Combine multiple filters
     */
    static combine(...filters: EventFilter[]): EventFilter;
}
/**
 * Event parsing utilities
 */
export declare class EventParser {
    /**
     * Parse ABI-encoded log data
     */
    static parseLogData(log: EvmLog): ParsedEvent;
    /**
     * Create event signature hash
     */
    static createSignature(eventName: string, inputs: Array<{
        name: string;
        type: string;
    }>): string;
    /**
     * Decode indexed topic value
     */
    static decodeTopicValue(topic: string, type: string): any;
    /**
     * Encode value for topic
     */
    static encodeTopicValue(value: any, type: string): string;
}
export default EventManager;
//# sourceMappingURL=events.d.ts.map