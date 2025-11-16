"use strict";
/**
 * Error types for the Selendra SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorFactory = exports.RateLimitError = exports.TimeoutError = exports.ConfigurationError = exports.AccountError = exports.NetworkError = exports.ValidationError = exports.TransactionError = exports.ConnectionError = exports.SelendraError = exports.ErrorSeverity = exports.ErrorCode = void 0;
/**
 * Error code enumeration
 */
var ErrorCode;
(function (ErrorCode) {
    // Connection errors
    ErrorCode["CONNECTION_FAILED"] = "CONNECTION_FAILED";
    ErrorCode["CONNECTION_TIMEOUT"] = "CONNECTION_TIMEOUT";
    ErrorCode["CONNECTION_REFUSED"] = "CONNECTION_REFUSED";
    ErrorCode["CONNECTION_LOST"] = "CONNECTION_LOST";
    ErrorCode["MAX_RETRIES_EXCEEDED"] = "MAX_RETRIES_EXCEEDED";
    // Network errors
    ErrorCode["NETWORK_UNREACHABLE"] = "NETWORK_UNREACHABLE";
    ErrorCode["DNS_RESOLUTION_FAILED"] = "DNS_RESOLUTION_FAILED";
    ErrorCode["INVALID_ENDPOINT"] = "INVALID_ENDPOINT";
    // Transaction errors
    ErrorCode["TRANSACTION_FAILED"] = "TRANSACTION_FAILED";
    ErrorCode["TRANSACTION_REJECTED"] = "TRANSACTION_REJECTED";
    ErrorCode["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
    ErrorCode["NONCE_TOO_LOW"] = "NONCE_TOO_LOW";
    ErrorCode["NONCE_TOO_HIGH"] = "NONCE_TOO_HIGH";
    ErrorCode["GAS_LIMIT_EXCEEDED"] = "GAS_LIMIT_EXCEEDED";
    ErrorCode["GAS_PRICE_TOO_LOW"] = "GAS_PRICE_TOO_LOW";
    ErrorCode["INVALID_TRANSACTION"] = "INVALID_TRANSACTION";
    // Account errors
    ErrorCode["INVALID_ADDRESS"] = "INVALID_ADDRESS";
    ErrorCode["INVALID_PRIVATE_KEY"] = "INVALID_PRIVATE_KEY";
    ErrorCode["INVALID_MNEMONIC"] = "INVALID_MNEMONIC";
    ErrorCode["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    ErrorCode["ACCOUNT_NOT_FOUND"] = "ACCOUNT_NOT_FOUND";
    // Parsing/encoding errors
    ErrorCode["INVALID_JSON"] = "INVALID_JSON";
    ErrorCode["INVALID_HEX"] = "INVALID_HEX";
    ErrorCode["INVALID_BASE64"] = "INVALID_BASE64";
    ErrorCode["PARSING_ERROR"] = "PARSING_ERROR";
    ErrorCode["ENCODING_ERROR"] = "ENCODING_ERROR";
    // Validation errors
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INVALID_PARAMETER"] = "INVALID_PARAMETER";
    ErrorCode["MISSING_PARAMETER"] = "MISSING_PARAMETER";
    ErrorCode["TYPE_MISMATCH"] = "TYPE_MISMATCH";
    // Runtime errors
    ErrorCode["UNSUPPORTED_OPERATION"] = "UNSUPPORTED_OPERATION";
    ErrorCode["NOT_IMPLEMENTED"] = "NOT_IMPLEMENTED";
    ErrorCode["VERSION_MISMATCH"] = "VERSION_MISMATCH";
    ErrorCode["DEPRECATED_FEATURE"] = "DEPRECATED_FEATURE";
    // Security errors
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["INVALID_SIGNATURE"] = "INVALID_SIGNATURE";
    ErrorCode["SIGNATURE_VERIFICATION_FAILED"] = "SIGNATURE_VERIFICATION_FAILED";
    // SDK specific errors
    ErrorCode["SDK_NOT_INITIALIZED"] = "SDK_NOT_INITIALIZED";
    ErrorCode["INVALID_NETWORK"] = "INVALID_NETWORK";
    ErrorCode["WALLET_NOT_CONNECTED"] = "WALLET_NOT_CONNECTED";
    ErrorCode["CONTRACT_NOT_FOUND"] = "CONTRACT_NOT_FOUND";
    // Generic errors
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
/**
 * Error severity enumeration
 */
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
/**
 * Base SDK error class
 */
class SelendraError extends Error {
    constructor(message, code, severity = ErrorSeverity.MEDIUM, cause, context) {
        super(message);
        Object.defineProperty(this, "code", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: code
        });
        Object.defineProperty(this, "severity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: severity
        });
        Object.defineProperty(this, "cause", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: cause
        });
        Object.defineProperty(this, "context", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: context
        });
        this.name = 'SelendraError';
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SelendraError);
        }
    }
    /**
     * Convert error to JSON object
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            severity: this.severity,
            context: this.context,
            stack: this.stack,
            cause: this.cause?.message
        };
    }
    /**
     * Check if error is recoverable
     */
    isRecoverable() {
        const recoverableErrors = [
            ErrorCode.CONNECTION_TIMEOUT,
            ErrorCode.NETWORK_UNREACHABLE,
            ErrorCode.CONNECTION_LOST,
            ErrorCode.NONCE_TOO_LOW,
            ErrorCode.GAS_PRICE_TOO_LOW,
            ErrorCode.TIMEOUT_ERROR
        ];
        return recoverableErrors.includes(this.code);
    }
    /**
     * Check if error should be retried
     */
    shouldRetry() {
        const retryableErrors = [
            ErrorCode.CONNECTION_TIMEOUT,
            ErrorCode.CONNECTION_FAILED,
            ErrorCode.NETWORK_UNREACHABLE,
            ErrorCode.MAX_RETRIES_EXCEEDED,
            ErrorCode.TIMEOUT_ERROR
        ];
        return retryableErrors.includes(this.code);
    }
}
exports.SelendraError = SelendraError;
/**
 * Connection error
 */
