import { createError } from '../types/errors';

/**
 * Validation utilities for input validation across the SDK
 */

/**
 * Validates an Ethereum address
 */
export function validateAddress(address: string, fieldName: string = 'address'): string {
  if (!address || typeof address !== 'string') {
    throw createError.validation(`${fieldName} is required and must be a string`, {
      provided: address,
      field: fieldName
    });
  }

  // Remove whitespace
  address = address.trim();

  // Check basic format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw createError.validation(
      `Invalid ${fieldName} format. Must be a valid Ethereum address (0x followed by 40 hex characters)`,
      {
        provided: address,
        field: fieldName,
        expected: '0x followed by 40 hex characters'
      }
    );
  }

  // Optional: Add checksum validation
  return address.toLowerCase();
}

/**
 * Validates a transaction hash
 */
export function validateTransactionHash(hash: string, fieldName: string = 'transaction hash'): string {
  if (!hash || typeof hash !== 'string') {
    throw createError.validation(`${fieldName} is required and must be a string`, {
      provided: hash,
      field: fieldName
    });
  }

  hash = hash.trim();

  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    throw createError.validation(
      `Invalid ${fieldName} format. Must be a valid transaction hash (0x followed by 64 hex characters)`,
      {
        provided: hash,
        field: fieldName,
        expected: '0x followed by 64 hex characters'
      }
    );
  }

  return hash.toLowerCase();
}

/**
 * Validates an amount string (for ether/token amounts)
 */
export function validateAmount(amount: string | number, fieldName: string = 'amount'): string {
  if (amount === null || amount === undefined) {
    throw createError.validation(`${fieldName} is required`, {
      provided: amount,
      field: fieldName
    });
  }

  const amountStr = String(amount);

  // Check if it's a valid number
  if (isNaN(Number(amountStr)) || Number(amountStr) < 0) {
    throw createError.validation(
      `${fieldName} must be a valid positive number`,
      {
        provided: amountStr,
        field: fieldName
      }
    );
  }

  // Check for reasonable decimal places (max 18 for wei precision)
  const decimalMatch = amountStr.match(/\.(\d+)/);
  if (decimalMatch && decimalMatch[1].length > 18) {
    throw createError.validation(
      `${fieldName} has too many decimal places (max 18)`,
      {
        provided: amountStr,
        field: fieldName,
        decimals: decimalMatch[1].length
      }
    );
  }

  return amountStr;
}

/**
 * Validates a percentage value (0-100)
 */
export function validatePercentage(percentage: number, fieldName: string = 'percentage'): number {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    throw createError.validation(`${fieldName} must be a valid number`, {
      provided: percentage,
      field: fieldName
    });
  }

  if (percentage < 0 || percentage > 100) {
    throw createError.validation(
      `${fieldName} must be between 0 and 100`,
      {
        provided: percentage,
        field: fieldName,
        range: [0, 100]
      }
    );
  }

  return percentage;
}

/**
 * Validates a slippage value (0-100)
 */
export function validateSlippage(slippage: number): number {
  validatePercentage(slippage, 'slippage');

  if (slippage > 50) {
    console.warn(`Warning: High slippage tolerance of ${slippage}% may result in significant losses`);
  }

  return slippage;
}

/**
 * Validates a deadline timestamp
 */
export function validateDeadline(deadline: number, fieldName: string = 'deadline'): number {
  if (typeof deadline !== 'number' || isNaN(deadline) || !Number.isInteger(deadline)) {
    throw createError.validation(`${fieldName} must be a valid integer timestamp`, {
      provided: deadline,
      field: fieldName
    });
  }

  const now = Math.floor(Date.now() / 1000);
  if (deadline <= now) {
    throw createError.validation(
      `${fieldName} must be in the future`,
      {
        provided: deadline,
        current: now,
        field: fieldName
      }
    );
  }

  // Warn if deadline is too far in the future (more than 24 hours)
  const maxReasonableDeadline = now + (24 * 60 * 60); // 24 hours
  if (deadline > maxReasonableDeadline) {
    console.warn(`Warning: Deadline is more than 24 hours in the future: ${new Date(deadline * 1000).toISOString()}`);
  }

  return deadline;
}

/**
 * Validates a gas limit
 */
export function validateGasLimit(gasLimit: string | number, fieldName: string = 'gas limit'): string {
  if (gasLimit === null || gasLimit === undefined) {
    throw createError.validation(`${fieldName} is required`, {
      provided: gasLimit,
      field: fieldName
    });
  }

  const gasLimitStr = String(gasLimit);
  const gasLimitNum = Number(gasLimitStr);

  if (isNaN(gasLimitNum) || gasLimitNum <= 0 || !Number.isInteger(gasLimitNum)) {
    throw createError.validation(
      `${fieldName} must be a positive integer`,
      {
        provided: gasLimitStr,
        field: fieldName
      }
    );
  }

  // Check reasonable bounds
  const MIN_GAS = 21000; // Minimum for a simple transfer
  const MAX_GAS = 30000000; // Block gas limit on most networks

  if (gasLimitNum < MIN_GAS) {
    throw createError.validation(
      `${fieldName} is too low (minimum: ${MIN_GAS})`,
      {
        provided: gasLimitNum,
        minimum: MIN_GAS,
        field: fieldName
      }
    );
  }

  if (gasLimitNum > MAX_GAS) {
    throw createError.validation(
      `${fieldName} is too high (maximum: ${MAX_GAS})`,
      {
        provided: gasLimitNum,
        maximum: MAX_GAS,
        field: fieldName
      }
    );
  }

  return gasLimitStr;
}

