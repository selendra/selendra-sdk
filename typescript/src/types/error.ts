/**
 * Error types for the Selendra SDK
 */

/**
 * Error code enumeration
 */
export enum ErrorCode {
  // Connection errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  CONNECTION_LOST = 'CONNECTION_LOST',
  MAX_RETRIES_EXCEEDED = 'MAX_RETRIES_EXCEEDED',

  // Network errors
  NETWORK_UNREACHABLE = 'NETWORK_UNREACHABLE',
  DNS_RESOLUTION_FAILED = 'DNS_RESOLUTION_FAILED',
  INVALID_ENDPOINT = 'INVALID_ENDPOINT',

  // Transaction errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  NONCE_TOO_LOW = 'NONCE_TOO_LOW',
  NONCE_TOO_HIGH = 'NONCE_TOO_HIGH',
  GAS_LIMIT_EXCEEDED = 'GAS_LIMIT_EXCEEDED',
  GAS_PRICE_TOO_LOW = 'GAS_PRICE_TOO_LOW',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',

  // Account errors
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_PRIVATE_KEY = 'INVALID_PRIVATE_KEY',
  INVALID_MNEMONIC = 'INVALID_MNEMONIC',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',

  // Parsing/encoding errors
  INVALID_JSON = 'INVALID_JSON',
  INVALID_HEX = 'INVALID_HEX',
  INVALID_BASE64 = 'INVALID_BASE64',
  PARSING_ERROR = 'PARSING_ERROR',
  ENCODING_ERROR = 'ENCODING_ERROR',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  TYPE_MISMATCH = 'TYPE_MISMATCH',

  // Runtime errors
  UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  DEPRECATED_FEATURE = 'DEPRECATED_FEATURE',

  // Security errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  SIGNATURE_VERIFICATION_FAILED = 'SIGNATURE_VERIFICATION_FAILED',