class ConnectionError extends SelendraError {
    constructor(message, endpoint, cause, context) {
        super(message, ErrorCode.CONNECTION_FAILED, ErrorSeverity.HIGH, cause, {
            endpoint,
            ...context
        });
        Object.defineProperty(this, "endpoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: endpoint
        });
        this.name = 'ConnectionError';
    }
}
exports.ConnectionError = ConnectionError;
/**
 * Transaction error
 */
class TransactionError extends SelendraError {
    constructor(message, transactionHash, blockNumber, cause, context) {
        super(message, ErrorCode.TRANSACTION_FAILED, ErrorSeverity.HIGH, cause, {
            transactionHash,
            blockNumber,
            ...context
        });
        Object.defineProperty(this, "transactionHash", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: transactionHash
        });
        Object.defineProperty(this, "blockNumber", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: blockNumber
        });
        this.name = 'TransactionError';
    }
}
exports.TransactionError = TransactionError;
/**
 * Validation error
 */
class ValidationError extends SelendraError {
    constructor(message, field, value, cause) {
        super(message, ErrorCode.VALIDATION_ERROR, ErrorSeverity.MEDIUM, cause, {
            field,
            value
        });
        Object.defineProperty(this, "field", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: field
        });
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
        });
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Network error
 */
class NetworkError extends SelendraError {
    constructor(message, networkId, cause, context) {
        super(message, ErrorCode.NETWORK_UNREACHABLE, ErrorSeverity.HIGH, cause, {
            networkId,
            ...context
        });
        Object.defineProperty(this, "networkId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: networkId
        });
        this.name = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
/**
 * Account error
 */
class AccountError extends SelendraError {
    constructor(message, address, cause, context) {
        super(message, ErrorCode.INVALID_ADDRESS, ErrorSeverity.MEDIUM, cause, {
            address,
            ...context
        });
        Object.defineProperty(this, "address", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: address
        });
        this.name = 'AccountError';
    }
}
exports.AccountError = AccountError;
/**
 * Configuration error
 */
