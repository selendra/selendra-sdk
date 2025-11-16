/**
 * EVM Events Module for the Selendra SDK
 * Provides event subscription, filtering, and management capabilities
 * Compatible with ethers.js v6 event API
 */

import { EventEmitter } from 'events';
import type { Address, BlockNumber, BlockHash } from '../types/common';
import type { EvmLog, EvmFilter } from '../types/evm';
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
export class EventManager extends EventEmitter {
  private subscriptions = new Map<string, EventSubscription>();
  private nextSubscriptionId = 1;

  constructor(private provider: any) {
    super();
    this.setupProviderEvents();
  }

  /**
   * Subscribe to events matching a filter
   */
  async subscribe(
    filter: EventFilter,
    options: EventSubscriptionOptions = {},
  ): Promise<EventSubscription> {
    const subscriptionId = `event_${this.nextSubscriptionId++}`;
    const subscription = new EventSubscription(subscriptionId, filter, this.provider, options);

    this.subscriptions.set(subscriptionId, subscription);
    this.setupSubscriptionEvents(subscription);

    await subscription.start();

    return subscription;
  }

  /**
   * Subscribe to contract events
   */
  async subscribeContract(
    contract: Contract,
    eventName: string,
    args: unknown[] = [],
    options: EventSubscriptionOptions = {},
  ): Promise<EventSubscription> {
    const fragment = contract.interface.getEvent(eventName);
    if (!fragment) {
      throw new Error(`Event ${eventName} not found in contract interface`);
    }

    const topics = [fragment.signature];

    // Add argument filters for indexed parameters
    if (args.length > 0) {
      for (let i = 0; i < fragment.inputs.length && i < args.length; i++) {
        const input = fragment.inputs[i];
        if (input.indexed && args[i] !== undefined && args[i] !== null) {
          topics[i + 1] = this.encodeTopicValue(args[i], input.type);
        }
      }
    }

    const filter: EventFilter = {
      address: contract.address,
      topics,
      fromBlock: options.persist ? 'latest' : undefined,
    };

    return this.subscribe(filter, options);
  }

  /**
   * Query past events
   */
  async query(filter: EventFilter, contracts?: Contract[]): Promise<EventQueryResult> {
    const logs = await this.provider.getLogs(filter);
    const events: ParsedEvent[] = [];

    for (const log of logs) {
      let parsedEvent: ParsedEvent | null = null;

      // Try to parse with provided contracts first
      if (contracts) {
        for (const contract of contracts) {
          if (log.address.toLowerCase() === contract.address.toLowerCase()) {
            const parsed = contract.interface.parseLog(log);
            if (parsed) {
              parsedEvent = {
                name: parsed.name,
                signature: parsed.signature,
                args: parsed.args,
                log,
                address: log.address,
                blockNumber: log.blockNumber,
                blockHash: log.blockHash,
                transactionHash: log.transactionHash,
                logIndex: log.logIndex,
                removed: log.removed,
              };
              break;
            }
          }
        }
      }

      // If not parsed, create basic event data
      if (!parsedEvent) {
        parsedEvent = {
          name: 'Unknown',
          signature: '',
          args: [],
          log,
          address: log.address,
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          transactionHash: log.transactionHash,
          logIndex: log.logIndex,
          removed: log.removed,
        };
      }

      events.push(parsedEvent);
    }

    return {
      logs,
      events,
      count: logs.length,
      fromBlock: filter.fromBlock || 'earliest',
      toBlock: filter.toBlock || 'latest',
    };
  }

