/**
 * React Utilities and Helper Functions for Selendra SDK
 *
 * Premium developer utilities that make building dApps on Selendra
 * easier and more enjoyable. Includes formatters, validators,
 * error handlers, and utility functions.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */

import { ChainType, BalanceInfo, TransactionInfo, AccountInfo } from '../types';
import { FormatterOptions, ValidationRule, ValidationResult, ToastOptions } from './types';

/**
 * Balance Formatters
 */

/**
 * Format balance for display
 *
 * @param balance - Balance information
 * @param options - Formatting options
 * @returns Formatted balance string
 *
 * @example
 * ```typescript
 * const formatted = formatBalance(balance, {
 *   decimals: 4,
 *   showCommas: true,
 *   currency: '$'
 * });
 * console.log(formatted); // "$1,234.5678 SEL"
 * ```
 */
export function formatBalance(balance: BalanceInfo, options: FormatterOptions = {}): string {
  const {
    decimals = 6,
    showCommas = true,
    abbreviate = false,
    prefix = '',
    suffix = '',
    currency = '',
  } = options;

  const value = Number(balance.total) / Math.pow(10, balance.decimals);
  let formattedValue = value.toFixed(decimals);

  // Add commas if requested
  if (showCommas) {
    const parts = formattedValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formattedValue = parts.join('.');
  }

  // Abbreviate large numbers
  if (abbreviate && value >= 1000) {
    if (value >= 1e9) {
      formattedValue = `${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      formattedValue = `${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      formattedValue = `${(value / 1e3).toFixed(1)}K`;
    }
  }

  const symbol = balance.symbol || 'SEL';
  const currencySymbol = currency || (balance.usd ? '$' : '');

  return `${prefix}${currencySymbol}${formattedValue}${suffix}${currencySymbol ? '' : ` ${symbol}`}`.trim();
}

/**
 * Format address for display
 *
 * @param address - Full address
 * @param length - Number of characters to show at start and end
 * @returns Formatted address string
 *
 * @example
 * ```typescript
 * const formatted = formatAddress('0x1234567890abcdef...');
 * console.log(formatted); // "0x1234...cdef"
 * ```
 */
export function formatAddress(address: string, length: number = 6): string {
  if (!address || address.length <= length * 2) {
    return address;
  }

  const start = address.slice(0, length);
  const end = address.slice(-length);
  return `${start}...${end}`;
}

/**
 * Format transaction hash for display
 *
 * @param hash - Transaction hash
 * @param length - Number of characters to show at start and end
 * @returns Formatted hash string
 *
 * @example
 * ```typescript
 * const formatted = formatTxHash('0x1234567890abcdef...');
 * console.log(formatted); // "0x1234...cdef"
 * ```
 */
export function formatTxHash(hash: string, length: number = 8): string {
  return formatAddress(hash, length);
}

/**
 * Format timestamp for display
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param options - Formatting options
 * @returns Formatted timestamp string
 *
 * @example
 * ```typescript
 * const formatted = formatTimestamp(Date.now(), { relative: true });
 * console.log(formatted); // "2 minutes ago"
 * ```
 */
export function formatTimestamp(
  timestamp: number,
  options: { relative?: boolean; format?: string } = {},
): string {
  const { relative = false, format = 'MMM d, yyyy h:mm a' } = options;

  const date = new Date(timestamp);

  if (relative) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
}

/**
 * Format gas price for EVM transactions
 *
 * @param gasPrice - Gas price in wei
 * @param decimals - Number of decimal places
 * @returns Formatted gas price string
 *
 * @example
 * ```typescript
 * const formatted = formatGasPrice('20000000000');
 * console.log(formatted); // "20 Gwei"
 * ```
 */
export function formatGasPrice(gasPrice: string, decimals: number = 2): string {
  const price = Number(gasPrice);
  const gwei = price / 1e9;

  if (gwei >= 1) {
    return `${gwei.toFixed(decimals)} Gwei`;
  }

  return `${price} wei`;
}

/**
 * Validators
 */

/**
 * Validate address format
 *
 * @param address - Address to validate
 * @param chainType - Chain type for validation rules
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateAddress('0x1234567890abcdef...', 'evm');
 * console.log(result.isValid); // true or false
 * console.log(result.errors); // Array of error messages
 * ```
 */
export function validateAddress(address: string, chainType: ChainType): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!address) {
    errors.push('Address is required');
    return { isValid: false, errors, warnings };
  }

  if (typeof address !== 'string') {
    errors.push('Address must be a string');
    return { isValid: false, errors, warnings };
  }

  // Chain-specific validation
  switch (chainType) {
    case 'evm':
      if (!address.startsWith('0x')) {
        errors.push('EVM address must start with 0x');
      }
      if (address.length !== 42) {
        errors.push('EVM address must be 42 characters long');
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        errors.push('EVM address contains invalid characters');
      }
      break;

    case 'substrate':
      if (address.length < 32) {
        errors.push('Substrate address is too short');
      }
      if (address.length > 66) {
        errors.push('Substrate address is too long');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate transaction amount
 *
 * @param amount - Amount to validate
 * @param balance - Available balance
 * @param decimals - Token decimals
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateAmount('1000000000000000000', balance, 18);
 * console.log(result.isValid); // true or false
 * ```
 */
export function validateAmount(
  amount: string,
  balance: BalanceInfo,
  decimals?: number,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!amount) {
    errors.push('Amount is required');
    return { isValid: false, errors, warnings };
  }

  if (isNaN(Number(amount))) {
    errors.push('Amount must be a valid number');
    return { isValid: false, errors, warnings };
  }

  if (Number(amount) <= 0) {
    errors.push('Amount must be greater than 0');
    return { isValid: false, errors, warnings };
  }

  // Check against balance
  const amountValue = Number(amount);
  const balanceValue = Number(balance.total);

  if (amountValue > balanceValue) {
    errors.push('Insufficient balance');
  }

  // Check decimal places
  if (decimals !== undefined) {
    const decimalPlaces = amount.split('.')[1]?.length || 0;
    if (decimalPlaces > decimals) {
      warnings.push(`Amount has more than ${decimals} decimal places`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate private key or mnemonic
 *
 * @param secret - Private key or mnemonic to validate
 * @param type - Type of secret (privatekey or mnemonic)
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateSecret('abandon abandon...', 'mnemonic');
 * console.log(result.isValid); // true or false
 * ```
 */
export function validateSecret(secret: string, type: 'privatekey' | 'mnemonic'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!secret) {
    errors.push('Secret is required');
    return { isValid: false, errors, warnings };
  }

  switch (type) {
    case 'privatekey':
      if (secret.startsWith('0x')) {
        if (secret.length !== 66) {
          errors.push('Private key must be 64 hexadecimal characters');
        }
        if (!/^0x[a-fA-F0-9]{64}$/.test(secret)) {
          errors.push('Private key contains invalid characters');
        }
      } else {
        if (secret.length !== 64) {
          errors.push('Private key must be 64 hexadecimal characters');
        }
        if (!/^[a-fA-F0-9]{64}$/.test(secret)) {
          errors.push('Private key contains invalid characters');
        }
      }
      warnings.push('Never share your private key with anyone');
      break;

    case 'mnemonic':
      const words = secret.trim().split(/\s+/);
      if (![12, 15, 18, 21, 24].includes(words.length)) {
        errors.push('Mnemonic must be 12, 15, 18, 21, or 24 words');
      }
      warnings.push('Never share your mnemonic phrase with anyone');
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Error Handling Utilities
 */

/**
 * Create user-friendly error message from SDK error
 *
 * @param error - Error object
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * const message = formatErrorMessage(error);
 * console.log(message); // "Transaction failed: Insufficient balance"
 * ```
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Common error patterns
    if (error.message.includes('insufficient')) {
      return 'Insufficient balance for this transaction';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection';
    }
    if (error.message.includes('timeout')) {
      return 'Transaction timed out. Please try again';
    }
    if (error.message.includes('rejected')) {
      return 'Transaction was rejected by user';
    }
    if (error.message.includes('nonce')) {
      return 'Nonce error. Please try again';
    }

    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Get error severity level
 *
 * @param error - Error object
 * @returns Error severity level
 *
 * @example
 * ```typescript
 * const severity = getErrorSeverity(error);
 * console.log(severity); // "warning" | "error" | "critical"
 * ```
 */
export function getErrorSeverity(error: unknown): 'warning' | 'error' | 'critical' {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('critical') || message.includes('fatal')) {
    return 'critical';
  }

  if (message.includes('insufficient') || message.includes('failed')) {
    return 'error';
  }

  return 'warning';
}

/**
 * Transaction Utilities
 */

/**
 * Calculate transaction fee
 *
 * @param tx - Transaction object
 * @param gasPrice - Gas price (EVM only)
 * @returns Estimated fee string
 *
 * @example
 * ```typescript
 * const fee = calculateTransactionFee(tx, '20000000000');
 * console.log(fee); // "0.00042 ETH"
 * ```
 */
export function calculateTransactionFee(tx: any, gasPrice?: string): string {
  try {
    if (tx.gas && gasPrice) {
      // EVM transaction
      const gasLimit = typeof tx.gas === 'string' ? tx.gas : tx.gas.toString();
      const fee = (parseInt(gasLimit) * parseInt(gasPrice)).toString();
      return fee;
    }

    // Substrate transaction fee calculation would go here
    return '0';
  } catch (error) {
    return '0';
  }
}

/**
 * Get transaction status color
 *
 * @param status - Transaction status
 * @returns Color hex code
 *
 * @example
 * ```typescript
 * const color = getTransactionStatusColor('pending');
 * console.log(color); // "#f59e0b" (warning color)
 * ```
 */
export function getTransactionStatusColor(status: string): string {
  const colors = {
    pending: '#f59e0b', // warning
    included: '#3b82f6', // info
    finalized: '#10b981', // success
    failed: '#ef4444', // error
    unknown: '#6b7280', // muted
  };

  return colors[status as keyof typeof colors] || colors.unknown;
}

/**
 * Check if transaction is confirmed
 *
 * @param transaction - Transaction info
 * @param confirmations - Number of confirmations required
 * @param currentBlockNumber - Current block number for confirmation calculation
 * @returns Whether transaction is confirmed
 *
 * @example
 * ```typescript
 * const isConfirmed = isTransactionConfirmed(tx, 6, currentBlock);
 * console.log(isConfirmed); // true or false
 * ```
 */
export function isTransactionConfirmed(
  transaction: TransactionInfo,
  confirmations: number = 1,
  currentBlockNumber?: number,
): boolean {
  if (!transaction || !transaction.blockNumber) {
    return false;
  }

  if (transaction.status === 'finalized') {
    return true;
  }

  if (currentBlockNumber && transaction.blockNumber) {
    const confirmationsCount = currentBlockNumber - transaction.blockNumber;
    return confirmationsCount >= confirmations;
  }

  return false;
}

/**
 * Network Utilities
 */

/**
 * Get chain display name
 *
 * @param chainType - Chain type
 * @returns Human-readable chain name
 *
 * @example
 * ```typescript
 * const name = getChainDisplayName('substrate');
 * console.log(name); // "Selendra Substrate"
 * ```
 */
export function getChainDisplayName(chainType: ChainType): string {
  const names = {
    substrate: 'Selendra Substrate',
    evm: 'Selendra EVM',
    unified: 'Selendra Unified',
  };

  return names[chainType] || 'Selendra';
}

/**
 * Get chain color theme
 *
 * @param chainType - Chain type
 * @returns Color object for chain theme
 *
 * @example
 * ```typescript
 * const colors = getChainColors('substrate');
 * console.log(colors.primary); // "#6366f1"
 * ```
 */
export function getChainColors(chainType: ChainType): { primary: string; secondary: string } {
  const colors = {
    substrate: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
    },
    evm: {
      primary: '#10b981',
      secondary: '#06b6d4',
    },
    unified: {
      primary: '#f59e0b',
      secondary: '#ef4444',
    },
  };

  return colors[chainType] || colors.substrate;
}

/**
 * Get explorer URL for transaction
 *
 * @param chainType - Chain type
 * @param hash - Transaction hash
 * @returns Explorer URL
 *
 * @example
 * ```typescript
 * const url = getExplorerUrl('substrate', txHash);
 * console.log(url); // "https://explorer.selendra.org/tx/..."
 * ```
 */
export function getExplorerUrl(chainType: ChainType, hash: string): string {
  const explorers = {
    substrate: `https://explorer.selendra.org/transaction/${hash}`,
    evm: `https://evm-explorer.selendra.org/tx/${hash}`,
    unified: `https://explorer.selendra.org/transaction/${hash}`,
  };

  return explorers[chainType] || explorers.substrate;
}

/**
 * Date and Time Utilities
 */

/**
 * Check if date is today
 *
 * @param date - Date to check
 * @returns Whether date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if date is yesterday
 *
 * @param date - Date to check
 * @returns Whether date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

/**
 * Format duration for display
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 *
 * @example
 * ```typescript
 * const formatted = formatDuration(3661);
 * console.log(formatted); // "1h 1m 1s"
 * ```
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
}

/**
 * String Utilities
 */

/**
 * Truncate string with ellipsis
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param position - Where to truncate ('start', 'middle', 'end')
 * @returns Truncated string
 *
 * @example
 * ```typescript
 * const truncated = truncateString('very long string', 10, 'middle');
 * console.log(truncated); // "very...string"
 * ```
 */
export function truncateString(
  str: string,
  maxLength: number,
  position: 'start' | 'middle' | 'end' = 'middle',
): string {
  if (str.length <= maxLength) {
    return str;
  }

  const ellipsis = '...';

  switch (position) {
    case 'start':
      return ellipsis + str.slice(-(maxLength - ellipsis.length));
    case 'end':
      return str.slice(0, maxLength - ellipsis.length) + ellipsis;
    case 'middle':
    default:
      const startLength = Math.floor((maxLength - ellipsis.length) / 2);
      const endLength = maxLength - ellipsis.length - startLength;
      return str.slice(0, startLength) + ellipsis + str.slice(-endLength);
  }
}

/**
 * Copy text to clipboard
 *
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 *
 * @example
 * ```typescript
 * await copyToClipboard(address);
 * console.log('Copied to clipboard!');
 * ```
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  } catch (error) {
    throw new Error('Failed to copy to clipboard');
  }
}

/**
 * Local Storage Utilities
 */

/**
 * Safely store data in localStorage
 *
 * @param key - Storage key
 * @param data - Data to store
 *
 * @example
 * ```typescript
 * safeLocalStorageSet('wallet-address', address);
 * ```
 */
export function safeLocalStorageSet(key: string, data: any): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.warn(`Failed to store data in localStorage for key "${key}":`, error);
  }
}

