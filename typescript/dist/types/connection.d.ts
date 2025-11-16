/**
 * Connection management types for the Selendra SDK
 * Provides comprehensive type definitions for connection configuration, state, and error handling
 */
/**
 * Connection protocol types supported by the SDK
 */
export type ConnectionProtocol = 'http' | 'https' | 'ws' | 'wss';
/**
 * Connection type enumeration
 */
export declare enum ConnectionType {
    HTTP = "http",
    WEBSOCKET = "websocket"
}
/**
 * Connection state enumeration representing the lifecycle of a connection
 */
export declare enum ConnectionState {
    DISCONNECTED = "disconnected",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    RECONNECTING = "reconnecting",
    ERROR = "error",
    CLOSING = "closing"
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
export type ConnectionEventType = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error' | 'health-check' | 'state-change' | 'subscription-created' | 'subscription-removed';
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
export declare class ConnectionError extends Error {
    readonly code: string;
    readonly endpoint?: string;
    readonly cause?: Error;
    constructor(message: string, code: string, endpoint?: string, cause?: Error);
}
/**
 * Timeout error for connection operations
 */
export declare class ConnectionTimeoutError extends ConnectionError {
    readonly timeout: number;
    constructor(message: string, timeout: number, endpoint?: string);
}
/**
 * Retry exhausted error when all retry attempts fail
 */
export declare class ConnectionRetryExhaustedError extends ConnectionError {
    readonly attempts: number;
    readonly lastError?: Error;
    constructor(message: string, attempts: number, endpoint?: string, lastError?: Error);
}
/**
 * WebSocket-specific connection error
 */
export declare class WebSocketConnectionError extends ConnectionError {
    readonly event: Event;
    constructor(message: string, event: Event, endpoint?: string);
}
/**
 * JSON-RPC specific error
 */
export declare class JsonRpcConnectionError extends ConnectionError {
    readonly rpcError: JsonRpcError;
    constructor(message: string, rpcError: JsonRpcError, endpoint?: string);
}
/**
 * Default retry configuration matching the Rust client (10 attempts, 6s delays)
 */
export declare const DEFAULT_RETRY_CONFIG: RetryConfig;
/**
 * Default connection timeout
 */
export declare const DEFAULT_CONNECTION_TIMEOUT = 30000;
/**
 * Default health check configuration
 */
export declare const DEFAULT_HEALTH_CHECK: {
    readonly enabled: true;
    readonly interval: 30000;
    readonly timeout: 5000;
};
/**
 * Default connection pool configuration
 */
export declare const DEFAULT_POOL_CONFIG: ConnectionPoolConfig;
//# sourceMappingURL=connection.d.ts.map