  /**
   * Get events for a transaction
   */
  async getTransactionEvents(
    transactionHash: string,
    contracts?: Contract[],
  ): Promise<ParsedEvent[]> {
    const receipt = await this.provider.getTransactionReceipt(transactionHash);
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    const events: ParsedEvent[] = [];

    for (const log of receipt.logs) {
      let parsedEvent: ParsedEvent | null = null;

      // Try to parse with provided contracts
      if (contracts) {
        for (const contract of contracts) {
          if (log.address.toLowerCase() === contract.address.toLowerCase()) {
            const parsed = contract.interface.parseLog(log);
            if (parsed) {
              parsedEvent = {
                name: parsed.name,
                signature: parsed.signature,
                args: parsed.args,
                log,
                address: log.address,
                blockNumber: receipt.blockNumber,
                blockHash: receipt.blockHash,
                transactionHash,
                logIndex: log.logIndex,
                removed: log.removed,
              };
              break;
            }
          }
        }
      }

      // If not parsed, create basic event data
      if (!parsedEvent) {
        parsedEvent = {
          name: 'Unknown',
          signature: '',
          args: [],
          log,
          address: log.address,
          blockNumber: receipt.blockNumber,
          blockHash: receipt.blockHash,
          transactionHash,
          logIndex: log.logIndex,
          removed: log.removed,
        };
      }

      events.push(parsedEvent);
    }

    return events;
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get subscription by ID
   */
  getSubscription(id: string): EventSubscription | undefined {
    return this.subscriptions.get(id);
  }

  /**
   * Unsubscribe from all events
   */
  async unsubscribeAll(): Promise<void> {
    const unsubscribes = Array.from(this.subscriptions.values()).map((sub) => sub.stop());
    await Promise.all(unsubscribes);
    this.subscriptions.clear();
  }

  /**
   * Setup provider event listeners
   */
  private setupProviderEvents(): void {
    if (this.provider.on) {
      this.provider.on('disconnected', () => {
        // Handle provider disconnection
        this.emit('disconnected');
      });

      this.provider.on('connected', () => {
        // Handle provider reconnection
        this.emit('connected');
      });
    }
  }

  /**
   * Setup subscription event listeners
   */
  private setupSubscriptionEvents(subscription: EventSubscription): void {
    subscription.on('data', (event: ParsedEvent) => {
      this.emit('event', event);
    });

    subscription.on('error', (error: Error) => {
      this.emit('error', error);
    });

    subscription.on('stopped', () => {
      this.subscriptions.delete(subscription.id);
    });
  }

  /**
   * Encode value for topic filtering
   */
  private encodeTopicValue(value: unknown, type: string): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (type === 'address') {
      return typeof value === 'string' ? value.toLowerCase() : String(value);
    }

    if (type.startsWith('uint') || type.startsWith('int')) {
      const num = typeof value === 'bigint' ? value : BigInt(String(value));
      return '0x' + num.toString(16).padStart(64, '0');
    }

    if (type === 'bool') {
      return value ? '0x1' : '0x0';
    }

    if (type === 'bytes32') {
      return typeof value === 'string'
        ? value
        : '0x' + Buffer.from(String(value)).toString('hex').padEnd(64, '0');
    }

    // For other types, convert to string
    const str = String(value);
    return str.startsWith('0x') ? str : '0x' + Buffer.from(str).toString('hex');
  }
}

/**
 * Event subscription class
 */
export class EventSubscription extends EventEmitter {
  private isStarted = false;
  private subscriptionId?: string;
  private eventCount = 0;
  private timeoutTimer?: NodeJS.Timeout;

  constructor(
    public readonly id: string,
    private readonly filter: EventFilter,
    private readonly provider: any,
    private readonly options: EventSubscriptionOptions = {},
  ) {
    super();
  }

  /**
   * Start the subscription
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    try {
      if (this.provider.subscribe) {
        // WebSocket provider
        this.subscriptionId = await this.provider.subscribe('logs', this.filter);
        this.setupWebSocketEvents();
      } else {
        // HTTP provider - start polling
        this.startPolling();
      }

      this.isStarted = true;
      this.setupTimeout();

      this.emit('started');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the subscription
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    this.isStarted = false;

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }

    if (this.subscriptionId && this.provider.unsubscribe) {
      try {
        await this.provider.unsubscribe(this.subscriptionId);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    this.emit('stopped');
    this.removeAllListeners();
  }

  /**
   * Check if subscription is active
   */
  isActive(): boolean {
    return this.isStarted;
  }

  /**
   * Get subscription filter
   */
  getFilter(): EventFilter {
    return { ...this.filter };
  }

  /**
   * Get subscription options
   */
  getOptions(): EventSubscriptionOptions {
    return { ...this.options };
  }

  /**
   * Get event count
   */
  getEventCount(): number {
    return this.eventCount;
  }

  /**
   * Setup WebSocket events
   */
  private setupWebSocketEvents(): void {
    if (!this.subscriptionId) {
      return;
    }

    this.provider.on(this.subscriptionId, (log: EvmLog) => {
      this.handleLog(log);
    });
  }