class ConfigurationError extends SelendraError {
    constructor(message, configKey, configValue, cause) {
        super(message, ErrorCode.INVALID_PARAMETER, ErrorSeverity.HIGH, cause, {
            configKey,
            configValue
        });
        Object.defineProperty(this, "configKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: configKey
        });
        Object.defineProperty(this, "configValue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: configValue
        });
        this.name = 'ConfigurationError';
    }
}
exports.ConfigurationError = ConfigurationError;
/**
 * Timeout error
 */
class TimeoutError extends SelendraError {
    constructor(message, timeout, operation, cause) {
        super(message, ErrorCode.TIMEOUT_ERROR, ErrorSeverity.MEDIUM, cause, {
            timeout,
            operation
        });
        Object.defineProperty(this, "timeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: timeout
        });
        Object.defineProperty(this, "operation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: operation
        });
        this.name = 'TimeoutError';
    }
}
exports.TimeoutError = TimeoutError;
/**
 * Rate limit error
 */
class RateLimitError extends SelendraError {
    constructor(message, retryAfter, limit, cause) {
        super(message, ErrorCode.CONNECTION_FAILED, ErrorSeverity.MEDIUM, cause, {
            retryAfter,
            limit
        });
        Object.defineProperty(this, "retryAfter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: retryAfter
        });
        Object.defineProperty(this, "limit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: limit
        });
        this.name = 'RateLimitError';
    }
    /**
     * Get the time to wait before retrying (in milliseconds)
     */
    getRetryDelay() {
        return this.retryAfter ? this.retryAfter * 1000 : 5000; // Default to 5 seconds
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Error factory utility
 */
class ErrorFactory {
    /**
     * Create error from error code
     */
    static create(code, message, context, cause) {
        const errorMessage = message || this.getDefaultMessage(code);
        switch (code) {
            case ErrorCode.CONNECTION_FAILED:
            case ErrorCode.CONNECTION_TIMEOUT:
            case ErrorCode.CONNECTION_REFUSED:
            case ErrorCode.CONNECTION_LOST:
            case ErrorCode.MAX_RETRIES_EXCEEDED:
                return new ConnectionError(errorMessage, context?.endpoint, cause, context);
            case ErrorCode.TRANSACTION_FAILED:
            case ErrorCode.TRANSACTION_REJECTED:
            case ErrorCode.INSUFFICIENT_FUNDS:
            case ErrorCode.NONCE_TOO_LOW:
            case ErrorCode.NONCE_TOO_HIGH:
            case ErrorCode.GAS_LIMIT_EXCEEDED:
            case ErrorCode.GAS_PRICE_TOO_LOW:
                return new TransactionError(errorMessage, context?.transactionHash, context?.blockNumber, cause, context);
            case ErrorCode.INVALID_ADDRESS:
            case ErrorCode.INVALID_PRIVATE_KEY:
            case ErrorCode.INVALID_MNEMONIC:
            case ErrorCode.ACCOUNT_LOCKED:
                return new AccountError(errorMessage, context?.address, cause, context);
            case ErrorCode.VALIDATION_ERROR:
            case ErrorCode.INVALID_PARAMETER:
            case ErrorCode.MISSING_PARAMETER:
            case ErrorCode.TYPE_MISMATCH:
                return new ValidationError(errorMessage, context?.field, context?.value, cause);
            case ErrorCode.TIMEOUT_ERROR:
                return new TimeoutError(errorMessage, context?.timeout || 30000, context?.operation, cause);
            default:
                return new SelendraError(errorMessage, code, ErrorSeverity.MEDIUM, cause, context);
        }
    }
    /**
     * Create error from generic error
     */
    static fromError(error, context) {
        if (error instanceof SelendraError) {
            return error;
        }
        // Try to determine error type from error message or name
        const message = error.message.toLowerCase();
        const name = error.name.toLowerCase();
        if (message.includes('timeout') || name.includes('timeout')) {
            return new TimeoutError(error.message, 30000, 'unknown', error);
        }
        if (message.includes('network') || message.includes('fetch') || message.includes('request')) {
            return new NetworkError(error.message, undefined, error, context);
        }
        if (message.includes('validation') || message.includes('invalid')) {
            return new ValidationError(error.message, undefined, undefined, error);
        }
        // Default to generic SDK error
        return new SelendraError(error.message, ErrorCode.UNKNOWN_ERROR, ErrorSeverity.MEDIUM, error, context);
    }
    /**
     * Get default error message for error code
     */
    static getDefaultMessage(code) {
        const messages = {
            [ErrorCode.CONNECTION_FAILED]: 'Failed to connect to the network',
            [ErrorCode.CONNECTION_TIMEOUT]: 'Connection timeout',
            [ErrorCode.CONNECTION_REFUSED]: 'Connection was refused',
            [ErrorCode.CONNECTION_LOST]: 'Connection was lost',
            [ErrorCode.MAX_RETRIES_EXCEEDED]: 'Maximum number of retries exceeded',
            [ErrorCode.NETWORK_UNREACHABLE]: 'Network is unreachable',
            [ErrorCode.DNS_RESOLUTION_FAILED]: 'DNS resolution failed',
            [ErrorCode.INVALID_ENDPOINT]: 'Invalid endpoint URL',
            [ErrorCode.TRANSACTION_FAILED]: 'Transaction failed',
            [ErrorCode.TRANSACTION_REJECTED]: 'Transaction was rejected',
            [ErrorCode.INSUFFICIENT_FUNDS]: 'Insufficient funds for transaction',
            [ErrorCode.NONCE_TOO_LOW]: 'Nonce is too low',
            [ErrorCode.NONCE_TOO_HIGH]: 'Nonce is too high',
            [ErrorCode.GAS_LIMIT_EXCEEDED]: 'Gas limit exceeded',
            [ErrorCode.GAS_PRICE_TOO_LOW]: 'Gas price is too low',
            [ErrorCode.INVALID_TRANSACTION]: 'Invalid transaction',
            [ErrorCode.INVALID_ADDRESS]: 'Invalid address format',
            [ErrorCode.INVALID_PRIVATE_KEY]: 'Invalid private key',
            [ErrorCode.INVALID_MNEMONIC]: 'Invalid mnemonic phrase',
            [ErrorCode.ACCOUNT_LOCKED]: 'Account is locked',
            [ErrorCode.ACCOUNT_NOT_FOUND]: 'Account not found',
            [ErrorCode.INVALID_JSON]: 'Invalid JSON format',
            [ErrorCode.INVALID_HEX]: 'Invalid hex format',
            [ErrorCode.INVALID_BASE64]: 'Invalid base64 format',
            [ErrorCode.PARSING_ERROR]: 'Error parsing data',
            [ErrorCode.ENCODING_ERROR]: 'Error encoding data',
            [ErrorCode.VALIDATION_ERROR]: 'Validation error',
            [ErrorCode.INVALID_PARAMETER]: 'Invalid parameter',
            [ErrorCode.MISSING_PARAMETER]: 'Required parameter is missing',
            [ErrorCode.TYPE_MISMATCH]: 'Type mismatch',
            [ErrorCode.UNSUPPORTED_OPERATION]: 'Unsupported operation',
            [ErrorCode.NOT_IMPLEMENTED]: 'Feature not implemented',
            [ErrorCode.VERSION_MISMATCH]: 'Version mismatch',
            [ErrorCode.DEPRECATED_FEATURE]: 'Deprecated feature used',
            [ErrorCode.UNAUTHORIZED]: 'Unauthorized access',
            [ErrorCode.FORBIDDEN]: 'Access forbidden',
            [ErrorCode.INVALID_SIGNATURE]: 'Invalid signature',
            [ErrorCode.SIGNATURE_VERIFICATION_FAILED]: 'Signature verification failed',
            [ErrorCode.SDK_NOT_INITIALIZED]: 'SDK not initialized',
            [ErrorCode.INVALID_NETWORK]: 'Invalid network configuration',
            [ErrorCode.WALLET_NOT_CONNECTED]: 'Wallet not connected',
            [ErrorCode.CONTRACT_NOT_FOUND]: 'Contract not found',
            [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred',
            [ErrorCode.INTERNAL_ERROR]: 'Internal error occurred',
            [ErrorCode.TIMEOUT_ERROR]: 'Operation timed out'
        };
        return messages[code] || 'An error occurred';
    }
}
exports.ErrorFactory = ErrorFactory;
//# sourceMappingURL=error.js.map