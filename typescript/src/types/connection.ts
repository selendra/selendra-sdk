/**
 * Connection management types for the Selendra SDK
 * Provides comprehensive type definitions for connection configuration, state, and error handling
 */

import type { EventEmitter } from 'eventemitter3';

/**
 * Connection protocol types supported by the SDK
 */
export type ConnectionProtocol = 'http' | 'https' | 'ws' | 'wss';

/**
 * Connection type enumeration
 */
export enum ConnectionType {
  HTTP = 'http',
  WEBSOCKET = 'websocket'
}

/**
 * Connection state enumeration representing the lifecycle of a connection
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
  CLOSING = 'closing'
}

/**
 * Connection health status
 */
export interface ConnectionHealth {
  /** Current health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Response time in milliseconds */
  responseTime: number;
  /** Timestamp of last health check */
  lastCheck: Date;
  /** Number of consecutive failed health checks */
  consecutiveFailures: number;
}

/**
 * Retry configuration for connection attempts
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 10, matching Rust client) */
  maxAttempts: number;
  /** Delay between retries in milliseconds (default: 6000, matching Rust client) */
  delayMs: number;
  /** Enable exponential backoff */
  exponentialBackoff: boolean;
  /** Maximum backoff multiplier */
  maxBackoffMultiplier: number;
  /** Jitter to prevent thundering herd */
  jitter: boolean;
}

/**
 * Base connection configuration interface
 */
export interface ConnectionConfig {
  /** Connection endpoint URL */
  endpoint: string;
  /** Connection type (HTTP or WebSocket) */
  type: ConnectionType;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: Partial<RetryConfig>;
  /** Custom headers for HTTP connections */
  headers?: Record<string, string>;
  /** WebSocket-specific configuration */
  websocket?: {
    /** WebSocket subprotocols */
    protocols?: string[];
    /** Ping interval in milliseconds */
    pingInterval?: number;
    /** Pong timeout in milliseconds */
    pongTimeout?: number;
  };
  /** Enable automatic reconnection */
  autoReconnect?: boolean;
  /** Health check configuration */
  healthCheck?: {
    /** Enable health checks */
    enabled: boolean;
    /** Health check interval in milliseconds */
    interval: number;
    /** Health check timeout in milliseconds */
    timeout: number;
  };
  /** Custom metadata for the connection */
  metadata?: Record<string, unknown>;
}

/**
 * Connection pool configuration
 */
export interface ConnectionPoolConfig {
  /** Maximum number of connections in the pool */
  maxConnections: number;
  /** Minimum number of connections to maintain */
  minConnections: number;
  /** Connection acquisition timeout in milliseconds */
  acquireTimeout: number;
  /** Idle connection timeout in milliseconds */
  idleTimeout: number;
  /** Load balancing strategy */
  loadBalancer: 'round-robin' | 'least-connections' | 'random';
}

/**
 * Subscription configuration for WebSocket connections
 */
export interface SubscriptionConfig {
  /** Unique subscription identifier */
  id: string;
  /** Method to subscribe to */
  method: string;
  /** Parameters for the subscription */
  params: unknown[];
  /** Subscription callback function */
  callback: (data: unknown) => void;
  /** Error callback function */
  onError?: (error: Error) => void;
  /** Unsubscribe callback function */
  onUnsubscribe?: () => void;
  /** Subscription timeout in milliseconds */
  timeout?: number;
}

/**
 * Connection event data types
 */
export interface ConnectionEventData {
  /** Connection that emitted the event */
  connection: string;
  /** Timestamp of the event */
  timestamp: Date;
  /** Additional event-specific data */
  data?: Record<string, unknown>;
}

/**
 * Connection error event data
 */
export interface ConnectionErrorEventData extends ConnectionEventData {
  /** Error that occurred */
  error: Error;
  /** Number of retry attempts made */
  retryAttempt?: number;
}

/**
 * Connection state change event data
 */
export interface ConnectionStateChangeEventData extends ConnectionEventData {
  /** Previous connection state */
  previousState: ConnectionState;
  /** New connection state */
  newState: ConnectionState;
}

/**
 * Connection metrics for monitoring and debugging
 */
export interface ConnectionMetrics {
  /** Total number of requests made */
  totalRequests: number;
  /** Number of successful requests */
  successfulRequests: number;
  /** Number of failed requests */
  failedRequests: number;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** Number of reconnections */
  reconnections: number;
  /** Uptime in milliseconds */
  uptime: number;
  /** Timestamp of connection establishment */
  connectedAt?: Date;
  /** Last activity timestamp */
  lastActivity: Date;
}

