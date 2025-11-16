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
import { ChainType, BalanceInfo, TransactionInfo } from '../types';
import { FormatterOptions, ValidationResult } from './types';
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
export declare function formatBalance(balance: BalanceInfo, options?: FormatterOptions): string;
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
export declare function formatAddress(address: string, length?: number): string;
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
export declare function formatTxHash(hash: string, length?: number): string;
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
export declare function formatTimestamp(timestamp: number, options?: {
    relative?: boolean;
    format?: string;
}): string;
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
export declare function formatGasPrice(gasPrice: string, decimals?: number): string;
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
export declare function validateAddress(address: string, chainType: ChainType): ValidationResult;
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
export declare function validateAmount(amount: string, balance: BalanceInfo, decimals?: number): ValidationResult;
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
export declare function validateSecret(secret: string, type: 'privatekey' | 'mnemonic'): ValidationResult;
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
export declare function formatErrorMessage(error: unknown): string;
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
export declare function getErrorSeverity(error: unknown): 'warning' | 'error' | 'critical';
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
export declare function calculateTransactionFee(tx: any, gasPrice?: string): string;
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
export declare function getTransactionStatusColor(status: string): string;
/**
 * Check if transaction is confirmed
 *
 * @param transaction - Transaction info
 * @param confirmations - Number of confirmations required
 * @returns Whether transaction is confirmed
 *
 * @example
 * ```typescript
 * const isConfirmed = isTransactionConfirmed(tx, 6);
 * console.log(isConfirmed); // true or false
 * ```
 */
export declare function isTransactionConfirmed(transaction: TransactionInfo, confirmations?: number): boolean;
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
export declare function getChainDisplayName(chainType: ChainType): string;
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
export declare function getChainColors(chainType: ChainType): {
    primary: string;
    secondary: string;
};
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
export declare function getExplorerUrl(chainType: ChainType, hash: string): string;
/**
 * Date and Time Utilities
 */
/**
 * Check if date is today
 *
 * @param date - Date to check
 * @returns Whether date is today
 */
export declare function isToday(date: Date): boolean;
/**
 * Check if date is yesterday
 *
 * @param date - Date to check
 * @returns Whether date is yesterday
 */
export declare function isYesterday(date: Date): boolean;
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
export declare function formatDuration(seconds: number): string;
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
export declare function truncateString(str: string, maxLength: number, position?: 'start' | 'middle' | 'end'): string;
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
export declare function copyToClipboard(text: string): Promise<void>;
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
export declare function safeLocalStorageSet(key: string, data: any): void;
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
export declare function safeLocalStorageGet<T>(key: string, defaultValue: T): T;
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
export declare function safeLocalStorageRemove(key: string): void;
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
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
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
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
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
export declare function generateRandomId(length?: number): string;
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
export declare function isEmpty(value: any): boolean;
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
export declare function deepClone<T>(obj: T): T;
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
export declare function retry<T>(fn: () => Promise<T>, maxRetries?: number, delay?: number): Promise<T>;
/**
 * Check if current environment is development
 *
 * @returns Whether environment is development
 */
export declare function isDevelopment(): boolean;
/**
 * Check if current environment is production
 *
 * @returns Whether environment is production
 */
export declare function isProduction(): boolean;
/**
 * Get current network environment
 *
 * @returns Network environment string
 */
export declare function getNetworkEnvironment(): 'development' | 'staging' | 'production';
//# sourceMappingURL=utils.d.ts.map