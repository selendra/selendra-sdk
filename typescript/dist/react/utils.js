"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBalance = formatBalance;
exports.formatAddress = formatAddress;
exports.formatTxHash = formatTxHash;
exports.formatTimestamp = formatTimestamp;
exports.formatGasPrice = formatGasPrice;
exports.validateAddress = validateAddress;
exports.validateAmount = validateAmount;
exports.validateSecret = validateSecret;
exports.formatErrorMessage = formatErrorMessage;
exports.getErrorSeverity = getErrorSeverity;
exports.calculateTransactionFee = calculateTransactionFee;
exports.getTransactionStatusColor = getTransactionStatusColor;
exports.isTransactionConfirmed = isTransactionConfirmed;
exports.getChainDisplayName = getChainDisplayName;
exports.getChainColors = getChainColors;
exports.getExplorerUrl = getExplorerUrl;
exports.isToday = isToday;
exports.isYesterday = isYesterday;
exports.formatDuration = formatDuration;
exports.truncateString = truncateString;
exports.copyToClipboard = copyToClipboard;
exports.safeLocalStorageSet = safeLocalStorageSet;
exports.safeLocalStorageGet = safeLocalStorageGet;
exports.safeLocalStorageRemove = safeLocalStorageRemove;
exports.debounce = debounce;
exports.throttle = throttle;
exports.generateRandomId = generateRandomId;
exports.isEmpty = isEmpty;
exports.deepClone = deepClone;
exports.retry = retry;
exports.isDevelopment = isDevelopment;
exports.isProduction = isProduction;
exports.getNetworkEnvironment = getNetworkEnvironment;
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
function formatBalance(balance, options = {}) {
    const { decimals = 6, showCommas = true, abbreviate = false, prefix = '', suffix = '', currency = '' } = options;
    const value = Number(balance.balance) / Math.pow(10, balance.decimals);
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
        }
        else if (value >= 1e6) {
            formattedValue = `${(value / 1e6).toFixed(1)}M`;
        }
        else if (value >= 1e3) {
            formattedValue = `${(value / 1e3).toFixed(1)}K`;
        }
    }
    const symbol = balance.symbol || 'SEL';
    const currencySymbol = currency || (balance.usdValue ? '$' : '');
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
function formatAddress(address, length = 6) {
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
function formatTxHash(hash, length = 8) {
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
function formatTimestamp(timestamp, options = {}) {
    const { relative = false, format = 'MMM d, yyyy h:mm a' } = options;
    const date = new Date(timestamp);
    if (relative) {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0)
            return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0)
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0)
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
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
function formatGasPrice(gasPrice, decimals = 2) {
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
function validateAddress(address, chainType) {
    const errors = [];
    const warnings = [];
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
        case 'unified':
            // Unified addresses can be either format
            if (!address.startsWith('0x') && address.length < 32) {
                errors.push('Invalid address format');
            }
            break;
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
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
function validateAmount(amount, balance, decimals) {
    const errors = [];
    const warnings = [];
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
    const balanceValue = Number(balance.balance);
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
        warnings
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
function validateSecret(secret, type) {
    const errors = [];
    const warnings = [];
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
            }
            else {
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
        warnings
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
function formatErrorMessage(error) {
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
function getErrorSeverity(error) {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
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
function calculateTransactionFee(tx, gasPrice) {
    try {
        if (tx.gas && gasPrice) {
            // EVM transaction
            const gasLimit = typeof tx.gas === 'string' ? tx.gas : tx.gas.toString();
            const fee = (parseInt(gasLimit) * parseInt(gasPrice)).toString();
            return fee;
        }
        // Substrate transaction fee calculation would go here
        return '0';
    }
    catch (error) {
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
function getTransactionStatusColor(status) {
    const colors = {
        pending: '#f59e0b', // warning
        included: '#3b82f6', // info
        finalized: '#10b981', // success
        failed: '#ef4444', // error
        unknown: '#6b7280' // muted
    };
    return colors[status] || colors.unknown;
}
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
function isTransactionConfirmed(transaction, confirmations = 1) {
    if (!transaction || !transaction.blockNumber) {
        return false;
    }
    if (transaction.status === 'finalized') {
        return true;
    }
    if (transaction.currentBlockNumber) {
        const confirmationsCount = transaction.currentBlockNumber - transaction.blockNumber;
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
function getChainDisplayName(chainType) {
    const names = {
        substrate: 'Selendra Substrate',
        evm: 'Selendra EVM',
        unified: 'Selendra Unified'
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
function getChainColors(chainType) {
    const colors = {
        substrate: {
            primary: '#6366f1',
            secondary: '#8b5cf6'
        },
        evm: {
            primary: '#10b981',
            secondary: '#06b6d4'
        },
        unified: {
            primary: '#f59e0b',
            secondary: '#ef4444'
        }
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
function getExplorerUrl(chainType, hash) {
    const explorers = {
        substrate: `https://explorer.selendra.org/transaction/${hash}`,
        evm: `https://evm-explorer.selendra.org/tx/${hash}`,
        unified: `https://explorer.selendra.org/transaction/${hash}`
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
function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}
/**
 * Check if date is yesterday
 *
 * @param date - Date to check
 * @returns Whether date is yesterday
 */
function isYesterday(date) {
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
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const parts = [];
    if (hours > 0)
        parts.push(`${hours}h`);
    if (minutes > 0)
        parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0)
        parts.push(`${remainingSeconds}s`);
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
function truncateString(str, maxLength, position = 'middle') {
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
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        }
        else {
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
    }
    catch (error) {
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
function safeLocalStorageSet(key, data) {
    try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(key, serialized);
    }
    catch (error) {
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
function safeLocalStorageGet(key, defaultValue) {
    try {
        const item = localStorage.getItem(key);
        if (item === null) {
            return defaultValue;
        }
        return JSON.parse(item);
    }
    catch (error) {
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
function safeLocalStorageRemove(key) {
    try {
        localStorage.removeItem(key);
    }
    catch (error) {
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
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
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
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
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
function generateRandomId(length = 8) {
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
function isEmpty(value) {
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
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    const cloned = {};
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
async function retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            if (i === maxRetries) {
                break;
            }
            // Exponential backoff
            const waitTime = delay * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    throw lastError;
}
/**
 * Check if current environment is development
 *
 * @returns Whether environment is development
 */
function isDevelopment() {
    return process.env.NODE_ENV === 'development';
}
/**
 * Check if current environment is production
 *
 * @returns Whether environment is production
 */
function isProduction() {
    return process.env.NODE_ENV === 'production';
}
/**
 * Get current network environment
 *
 * @returns Network environment string
 */
function getNetworkEnvironment() {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        return 'development';
    }
    if (hostname.includes('staging') || hostname.includes('test')) {
        return 'staging';
    }
    return 'production';
}
//# sourceMappingURL=utils.js.map