"use strict";
/**
 * Connection management types for the Selendra SDK
 * Provides comprehensive type definitions for connection configuration, state, and error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_POOL_CONFIG = exports.DEFAULT_HEALTH_CHECK = exports.DEFAULT_CONNECTION_TIMEOUT = exports.DEFAULT_RETRY_CONFIG = exports.JsonRpcConnectionError = exports.WebSocketConnectionError = exports.ConnectionRetryExhaustedError = exports.ConnectionTimeoutError = exports.ConnectionError = exports.ConnectionState = exports.ConnectionType = void 0;
/**
 * Connection type enumeration
 */
var ConnectionType;
(function (ConnectionType) {
    ConnectionType["HTTP"] = "http";
    ConnectionType["WEBSOCKET"] = "websocket";
})(ConnectionType || (exports.ConnectionType = ConnectionType = {}));
/**
 * Connection state enumeration representing the lifecycle of a connection
 */
var ConnectionState;
(function (ConnectionState) {
    ConnectionState["DISCONNECTED"] = "disconnected";
    ConnectionState["CONNECTING"] = "connecting";
    ConnectionState["CONNECTED"] = "connected";
    ConnectionState["RECONNECTING"] = "reconnecting";
    ConnectionState["ERROR"] = "error";
    ConnectionState["CLOSING"] = "closing";
})(ConnectionState || (exports.ConnectionState = ConnectionState = {}));
/**
 * Connection-specific error types
 */
class ConnectionError extends Error {
    constructor(message, code, endpoint, cause) {
        super(message);
        Object.defineProperty(this, "code", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: code
        });
        Object.defineProperty(this, "endpoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: endpoint
        });
        Object.defineProperty(this, "cause", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: cause
        });
        this.name = 'ConnectionError';
    }
}
exports.ConnectionError = ConnectionError;
/**
 * Timeout error for connection operations
 */
class ConnectionTimeoutError extends ConnectionError {
    constructor(message, timeout, endpoint) {
        super(message, 'TIMEOUT', endpoint);
        Object.defineProperty(this, "timeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: timeout
        });
        this.name = 'ConnectionTimeoutError';
    }
}
exports.ConnectionTimeoutError = ConnectionTimeoutError;
/**
 * Retry exhausted error when all retry attempts fail
 */
class ConnectionRetryExhaustedError extends ConnectionError {
    constructor(message, attempts, endpoint, lastError) {
        super(message, 'RETRY_EXHAUSTED', endpoint, lastError);
        Object.defineProperty(this, "attempts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: attempts
        });
        Object.defineProperty(this, "lastError", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: lastError
        });
        this.name = 'ConnectionRetryExhaustedError';
    }
}
exports.ConnectionRetryExhaustedError = ConnectionRetryExhaustedError;
/**
 * WebSocket-specific connection error
 */
class WebSocketConnectionError extends ConnectionError {
    constructor(message, event, endpoint) {
        super(message, 'WEBSOCKET_ERROR', endpoint);
        Object.defineProperty(this, "event", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: event
        });
        this.name = 'WebSocketConnectionError';
    }
}
exports.WebSocketConnectionError = WebSocketConnectionError;
/**
 * JSON-RPC specific error
 */
class JsonRpcConnectionError extends ConnectionError {
    constructor(message, rpcError, endpoint) {
        super(message, 'JSON_RPC_ERROR', endpoint);
        Object.defineProperty(this, "rpcError", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: rpcError
        });
        this.name = 'JsonRpcConnectionError';
    }
}
exports.JsonRpcConnectionError = JsonRpcConnectionError;
/**
 * Default retry configuration matching the Rust client (10 attempts, 6s delays)
 */
exports.DEFAULT_RETRY_CONFIG = {
    maxAttempts: 10,
    delayMs: 6000,
    exponentialBackoff: false,
    maxBackoffMultiplier: 4,
    jitter: true
};
/**
 * Default connection timeout
 */
exports.DEFAULT_CONNECTION_TIMEOUT = 30000; // 30 seconds
/**
 * Default health check configuration
 */
exports.DEFAULT_HEALTH_CHECK = {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000 // 5 seconds
};
/**
 * Default connection pool configuration
 */
exports.DEFAULT_POOL_CONFIG = {
    maxConnections: 10,
    minConnections: 2,
    acquireTimeout: 5000,
    idleTimeout: 60000,
    loadBalancer: 'round-robin'
};
//# sourceMappingURL=connection.js.map