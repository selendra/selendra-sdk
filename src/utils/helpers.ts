/**
 * Helper utilities for common operations
 */

import { validateAddress, validateAmount, validateTransactionHash } from './validation';
import { createError } from '../types/errors';
import { REGEX_PATTERNS, COMMON_TOKEN_DECIMALS } from './constants';
import { createLogger } from './logger';
// TIME_CONSTANTS available for future time-based helper functions

const logger = createLogger('Helpers');

/**
 * Address utilities
 */
export const addressUtils = {
  /**
   * Check if an address is valid
   */
  isValid: (address: string): boolean => {
    try {
      validateAddress(address);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Normalize an address to lowercase
   */
  normalize: (address: string): string => {
    return validateAddress(address).toLowerCase();
  },

  /**
   * Check if two addresses are equal (case-insensitive)
   */
  equals: (address1: string, address2: string): boolean => {
    try {
      return addressUtils.normalize(address1) === addressUtils.normalize(address2);
    } catch {
      return false;
    }
  },

  /**
   * Shorten an address for display (0x1234...5678)
   */
  shorten: (address: string, startLength: number = 6, endLength: number = 4): string => {
    if (!addressUtils.isValid(address)) {
      return address;
    }
    
    if (address.length <= startLength + endLength) {
      return address;
    }
    
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  },

  /**
   * Check if address is zero address
   */
  isZero: (address: string): boolean => {
    try {
      const normalized = addressUtils.normalize(address);
      return normalized === '0x0000000000000000000000000000000000000000';
    } catch {
      return false;
    }
  }
};

/**
 * Amount and number utilities
 */
export const amountUtils = {
  /**
   * Check if amount is valid
   */
  isValid: (amount: string | number): boolean => {
    try {
      validateAmount(amount);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Parse amount to BigInt with decimals
   */
  parse: (amount: string | number, decimals: number = 18): bigint => {
    const amountStr = validateAmount(amount);
    const factor = BigInt(10) ** BigInt(decimals);
    
    // Handle decimal amounts
    if (amountStr.includes('.')) {
      const [integer, decimal] = amountStr.split('.');
      const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
      return BigInt(integer || '0') * factor + BigInt(paddedDecimal || '0');
    }
    
    return BigInt(amountStr) * factor;
  },

  /**
   * Format amount from wei/smallest unit to human readable
   */
  format: (amount: string | bigint, decimals: number = 18, precision: number = 6): string => {
    const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
    const factor = BigInt(10) ** BigInt(decimals);
    
    const integer = amountBigInt / factor;
    const remainder = amountBigInt % factor;
    
    if (remainder === BigInt(0)) {
      return integer.toString();
    }
    
    const decimalStr = remainder.toString().padStart(decimals, '0');
    const trimmed = decimalStr.replace(/0+$/, '');
    const limited = trimmed.slice(0, precision);
    
    return limited ? `${integer}.${limited}` : integer.toString();
  },

  /**
   * Add two amounts (as strings or BigInts)
   */
  add: (a: string | bigint, b: string | bigint): string => {
    const aBig = typeof a === 'string' ? BigInt(a) : a;
    const bBig = typeof b === 'string' ? BigInt(b) : b;
    return (aBig + bBig).toString();
  },

  /**
   * Subtract two amounts
   */
  subtract: (a: string | bigint, b: string | bigint): string => {
    const aBig = typeof a === 'string' ? BigInt(a) : a;
    const bBig = typeof b === 'string' ? BigInt(b) : b;
    return (aBig - bBig).toString();
  },

  /**
   * Compare two amounts (-1, 0, 1)
   */
  compare: (a: string | bigint, b: string | bigint): number => {
    const aBig = typeof a === 'string' ? BigInt(a) : a;
    const bBig = typeof b === 'string' ? BigInt(b) : b;
    
    if (aBig < bBig) return -1;
    if (aBig > bBig) return 1;
    return 0;
  },

  /**
   * Check if amount is zero
   */
  isZero: (amount: string | bigint): boolean => {
    const amountBig = typeof amount === 'string' ? BigInt(amount) : amount;
    return amountBig === BigInt(0);
  },

  /**
   * Get percentage of amount
   */
  percentage: (amount: string | bigint, percent: number): string => {
    const amountBig = typeof amount === 'string' ? BigInt(amount) : amount;
    const percentBig = BigInt(Math.floor(percent * 100));
    return ((amountBig * percentBig) / BigInt(10000)).toString();
  }
};

/**
 * Time utilities
 */
export const timeUtils = {
  /**
   * Get current timestamp in seconds
   */
  now: (): number => Math.floor(Date.now() / 1000),

  /**
   * Add time to current timestamp
   */
  addMinutes: (minutes: number): number => timeUtils.now() + (minutes * 60),
  addHours: (hours: number): number => timeUtils.now() + (hours * 60 * 60),
  addDays: (days: number): number => timeUtils.now() + (days * 24 * 60 * 60),

  /**
   * Convert milliseconds to human readable duration
   */
  formatDuration: (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  },

  /**
   * Check if timestamp is expired
   */
  isExpired: (timestamp: number): boolean => timestamp <= timeUtils.now(),

  /**
   * Get time until expiration
   */
  timeUntil: (timestamp: number): number => Math.max(0, timestamp - timeUtils.now())
};

/**
 * Transaction utilities
 */
export const transactionUtils = {
  /**
   * Check if transaction hash is valid
   */
  isValidHash: (hash: string): boolean => {
    try {
      validateTransactionHash(hash);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get explorer URL for transaction
   */
  getExplorerUrl: (hash: string, networkId: number): string => {
    const baseUrls: Record<number, string> = {
      1961: 'https://explorer.selendra.org',
      1953: 'https://explorer-testnet.selendra.org'
    };
    
    const baseUrl = baseUrls[networkId];
    if (!baseUrl) {
      logger.warn(`No explorer URL configured for network ${networkId}`);
      return hash;
    }
    
    return `${baseUrl}/tx/${hash}`;
  },

  /**
   * Get explorer URL for address
   */
  getAddressExplorerUrl: (address: string, networkId: number): string => {
    const baseUrls: Record<number, string> = {
      1961: 'https://explorer.selendra.org',
      1953: 'https://explorer-testnet.selendra.org'
    };
    
    const baseUrl = baseUrls[networkId];
    if (!baseUrl) {
      logger.warn(`No explorer URL configured for network ${networkId}`);
      return address;
    }
    
    return `${baseUrl}/address/${address}`;
  }
};

/**
 * Gas utilities
 */
export const gasUtils = {
  /**
   * Calculate gas cost in ETH
   */
  calculateCost: (gasUsed: string | number, gasPrice: string | number): string => {
    const gasUsedBig = BigInt(gasUsed);
    const gasPriceBig = BigInt(gasPrice);
    return (gasUsedBig * gasPriceBig).toString();
  },

  /**
   * Add buffer to gas limit
   */
  addBuffer: (gasLimit: string | number, bufferPercent: number = 20): string => {
    const gasLimitBig = BigInt(gasLimit);
    const buffer = (gasLimitBig * BigInt(bufferPercent)) / BigInt(100);
    return (gasLimitBig + buffer).toString();
  },

  /**
   * Convert gas price to Gwei
   */
  toGwei: (gasPrice: string | number): string => {
    return amountUtils.format(gasPrice, 9, 2);
  },

  /**
   * Convert Gwei to wei
   */
  fromGwei: (gwei: string | number): string => {
    return amountUtils.parse(gwei, 9).toString();
  }
};

/**
 * Token utilities
 */
export const tokenUtils = {
  /**
   * Get standard decimals for common tokens
   */
  getDecimals: (symbol: string): number => {
    const upperSymbol = symbol.toUpperCase() as keyof typeof COMMON_TOKEN_DECIMALS;
    return COMMON_TOKEN_DECIMALS[upperSymbol] || 18;
  },

  /**
   * Format token amount with symbol
   */
  formatWithSymbol: (
    amount: string | bigint, 
    symbol: string, 
    decimals?: number, 
    precision: number = 6
  ): string => {
    const tokenDecimals = decimals || tokenUtils.getDecimals(symbol);
    const formatted = amountUtils.format(amount, tokenDecimals, precision);
    return `${formatted} ${symbol}`;
  }
};

/**
 * URL utilities
 */
export const urlUtils = {
  /**
   * Check if URL is valid
   */
  isValid: (url: string): boolean => {
    return REGEX_PATTERNS.URL.test(url);
  },

  /**
   * Check if WebSocket URL is valid
   */
  isValidWebSocket: (url: string): boolean => {
    return REGEX_PATTERNS.WEBSOCKET_URL.test(url);
  },

  /**
   * Ensure URL has protocol
   */
  ensureProtocol: (url: string, defaultProtocol: string = 'https'): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${defaultProtocol}://${url}`;
  }
};

/**
 * Async utilities
 */
export const asyncUtils = {
  /**
   * Sleep for specified milliseconds
   */
  sleep: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Timeout promise after specified milliseconds
   */
  timeout: <T>(promise: Promise<T>, ms: number, errorMessage?: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(createError.network(
          errorMessage || `Operation timed out after ${ms}ms`
        )), ms)
      )
    ]);
  },

  /**
   * Retry with exponential backoff
   */
  retry: async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await asyncUtils.sleep(delay);
      }
    }
    
    throw lastError;
  }
};

/**
 * Object utilities
 */
export const objectUtils = {
  /**
   * Deep clone an object
   */
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Check if object is empty
   */
  isEmpty: (obj: any): boolean => {
    return obj == null || (typeof obj === 'object' && Object.keys(obj).length === 0);
  },

  /**
   * Pick specific keys from object
   */
  pick: <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  },

  /**
   * Omit specific keys from object
   */
  omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  }
};

/**
 * Array utilities
 */
export const arrayUtils = {
  /**
   * Chunk array into smaller arrays
   */
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Remove duplicates from array
   */
  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)];
  },

  /**
   * Get last element of array
   */
  last: <T>(array: T[]): T | undefined => {
    return array[array.length - 1];
  }
};