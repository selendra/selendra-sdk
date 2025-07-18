import WebSocket from 'ws';
import { EventSubscription } from '../types';

export class WebSocketClient {
  private ws?: WebSocket;
  private url: string;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private messageId: number = 1;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    this.subscriptions.clear();
  }

  /**
   * Send message to server
   */
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket not connected');
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      if (message.result && message.result.subscription) {
        const subscription = this.subscriptions.get(message.result.subscription);
        if (subscription) {
          subscription.callback(message.result.data);
        }
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle reconnection
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Subscribe to new blocks
   */
  async subscribeToBlocks(callback: (block: any) => void): Promise<EventSubscription> {
    const id = this.messageId++;
    const subscriptionId = `block_${id}`;

    const message = {
      jsonrpc: '2.0',
      method: 'subscribe_blocks',
      params: { includeTransactions: false },
      id
    };

    this.send(message);

    const subscription: EventSubscription = {
      id: subscriptionId,
      active: true,
      callback,
      unsubscribe: () => this.unsubscribe(subscriptionId)
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Subscribe to pending transactions
   */
  async subscribeToPendingTransactions(callback: (tx: any) => void): Promise<EventSubscription> {
    const id = this.messageId++;
    const subscriptionId = `pending_tx_${id}`;

    const message = {
      jsonrpc: '2.0',
      method: 'subscribe_pending_transactions',
      params: {},
      id
    };

    this.send(message);

    const subscription: EventSubscription = {
      id: subscriptionId,
      active: true,
      callback,
      unsubscribe: () => this.unsubscribe(subscriptionId)
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Subscribe to address transactions
   */
  async subscribeToAddressTransactions(
    addresses: string[],
    callback: (tx: any) => void
  ): Promise<EventSubscription> {
    const id = this.messageId++;
    const subscriptionId = `address_tx_${id}`;

    const message = {
      jsonrpc: '2.0',
      method: 'subscribe_address_transactions',
      params: {
        addresses,
        direction: 'both'
      },
      id
    };

    this.send(message);

    const subscription: EventSubscription = {
      id: subscriptionId,
      active: true,
      callback,
      unsubscribe: () => this.unsubscribe(subscriptionId)
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Subscribe to contract events
   */
  async subscribeToContractEvents(
    contractAddress: string,
    topics: string[],
    callback: (event: any) => void
  ): Promise<EventSubscription> {
    const id = this.messageId++;
    const subscriptionId = `contract_events_${id}`;

    const message = {
      jsonrpc: '2.0',
      method: 'subscribe_contract_events',
      params: {
        address: contractAddress,
        topics
      },
      id
    };

    this.send(message);

    const subscription: EventSubscription = {
      id: subscriptionId,
      active: true,
      callback,
      unsubscribe: () => this.unsubscribe(subscriptionId)
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Subscribe to gas price updates
   */
  async subscribeToGasPrices(callback: (gasPrice: any) => void): Promise<EventSubscription> {
    const id = this.messageId++;
    const subscriptionId = `gas_prices_${id}`;

    const message = {
      jsonrpc: '2.0',
      method: 'subscribe_gas_prices',
      params: { interval: 30000 },
      id
    };

    this.send(message);

    const subscription: EventSubscription = {
      id: subscriptionId,
      active: true,
      callback,
      unsubscribe: () => this.unsubscribe(subscriptionId)
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Unsubscribe from a subscription
   */
  private unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
      this.subscriptions.delete(subscriptionId);

      const message = {
        jsonrpc: '2.0',
        method: 'unsubscribe',
        params: { subscription: subscriptionId },
        id: this.messageId++
      };

      try {
        this.send(message);
      } catch (error) {
        console.error('Failed to send unsubscribe message:', error);
      }
    }
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}