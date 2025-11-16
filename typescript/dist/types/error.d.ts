/**
 * Error types for the Selendra SDK
 */
/**
 * Error code enumeration
 */
export declare enum ErrorCode {
    CONNECTION_FAILED = "CONNECTION_FAILED",
    CONNECTION_TIMEOUT = "CONNECTION_TIMEOUT",
    CONNECTION_REFUSED = "CONNECTION_REFUSED",
    CONNECTION_LOST = "CONNECTION_LOST",
    MAX_RETRIES_EXCEEDED = "MAX_RETRIES_EXCEEDED",
    NETWORK_UNREACHABLE = "NETWORK_UNREACHABLE",
    DNS_RESOLUTION_FAILED = "DNS_RESOLUTION_FAILED",
    INVALID_ENDPOINT = "INVALID_ENDPOINT",
    TRANSACTION_FAILED = "TRANSACTION_FAILED",
    TRANSACTION_REJECTED = "TRANSACTION_REJECTED",
    INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
    NONCE_TOO_LOW = "NONCE_TOO_LOW",
    NONCE_TOO_HIGH = "NONCE_TOO_HIGH",
    GAS_LIMIT_EXCEEDED = "GAS_LIMIT_EXCEEDED",
    GAS_PRICE_TOO_LOW = "GAS_PRICE_TOO_LOW",
    INVALID_TRANSACTION = "INVALID_TRANSACTION",
    INVALID_ADDRESS = "INVALID_ADDRESS",
    INVALID_PRIVATE_KEY = "INVALID_PRIVATE_KEY",
    INVALID_MNEMONIC = "INVALID_MNEMONIC",
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
    ACCOUNT_NOT_FOUND = "ACCOUNT_NOT_FOUND",
    INVALID_JSON = "INVALID_JSON",
    INVALID_HEX = "INVALID_HEX",
    INVALID_BASE64 = "INVALID_BASE64",
    PARSING_ERROR = "PARSING_ERROR",
    ENCODING_ERROR = "ENCODING_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_PARAMETER = "INVALID_PARAMETER",
    MISSING_PARAMETER = "MISSING_PARAMETER",
    TYPE_MISMATCH = "TYPE_MISMATCH",
    UNSUPPORTED_OPERATION = "UNSUPPORTED_OPERATION",
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
    VERSION_MISMATCH = "VERSION_MISMATCH",
    DEPRECATED_FEATURE = "DEPRECATED_FEATURE",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    INVALID_SIGNATURE = "INVALID_SIGNATURE",
    SIGNATURE_VERIFICATION_FAILED = "SIGNATURE_VERIFICATION_FAILED",
    SDK_NOT_INITIALIZED = "SDK_NOT_INITIALIZED",
    INVALID_NETWORK = "INVALID_NETWORK",
    WALLET_NOT_CONNECTED = "WALLET_NOT_CONNECTED",
    CONTRACT_NOT_FOUND = "CONTRACT_NOT_FOUND",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR"
}
/**
 * Error severity enumeration
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Base SDK error class
 */
export declare class SelendraError extends Error {
    readonly code: ErrorCode;
    readonly severity: ErrorSeverity;
    readonly cause?: Error;
    readonly context?: Record<string, unknown>;
    constructor(message: string, code: ErrorCode, severity?: ErrorSeverity, cause?: Error, context?: Record<string, unknown>);
    /**
     * Convert error to JSON object
     */
    toJSON(): Record<string, unknown>;
    /**
     * Check if error is recoverable
     */
    isRecoverable(): boolean;
    /**
     * Check if error should be retried
     */
    shouldRetry(): boolean;
}
/**
 * Connection error
 */
export declare class ConnectionError extends SelendraError {
    readonly endpoint?: string;
    constructor(message: string, endpoint?: string, cause?: Error, context?: Record<string, unknown>);
}
/**
 * Transaction error
 */
export declare class TransactionError extends SelendraError {
    readonly transactionHash?: string;
    readonly blockNumber?: number;
    constructor(message: string, transactionHash?: string, blockNumber?: number, cause?: Error, context?: Record<string, unknown>);
}
/**
 * Validation error
 */
export declare class ValidationError extends SelendraError {
    readonly field?: string;
    readonly value?: unknown;
    constructor(message: string, field?: string, value?: unknown, cause?: Error);
}
/**
 * Network error
 */
export declare class NetworkError extends SelendraError {
    readonly networkId?: string;
    constructor(message: string, networkId?: string, cause?: Error, context?: Record<string, unknown>);
}
/**
 * Account error
 */
export declare class AccountError extends SelendraError {
    readonly address?: string;
    constructor(message: string, address?: string, cause?: Error, context?: Record<string, unknown>);
}
/**
 * Configuration error
 */
export declare class ConfigurationError extends SelendraError {
    readonly configKey?: string;
    readonly configValue?: unknown;
    constructor(message: string, configKey?: string, configValue?: unknown, cause?: Error);
}
/**
 * Timeout error
 */
export declare class TimeoutError extends SelendraError {
    readonly timeout: number;
    readonly operation?: string;
    constructor(message: string, timeout: number, operation?: string, cause?: Error);
}
/**
 * Rate limit error
 */
export declare class RateLimitError extends SelendraError {
    readonly retryAfter?: number;
    readonly limit?: number;
    constructor(message: string, retryAfter?: number, limit?: number, cause?: Error);
    /**
     * Get the time to wait before retrying (in milliseconds)
     */
    getRetryDelay(): number;
}
/**
 * Error factory utility
 */
export declare class ErrorFactory {
    /**
     * Create error from error code
     */
    static create(code: ErrorCode, message?: string, context?: Record<string, unknown>, cause?: Error): SelendraError;
    /**
     * Create error from generic error
     */
    static fromError(error: Error, context?: Record<string, unknown>): SelendraError;
    /**
     * Get default error message for error code
     */
    private static getDefaultMessage;
}
//# sourceMappingURL=error.d.ts.map