/**
 * Safely retrieve data from localStorage
 *
 * @param key - Storage key
 * @param defaultValue - Default value if not found
 * @returns Retrieved data or default value
 *
 * @example
 * ```typescript
 * const address = safeLocalStorageGet('wallet-address', '');
 * ```
 */
export function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Failed to retrieve data from localStorage for key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely remove data from localStorage
 *
 * @param key - Storage key
 *
 * @example
 * ```typescript
 * safeLocalStorageRemove('wallet-address');
 * ```
 */
export function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove data from localStorage for key "${key}":`, error);
  }
}

/**
 * Debounce function
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query) => search(query), 300);
 * debouncedSearch('selendra');
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 *
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => handleScroll(), 100);
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate random ID
 *
 * @param length - Length of ID
 * @returns Random ID string
 *
 * @example
 * ```typescript
 * const id = generateRandomId(8);
 * console.log(id); // "a1b2c3d4"
 * ```
 */
export function generateRandomId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Check if value is empty
 *
 * @param value - Value to check
 * @returns Whether value is empty
 *
 * @example
 * ```typescript
 * console.log(isEmpty(null)); // true
 * console.log(isEmpty('')); // true
 * console.log(isEmpty([])); // true
 * console.log(isEmpty('hello')); // false
 * ```
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}

/**
 * Deep clone object
 *
 * @param obj - Object to clone
 * @returns Cloned object
 *
 * @example
 * ```typescript
 * const cloned = deepClone(originalObject);
 * ```
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * Retry function with exponential backoff
 *
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param delay - Initial delay in milliseconds
 * @returns Promise that resolves when function succeeds
 *
 * @example
 * ```typescript
 * await retry(() => fetch('/api/data'), 3, 1000);
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (i === maxRetries) {
        break;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

/**
 * Check if current environment is development
 *
 * @returns Whether environment is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if current environment is production
 *
 * @returns Whether environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get current network environment
 *
 * @returns Network environment string
 */
export function getNetworkEnvironment(): 'development' | 'staging' | 'production' {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'development';
  }

  if (hostname.includes('staging') || hostname.includes('test')) {
    return 'staging';
  }

  return 'production';
}
