import { errorUtils } from '../types/errors';
import { createLogger } from './logger';
// SelendraSDKError type available for advanced error handling

const logger = createLogger('Retry');

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffFactor: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: any;
  attempts: number;
  totalTime: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  retryCondition: (error: any) => errorUtils.isRetryable(error)
};

/**
 * Retry utility with exponential backoff and jitter
 */
export class RetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    const startTime = Date.now();
    let lastError: any;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        logger.debug(`Executing ${operationName} (attempt ${attempt}/${this.config.maxAttempts})`);
        
        const result = await operation();
        
        if (attempt > 1) {
          logger.info(`${operationName} succeeded on attempt ${attempt}`, {
            attempts: attempt,
            totalTime: Date.now() - startTime
          });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        logger.debug(`${operationName} failed on attempt ${attempt}`, {
          error: errorUtils.getMessage(error),
          attempt,
          maxAttempts: this.config.maxAttempts
        });

        // Check if we should retry
        const shouldRetry = this.shouldRetry(error, attempt);
        
        if (!shouldRetry) {
          logger.debug(`Not retrying ${operationName}`, {
            reason: attempt >= this.config.maxAttempts ? 'max attempts reached' : 'error not retryable',
            error: errorUtils.getMessage(error)
          });
          break;
        }

        // Call retry callback if provided
        if (this.config.onRetry) {
          try {
            this.config.onRetry(error, attempt);
          } catch (callbackError) {
            logger.warn('Retry callback failed', { error: errorUtils.getMessage(callbackError) });
          }
        }

        // Wait before next attempt (except on last attempt)
        if (attempt < this.config.maxAttempts) {
          const delay = this.calculateDelay(attempt);
          logger.debug(`Waiting ${delay}ms before retry`, { attempt, delay });
          await this.sleep(delay);
        }
      }
    }

    // All attempts failed
    const totalTime = Date.now() - startTime;
    logger.error(`${operationName} failed after ${this.config.maxAttempts} attempts`, {
      totalTime,
      maxAttempts: this.config.maxAttempts,
      finalError: errorUtils.getMessage(lastError)
    });

    throw lastError;
  }

  /**
   * Determine if we should retry based on the error and attempt number
   */
  private shouldRetry(error: any, attempt: number): boolean {
    // Check if we've exceeded max attempts
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    // Use custom retry condition if provided
    if (this.config.retryCondition) {
      return this.config.retryCondition(error);
    }

    // Default: use error utils to determine if retryable
    return errorUtils.isRetryable(error);
  }

  /**
   * Calculate delay for the next attempt using exponential backoff with jitter
   */
  private calculateDelay(attempt: number): number {
    // Calculate exponential backoff
    let delay = this.config.baseDelay * Math.pow(this.config.backoffFactor, attempt - 1);
    
    // Apply maximum delay limit
    delay = Math.min(delay, this.config.maxDelay);
    
    // Add jitter if enabled
    if (this.config.jitter) {
      // Add random jitter of ±25%
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }
    
    return Math.max(0, Math.floor(delay));
  }

  /**
   * Sleep for the specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update retry configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

/**
 * Create a retry manager with specific configuration
 */
export function createRetryManager(config: Partial<RetryConfig> = {}): RetryManager {
  return new RetryManager(config);
}

/**
 * Quick retry function for simple use cases
 */
export async function retry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  operationName: string = 'operation'
): Promise<T> {
  const retryManager = new RetryManager(config);
  return retryManager.execute(operation, operationName);
}

/**
 * Predefined retry configurations for common scenarios
 */
export const retryConfigs = {
  // Quick operations (API calls, balance checks)
  quick: {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    backoffFactor: 2
  },
  
  // Network operations (RPC calls, contract reads)
  network: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 1.5
  },
  
  // Transaction operations (sending transactions)
  transaction: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffFactor: 2,
    retryCondition: (error: any) => {
      // Only retry specific transaction errors
      const message = String(error).toLowerCase();
      return message.includes('network') || 
             message.includes('timeout') || 
             message.includes('connection') ||
             message.includes('nonce too low');
    }
  },
  
  // WebSocket connections
  websocket: {
    maxAttempts: 10,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 1.5,
    jitter: true
  },
  
  // Aggressive retry for critical operations
  aggressive: {
    maxAttempts: 10,
    baseDelay: 500,
    maxDelay: 60000,
    backoffFactor: 1.8,
    jitter: true
  }
};

/**
 * Convenience functions for specific retry scenarios
 */
export const retryUtils = {
  /**
   * Retry a network operation
   */
  network: <T>(operation: () => Promise<T>, operationName?: string) => 
    retry(operation, retryConfigs.network, operationName),

  /**
   * Retry a transaction
   */
  transaction: <T>(operation: () => Promise<T>, operationName?: string) => 
    retry(operation, retryConfigs.transaction, operationName),

  /**
   * Retry a quick operation
   */
  quick: <T>(operation: () => Promise<T>, operationName?: string) => 
    retry(operation, retryConfigs.quick, operationName),

  /**
   * Retry with custom condition
   */
  withCondition: <T>(
    operation: () => Promise<T>, 
    condition: (error: any) => boolean,
    maxAttempts: number = 3,
    operationName?: string
  ) => retry(operation, { 
    ...retryConfigs.network, 
    maxAttempts, 
    retryCondition: condition 
  }, operationName)
};