  /**
   * Start polling for HTTP providers
   */
  private startPolling(): void {
    const poll = async () => {
      if (!this.isStarted) {
        return;
      }

      try {
        const currentBlock = await this.provider.getBlockNumber();
        const fromBlock = this.filter.fromBlock || 'latest';

        const filter = {
          ...this.filter,
          fromBlock: typeof fromBlock === 'number' ? fromBlock : currentBlock - 10, // Last 10 blocks
          toBlock: 'latest',
        };

        const logs = await this.provider.getLogs(filter);

        for (const log of logs) {
          this.handleLog(log);
        }
      } catch (error) {
        this.emit('error', error);
      }

      setTimeout(poll, 5000); // Poll every 5 seconds
    };

    poll();
  }

  /**
   * Handle received log
   */
  private handleLog(log: EvmLog): void {
    this.eventCount++;

    const event: ParsedEvent = {
      name: 'Unknown',
      signature: '',
      args: [],
      log,
      address: log.address,
      blockNumber: log.blockNumber,
      blockHash: log.blockHash,
      transactionHash: log.transactionHash,
      logIndex: log.logIndex,
      removed: log.removed,
    };

    this.emit('data', event);

    // Check max events limit
    if (this.options.maxEvents && this.eventCount >= this.options.maxEvents) {
      this.stop();
      this.options.onComplete?.();
    }
  }

  /**
   * Setup subscription timeout
   */
  private setupTimeout(): void {
    if (this.options.timeout) {
      this.timeoutTimer = setTimeout(() => {
        this.stop();
        this.options.onComplete?.();
      }, this.options.timeout);
    }
  }
}

/**
 * Event filters utilities
 */
export class EventFilters {
  /**
   * Create filter for specific contract address
   */
  static address(address: Address | Address[]): EventFilter {
    return {
      address,
    };
  }

  /**
   * Create filter for specific topics
   */
  static topics(topics: (string | string[] | null)[]): EventFilter {
    return {
      topics,
    };
  }

  /**
   * Create filter for block range
   */
  static blockRange(
    fromBlock: BlockNumber | 'earliest' | 'latest' | 'pending',
    toBlock: BlockNumber | 'earliest' | 'latest' | 'pending',
  ): EventFilter {
    return {
      fromBlock,
      toBlock,
    };
  }

  /**
   * Create filter for transfer events (ERC20/ERC721)
   */
  static transferEvents(from?: Address | null, to?: Address | null): EventFilter {
    const transferSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'; // Transfer(address,address,uint256)

    const topics: (string | string[] | null)[] = [transferSignature];

    if (from !== undefined) {
      topics.push(from ? (Array.isArray(from) ? from : [from]) : null);
    } else {
      topics.push(null);
    }

    if (to !== undefined) {
      topics.push(to ? (Array.isArray(to) ? to : [to]) : null);
    } else {
      topics.push(null);
    }

    topics.push(null); // Value/tokenId (not indexed)

    return {
      topics,
    };
  }

  /**
   * Create filter for approval events (ERC20/ERC721)
   */
  static approvalEvents(owner?: Address | null, spender?: Address | null): EventFilter {
    const approvalSignature = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'; // Approval(address,address,uint256)

    const topics: (string | string[] | null)[] = [approvalSignature];

    if (owner !== undefined) {
      topics.push(owner ? (Array.isArray(owner) ? owner : [owner]) : null);
    } else {
      topics.push(null);
    }

    if (spender !== undefined) {
      topics.push(spender ? (Array.isArray(spender) ? spender : [spender]) : null);
    } else {
      topics.push(null);
    }

    topics.push(null); // Value/tokenId (not indexed)

    return {
      topics,
    };
  }