/**
 * Connection event types
 */
export type ConnectionEventType =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error'
  | 'health-check'
  | 'state-change'
  | 'subscription-created'
  | 'subscription-removed';

/**
 * Connection event listener type
 */
export type ConnectionEventListener<T = ConnectionEventData> = (event: T) => void;

/**
 * Event emitter interface for connection events
 */
export interface ConnectionEventEmitter {
  /** Add event listener */
  on<T = ConnectionEventData>(event: ConnectionEventType, listener: ConnectionEventListener<T>): void;
  /** Add one-time event listener */
  once<T = ConnectionEventData>(event: ConnectionEventType, listener: ConnectionEventListener<T>): void;
  /** Remove event listener */
  off<T = ConnectionEventData>(event: ConnectionEventType, listener: ConnectionEventListener<T>): void;
  /** Remove all event listeners */
  removeAllListeners(event?: ConnectionEventType): void;
  /** Emit an event */
  emit<T = ConnectionEventData>(event: ConnectionEventType, data: T): boolean;
}

/**
 * JSON-RPC request interface
 */
export interface JsonRpcRequest {
  /** JSON-RPC version */
  jsonrpc: '2.0';
  /** Request identifier */
  id: string | number;
  /** Method to call */
  method: string;
  /** Method parameters */
  params?: unknown[];
}

/**
 * JSON-RPC response interface
 */
export interface JsonRpcResponse<T = unknown> {
  /** JSON-RPC version */
  jsonrpc: '2.0';
  /** Response identifier matching the request */
  id: string | number | null;
  /** Response result or error */
  result?: T;
  /** Error information if request failed */
  error?: JsonRpcError;
}

/**
 * JSON-RPC error interface
 */
export interface JsonRpcError {
  /** Error code */
  code: number;
  /** Error message */
  message: string;
  /** Additional error data */
  data?: unknown;
}

/**
 * Connection-specific error types
 */
export class ConnectionError extends Error {
  public constructor(
    message: string,
    public readonly code: string,
    public readonly endpoint?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ConnectionError';
  }
}

/**
 * Timeout error for connection operations
 */
export class ConnectionTimeoutError extends ConnectionError {
  public constructor(
    message: string,
    public readonly timeout: number,
    endpoint?: string
  ) {
    super(message, 'TIMEOUT', endpoint);
    this.name = 'ConnectionTimeoutError';
  }
}

/**
 * Retry exhausted error when all retry attempts fail
 */
export class ConnectionRetryExhaustedError extends ConnectionError {
  public constructor(
    message: string,
    public readonly attempts: number,
    endpoint?: string,
    public readonly lastError?: Error
  ) {
    super(message, 'RETRY_EXHAUSTED', endpoint, lastError);
    this.name = 'ConnectionRetryExhaustedError';
  }
}

/**
 * WebSocket-specific connection error
 */
export class WebSocketConnectionError extends ConnectionError {
  public constructor(
    message: string,
    public readonly event: Event,
    endpoint?: string
  ) {
    super(message, 'WEBSOCKET_ERROR', endpoint);
    this.name = 'WebSocketConnectionError';
  }
}

/**
 * JSON-RPC specific error
 */
export class JsonRpcConnectionError extends ConnectionError {
  public constructor(
    message: string,
    public readonly rpcError: JsonRpcError,
    endpoint?: string
  ) {
    super(message, 'JSON_RPC_ERROR', endpoint);
    this.name = 'JsonRpcConnectionError';
  }
}

/**
 * Default retry configuration matching the Rust client (10 attempts, 6s delays)
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 10,
  delayMs: 6000,
  exponentialBackoff: false,
  maxBackoffMultiplier: 4,
  jitter: true
} as const;

/**
 * Default connection timeout
 */
export const DEFAULT_CONNECTION_TIMEOUT = 30000; // 30 seconds

/**
 * Default health check configuration
 */
export const DEFAULT_HEALTH_CHECK = {
  enabled: true,
  interval: 30000, // 30 seconds
  timeout: 5000    // 5 seconds
} as const;

/**
 * Default connection pool configuration
 */
export const DEFAULT_POOL_CONFIG: ConnectionPoolConfig = {
  maxConnections: 10,
  minConnections: 2,
  acquireTimeout: 5000,
  idleTimeout: 60000,
  loadBalancer: 'round-robin'
} as const;