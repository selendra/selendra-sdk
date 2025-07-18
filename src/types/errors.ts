/**
 * Custom error types for better error handling and debugging
 */

export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  INVALID_NETWORK = 'INVALID_NETWORK',
  
  // Transaction errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
  TRANSACTION_TIMEOUT = 'TRANSACTION_TIMEOUT',
  
  // Contract errors
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  INVALID_CONTRACT_ADDRESS = 'INVALID_CONTRACT_ADDRESS',
  CONTRACT_METHOD_NOT_FOUND = 'CONTRACT_METHOD_NOT_FOUND',
  
  // Wallet errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_CONNECTION_REJECTED = 'WALLET_CONNECTION_REJECTED',
  UNSUPPORTED_WALLET = 'UNSUPPORTED_WALLET',
  
  // Validation errors
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  
  // API errors
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // General errors
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: number;
  retryable: boolean;
}

export class SelendraSDKError extends Error {
  public readonly code: ErrorCode;
  public readonly originalError?: Error;
  public readonly context?: Record<string, any>;
  public readonly timestamp: number;
  public readonly retryable: boolean;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'SelendraSDKError';
    this.code = details.code;
    this.originalError = details.originalError;
    this.context = details.context;
    this.timestamp = details.timestamp;
    this.retryable = details.retryable;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SelendraSDKError);
    }
  }

  /**
   * Create a formatted error message with context
   */
  getDetailedMessage(): string {
    let message = `[${this.code}] ${this.message}`;
    
    if (this.context) {
      message += `\nContext: ${JSON.stringify(this.context, null, 2)}`;
    }
    
    if (this.originalError) {
      message += `\nOriginal Error: ${this.originalError.message}`;
    }
    
    return message;
  }

  /**
   * Check if this error is retryable
   */
  isRetryable(): boolean {
    return this.retryable;
  }

  /**
   * Get error for logging/telemetry
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      retryable: this.retryable,
      stack: this.stack
    };
  }
}

/**
 * Helper functions to create specific error types
 */
export const createError = {
  network: (message: string, originalError?: Error, context?: Record<string, any>) =>
    new SelendraSDKError({
      code: ErrorCode.NETWORK_ERROR,
      message,
      originalError,
      context,
      timestamp: Date.now(),
      retryable: true
    }),

  transaction: (message: string, originalError?: Error, context?: Record<string, any>) =>
    new SelendraSDKError({
      code: ErrorCode.TRANSACTION_FAILED,
      message,
      originalError,
      context,
      timestamp: Date.now(),
      retryable: false
    }),

  contract: (message: string, originalError?: Error, context?: Record<string, any>) =>
    new SelendraSDKError({
      code: ErrorCode.CONTRACT_ERROR,
      message,
      originalError,
      context,
      timestamp: Date.now(),
      retryable: false
    }),

  wallet: (message: string, originalError?: Error, context?: Record<string, any>) =>
    new SelendraSDKError({
      code: ErrorCode.WALLET_NOT_CONNECTED,
      message,
      originalError,
      context,
      timestamp: Date.now(),
      retryable: true
    }),

  validation: (message: string, context?: Record<string, any>) =>
    new SelendraSDKError({
      code: ErrorCode.INVALID_PARAMETERS,
      message,
      context,
      timestamp: Date.now(),
      retryable: false
    }),

  api: (message: string, originalError?: Error, context?: Record<string, any>) =>
    new SelendraSDKError({
      code: ErrorCode.API_ERROR,
      message,
      originalError,
      context,
      timestamp: Date.now(),
      retryable: true
    })
};

/**
 * Error handling utilities
 */
export const errorUtils = {
  /**
   * Check if an error is a SelendraSDKError
   */
  isSDKError: (error: any): error is SelendraSDKError => {
    return error instanceof SelendraSDKError;
  },

  /**
   * Extract meaningful error message from any error
   */
  getMessage: (error: any): string => {
    if (errorUtils.isSDKError(error)) {
      return error.getDetailedMessage();
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  },

  /**
   * Check if an error is retryable
   */
  isRetryable: (error: any): boolean => {
    if (errorUtils.isSDKError(error)) {
      return error.isRetryable();
    }
    // Common retryable error patterns
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /rate limit/i,
      /connection/i,
      /temporary/i
    ];
    const message = String(error).toLowerCase();
    return retryablePatterns.some(pattern => pattern.test(message));
  },

  /**
   * Wrap an unknown error into an SDK error
   */
  wrap: (error: any, code: ErrorCode = ErrorCode.UNKNOWN_ERROR, context?: Record<string, any>): SelendraSDKError => {
    if (errorUtils.isSDKError(error)) {
      return error;
    }
    
    return new SelendraSDKError({
      code,
      message: error instanceof Error ? error.message : String(error),
      originalError: error instanceof Error ? error : undefined,
      context,
      timestamp: Date.now(),
      retryable: errorUtils.isRetryable(error)
    });
  }
};