  /**
   * Combine multiple filters
   */
  static combine(...filters: EventFilter[]): EventFilter {
    const combined: EventFilter = {};

    for (const filter of filters) {
      if (filter.address) {
        if (combined.address) {
          if (Array.isArray(combined.address) && Array.isArray(filter.address)) {
            combined.address = [...combined.address, ...filter.address];
          } else if (Array.isArray(combined.address)) {
            combined.address.push(filter.address as Address);
          } else if (Array.isArray(filter.address)) {
            combined.address = [combined.address as Address, ...filter.address];
          } else {
            combined.address = [combined.address as Address, filter.address];
          }
        } else {
          combined.address = filter.address;
        }
      }

      if (filter.topics) {
        if (!combined.topics) {
          combined.topics = [];
        }

        for (let i = 0; i < Math.max(combined.topics.length, filter.topics.length); i++) {
          const topic1 = combined.topics[i];
          const topic2 = filter.topics[i];

          if (topic1 && topic2) {
            // Both filters have topic at this position
            if (Array.isArray(topic1) && Array.isArray(topic2)) {
              combined.topics[i] = [...new Set([...topic1, ...topic2])];
            } else if (Array.isArray(topic1)) {
              const t2 = String(topic2);
              combined.topics[i] = topic1.includes(t2) ? topic1 : [...topic1, t2];
            } else if (Array.isArray(topic2)) {
              const t1 = String(topic1);
              combined.topics[i] = topic2.includes(t1) ? topic2 : [t1, ...topic2];
            } else if (topic1 !== topic2) {
              combined.topics[i] = [String(topic1), String(topic2)];
            }
          } else if (topic1) {
            // Only first filter has topic
            combined.topics[i] = topic1;
          } else if (topic2) {
            // Only second filter has topic
            combined.topics[i] = topic2;
          }
        }
      }

      if (filter.fromBlock !== undefined) {
        combined.fromBlock = filter.fromBlock;
      }

      if (filter.toBlock !== undefined) {
        combined.toBlock = filter.toBlock;
      }
    }

    return combined;
  }
}

/**
 * Event parsing utilities
 */
export class EventParser {
  /**
   * Parse ABI-encoded log data
   */
  static parseLogData(log: EvmLog): ParsedEvent {
    return {
      name: 'Unknown',
      signature: '',
      args: [],
      log,
      address: log.address,
      blockNumber: log.blockNumber,
      blockHash: log.blockHash,
      transactionHash: log.transactionHash,
      logIndex: log.logIndex,
      removed: log.removed,
    };
  }

  /**
   * Create event signature hash
   */
  static createSignature(eventName: string, inputs: Array<{ name: string; type: string }>): string {
    const types = inputs.map((input) => input.type).join(',');
    const signature = `${eventName}(${types})`;
    return '0x' + Buffer.from(signature).toString('hex').slice(0, 8);
  }

  /**
   * Decode indexed topic value
   */
  static decodeTopicValue(topic: string, type: string): any {
    const cleanTopic = topic.startsWith('0x') ? topic.slice(2) : topic;
    const buffer = Buffer.from(cleanTopic, 'hex');

    if (type === 'address') {
      return '0x' + buffer.slice(-20).toString('hex').padStart(40, '0');
    }

    if (type.startsWith('uint') || type.startsWith('int')) {
      return BigInt('0x' + buffer.toString('hex'));
    }

    if (type === 'bool') {
      return buffer[buffer.length - 1] === 1;
    }

    if (type.startsWith('bytes')) {
      return '0x' + buffer.toString('hex');
    }

    return topic;
  }

  /**
   * Encode value for topic
   */
  static encodeTopicValue(value: any, type: string): string {
    if (value === null || value === undefined) {
      return null;
    }

    if (type === 'address') {
      const address = typeof value === 'string' ? value : String(value);
      return address.toLowerCase().startsWith('0x')
        ? address.toLowerCase()
        : '0x' + address.toLowerCase();
    }

    if (type.startsWith('uint') || type.startsWith('int')) {
      const num = typeof value === 'bigint' ? value : BigInt(String(value));
      return '0x' + num.toString(16).padStart(64, '0');
    }

    if (type === 'bool') {
      return value
        ? '0x0000000000000000000000000000000000000000000000000000000000000001'
        : '0x0000000000000000000000000000000000000000000000000000000000000000';
    }

    if (type.startsWith('bytes')) {
      const bytes =
        typeof value === 'string' && value.startsWith('0x') ? value.slice(2) : String(value);
      return '0x' + bytes.padEnd(64, '0');
    }

    // Default: treat as string
    const str = String(value);
    return '0x' + Buffer.from(str).toString('hex').padEnd(64, '0');
  }
}

export default EventManager;