  // SDK specific errors
  SDK_NOT_INITIALIZED = 'SDK_NOT_INITIALIZED',
  INVALID_NETWORK = 'INVALID_NETWORK',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

/**
 * Error severity enumeration
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Base SDK error class
 */
export class SelendraError extends Error {
  public constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public readonly cause?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SelendraError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SelendraError);
    }
  }

  /**
   * Convert error to JSON object
   */
  public toJSON(): Record<string, unknown> {
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
  public isRecoverable(): boolean {
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
  public shouldRetry(): boolean {
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

/**
 * Connection error
 */
export class ConnectionError extends SelendraError {
  public constructor(
    message: string,
    public readonly endpoint?: string,
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(message, ErrorCode.CONNECTION_FAILED, ErrorSeverity.HIGH, cause, {
      endpoint,
      ...context
    });
    this.name = 'ConnectionError';
  }
}

/**
 * Transaction error
 */
export class TransactionError extends SelendraError {
  public constructor(
    message: string,
    public readonly transactionHash?: string,
    public readonly blockNumber?: number,
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(message, ErrorCode.TRANSACTION_FAILED, ErrorSeverity.HIGH, cause, {
      transactionHash,
      blockNumber,
      ...context
    });
    this.name = 'TransactionError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends SelendraError {
  public constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown,
    cause?: Error
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, ErrorSeverity.MEDIUM, cause, {
      field,
      value
    });
    this.name = 'ValidationError';
  }
}

/**
 * Network error
 */
export class NetworkError extends SelendraError {
  public constructor(
    message: string,
    public readonly networkId?: string,
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(message, ErrorCode.NETWORK_UNREACHABLE, ErrorSeverity.HIGH, cause, {
      networkId,
      ...context
    });
    this.name = 'NetworkError';
  }
}

/**
 * Account error
 */
export class AccountError extends SelendraError {
  public constructor(
    message: string,
    public readonly address?: string,
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(message, ErrorCode.INVALID_ADDRESS, ErrorSeverity.MEDIUM, cause, {
      address,
      ...context
    });
    this.name = 'AccountError';
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends SelendraError {
  public constructor(
    message: string,
    public readonly configKey?: string,
    public readonly configValue?: unknown,
    cause?: Error
  ) {
    super(message, ErrorCode.INVALID_PARAMETER, ErrorSeverity.HIGH, cause, {
      configKey,
      configValue
    });
    this.name = 'ConfigurationError';
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends SelendraError {
  public constructor(
    message: string,
    public readonly timeout: number,
    public readonly operation?: string,
    cause?: Error
  ) {
    super(message, ErrorCode.TIMEOUT_ERROR, ErrorSeverity.MEDIUM, cause, {
      timeout,
      operation
    });
    this.name = 'TimeoutError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends SelendraError {
  public constructor(
    message: string,
    public readonly retryAfter?: number,
    public readonly limit?: number,
    cause?: Error
  ) {
    super(message, ErrorCode.CONNECTION_FAILED, ErrorSeverity.MEDIUM, cause, {
      retryAfter,
      limit
    });
    this.name = 'RateLimitError';
  }

  /**
   * Get the time to wait before retrying (in milliseconds)
   */
  public getRetryDelay(): number {
    return this.retryAfter ? this.retryAfter * 1000 : 5000; // Default to 5 seconds
  }
}

/**
 * Error factory utility
 */
export class ErrorFactory {
  /**
   * Create error from error code
   */
  public static create(
    code: ErrorCode,
    message?: string,
    context?: Record<string, unknown>,
    cause?: Error
  ): SelendraError {
    const errorMessage = message || this.getDefaultMessage(code);

    switch (code) {
      case ErrorCode.CONNECTION_FAILED:
      case ErrorCode.CONNECTION_TIMEOUT:
      case ErrorCode.CONNECTION_REFUSED:
      case ErrorCode.CONNECTION_LOST:
      case ErrorCode.MAX_RETRIES_EXCEEDED:
        return new ConnectionError(errorMessage, context?.endpoint as string, cause, context);

      case ErrorCode.TRANSACTION_FAILED:
      case ErrorCode.TRANSACTION_REJECTED:
      case ErrorCode.INSUFFICIENT_FUNDS:
      case ErrorCode.NONCE_TOO_LOW:
      case ErrorCode.NONCE_TOO_HIGH:
      case ErrorCode.GAS_LIMIT_EXCEEDED:
      case ErrorCode.GAS_PRICE_TOO_LOW:
        return new TransactionError(
          errorMessage,
          context?.transactionHash as string,
          context?.blockNumber as number,
          cause,
          context
        );

      case ErrorCode.INVALID_ADDRESS:
      case ErrorCode.INVALID_PRIVATE_KEY:
      case ErrorCode.INVALID_MNEMONIC:
      case ErrorCode.ACCOUNT_LOCKED:
        return new AccountError(errorMessage, context?.address as string, cause, context);

      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.INVALID_PARAMETER:
      case ErrorCode.MISSING_PARAMETER:
      case ErrorCode.TYPE_MISMATCH:
        return new ValidationError(
          errorMessage,
          context?.field as string,
          context?.value,
          cause
        );

      case ErrorCode.TIMEOUT_ERROR:
        return new TimeoutError(
          errorMessage,
          context?.timeout as number || 30000,
          context?.operation as string,
          cause
        );

      default:
        return new SelendraError(errorMessage, code, ErrorSeverity.MEDIUM, cause, context);
    }
  }

  /**
   * Create error from generic error
   */
  public static fromError(error: Error, context?: Record<string, unknown>): SelendraError {
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
    return new SelendraError(
      error.message,
      ErrorCode.UNKNOWN_ERROR,
      ErrorSeverity.MEDIUM,
      error,
      context
    );
  }

  /**
   * Get default error message for error code
   */
  private static getDefaultMessage(code: ErrorCode): string {
    const messages: Record<ErrorCode, string> = {
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