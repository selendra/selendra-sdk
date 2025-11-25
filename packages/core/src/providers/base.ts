/**
 * Base Provider Interface
 * 
 * All chain providers should implement this interface
 * 
 * @module providers/base
 */

import EventEmitter from 'eventemitter3';
import type { SDKConfig } from '../types/index.js';

/**
 * Base provider events
 */
export interface BaseProviderEvents {
  connected: () => void;
  disconnected: () => void;
  error: (error: Error) => void;
}

/**
 * Abstract base class for chain providers
 */
export abstract class BaseProvider extends EventEmitter<BaseProviderEvents> {
  protected config: SDKConfig;
  protected _isConnected = false;

  constructor(config: SDKConfig) {
    super();
    this.config = config;
  }

  /**
   * Check if provider is connected
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Connect to the network
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnect from the network
   */
  abstract disconnect(): Promise<void>;

  /**
   * Get provider-specific client instance
   */
  abstract getClient(): any;

  /**
   * Log debug messages
   */
  protected log(...args: any[]): void {
    if (this.config.debug) {
      console.log(`[${this.constructor.name}]`, ...args);
    }
  }
}