/**
 * Validates a token ID
 */
export function validateTokenId(tokenId: string | number, fieldName: string = 'token ID'): string {
  if (tokenId === null || tokenId === undefined) {
    throw createError.validation(`${fieldName} is required`, {
      provided: tokenId,
      field: fieldName
    });
  }

  const tokenIdStr = String(tokenId);
  const tokenIdNum = Number(tokenIdStr);

  if (isNaN(tokenIdNum) || tokenIdNum < 0 || !Number.isInteger(tokenIdNum)) {
    throw createError.validation(
      `${fieldName} must be a non-negative integer`,
      {
        provided: tokenIdStr,
        field: fieldName
      }
    );
  }

  return tokenIdStr;
}

/**
 * Validates a chain ID
 */
export function validateChainId(chainId: number, fieldName: string = 'chain ID'): number {
  if (typeof chainId !== 'number' || isNaN(chainId) || !Number.isInteger(chainId) || chainId <= 0) {
    throw createError.validation(
      `${fieldName} must be a positive integer`,
      {
        provided: chainId,
        field: fieldName
      }
    );
  }

  return chainId;
}

/**
 * Validates network configuration
 */
export function validateNetworkConfig(config: any): void {
  if (!config || typeof config !== 'object') {
    throw createError.validation('Network configuration must be an object', {
      provided: config
    });
  }

  const required = ['name', 'chainId', 'rpcUrl', 'currency'];
  for (const field of required) {
    if (!config[field]) {
      throw createError.validation(`Network configuration missing required field: ${field}`, {
        provided: config,
        missing: field
      });
    }
  }

  validateChainId(config.chainId, 'network chainId');

  if (typeof config.rpcUrl !== 'string' || !config.rpcUrl.startsWith('http')) {
    throw createError.validation('Network rpcUrl must be a valid HTTP(S) URL', {
      provided: config.rpcUrl
    });
  }

  if (!config.currency || typeof config.currency !== 'object') {
    throw createError.validation('Network currency configuration is required', {
      provided: config.currency
    });
  }

  const currencyRequired = ['name', 'symbol', 'decimals'];
  for (const field of currencyRequired) {
    if (config.currency[field] === undefined || config.currency[field] === null) {
      throw createError.validation(`Network currency missing required field: ${field}`, {
        provided: config.currency,
        missing: field
      });
    }
  }

  if (typeof config.currency.decimals !== 'number' || 
      config.currency.decimals < 0 || 
      config.currency.decimals > 18) {
    throw createError.validation('Network currency decimals must be between 0 and 18', {
      provided: config.currency.decimals
    });
  }
}

/**
 * Validates contract ABI
 */
export function validateContractABI(abi: any, fieldName: string = 'contract ABI'): any[] {
  if (!Array.isArray(abi)) {
    throw createError.validation(`${fieldName} must be an array`, {
      provided: typeof abi,
      field: fieldName
    });
  }

  if (abi.length === 0) {
    throw createError.validation(`${fieldName} cannot be empty`, {
      field: fieldName
    });
  }

  return abi;
}

/**
 * Validates URL format
 */
export function validateUrl(url: string, fieldName: string = 'URL'): string {
  if (!url || typeof url !== 'string') {
    throw createError.validation(`${fieldName} is required and must be a string`, {
      provided: url,
      field: fieldName
    });
  }

  url = url.trim();

  try {
    new URL(url);
  } catch {
    throw createError.validation(`${fieldName} must be a valid URL`, {
      provided: url,
      field: fieldName
    });
  }

  return url;
}

/**
 * Generic object validation helper
 */
export function validateObject<T>(
  obj: any,
  requiredFields: (keyof T)[],
  fieldName: string = 'object'
): T {
  if (!obj || typeof obj !== 'object') {
    throw createError.validation(`${fieldName} must be an object`, {
      provided: typeof obj,
      field: fieldName
    });
  }

  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null) {
      throw createError.validation(`${fieldName} missing required field: ${String(field)}`, {
        provided: obj,
        missing: String(field),
        field: fieldName
      });
    }
  }

  return obj as T;
}

/**
 * Validates array parameter
 */
export function validateArray<T>(
  arr: any,
  fieldName: string = 'array',
  minLength: number = 1
): T[] {
  if (!Array.isArray(arr)) {
    throw createError.validation(`${fieldName} must be an array`, {
      provided: typeof arr,
      field: fieldName
    });
  }

  if (arr.length < minLength) {
    throw createError.validation(
      `${fieldName} must have at least ${minLength} item(s)`,
      {
        provided: arr.length,
        minimum: minLength,
        field: fieldName
      }
    );
  }

  return arr;
}