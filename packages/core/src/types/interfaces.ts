/**
 * Type interfaces for the Selendra SDK
 * 
 * @module types/interfaces
 */

import { Network, ChainType } from './enums.js';

/**
 * SDK Configuration
 */
export interface SDKConfig {
  /** WebSocket or HTTP endpoint URL */
  endpoint?: string;
  /** Network to connect to */
  network?: Network | string;
  /** Chain type (Substrate or EVM) */
  chainType?: ChainType;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts on connection failure */
  retryAttempts?: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;
  /** Enable automatic reconnection */
  autoReconnect?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Additional custom configuration */
  [key: string]: any;
}

/**
 * Connection information
 */
export interface ConnectionInfo {
  /** Current endpoint URL */
  endpoint: string;
  /** Current network */
  network: Network | string;
  /** Current chain type */
  chainType: ChainType;
  /** Whether currently connected */
  isConnected: boolean;
  /** Whether currently connecting */
  isConnecting: boolean;
  /** Last connection timestamp */
  connectedAt?: number;
  /** Connection latency in milliseconds */
  latency?: number;
}

/**
 * SDK Events interface
 */
export interface SDKEvents {
  connecting: () => void;
  connected: () => void;
  disconnected: () => void;
  error: (error: Error) => void;
  reconnecting: (attempt: number) => void;
}
