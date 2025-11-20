/**
 * Balance-related types and utilities for the Selendra SDK
 */

import type { Balance, TokenAmount, Address } from './common';

/**
 * Detailed balance information for an account
 */
export interface BalanceDetails {
  /** Account address */
  address: Address;
  /** Free balance */
  free: string;
  /** Reserved balance */
  reserved: string;
  /** Frozen balance */
  frozen: string;
  /** Total balance */
  total: string;
}

// Re-export Balance for convenience
export type { Balance };

/**
 * Balance unit enumeration
 */
export enum BalanceUnit {
  WEI = 'wei',
  KWEI = 'kwei',
  MWEI = 'mwei',
  GWEI = 'gwei',
  MICRO = 'micro',
  MILLI = 'milli',
  ETH = 'eth',
  KETH = 'keth',
  METH = 'meth',
  PLANCK = 'planck',
  ATTO = 'atto',
}

/**
 * Balance format options
 */
export interface BalanceFormatOptions {
  /** Unit to format balance in */
  unit?: BalanceUnit;
  /** Number of decimal places */
  decimals?: number;
  /** Show unit suffix */
  showUnit?: boolean;
  /** Use grouping separator */
  useGrouping?: boolean;
  /** Custom unit name */
  customUnit?: string;
}

/**
 * Balance calculation result
 */
export interface BalanceCalculation {
  /** Original balance */
  original: Balance;
  /** Calculated balance */
  calculated: Balance;
  /** Unit used */
  unit: BalanceUnit;
  /** Formatted string */
  formatted: string;
  /** Decimal places */
  decimals: number;
}

/**
 * Transaction fee breakdown
 */
export interface TransactionFee {
  /** Base fee */
  baseFee: Balance;
  /** Weight fee */
  weightFee: Balance;
  /** Length fee */
  lengthFee: Balance;
  /** Tip/adjustment fee */
  adjustmentFee: Balance;
  /** Total fee */
  totalFee: Balance;
}

/**
 * Balance transfer options
 */
export interface BalanceTransferOptions {
  /** Sender address */
  from: Address;
  /** Recipient address */
  to: Address;
  /** Amount to transfer */
  amount: Balance;
  /** Maximum fee willing to pay */
  maxFee?: Balance;
  /** Keep alive flag (for Substrate) */
  keepAlive?: boolean;
  /** Memo or reference */
  memo?: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * Token balance interface
 */
export interface TokenBalance {
  /** Token identifier */
  tokenId: string;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Token decimals */
  decimals: number;
  /** Balance amount */
  balance: Balance;
  /** Formatted balance */
  formattedBalance: string;
  /** USD value */
  usdValue?: number;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Multi-token balance information
 */
export interface MultiTokenBalance {
  /** Account address */
  address: Address;
  /** Native token balance */
  nativeBalance: TokenBalance;
  /** Token balances */
  tokenBalances: TokenBalance[];
  /** Total USD value */
  totalUsdValue?: number;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Balance conversion rates
 */
export interface BalanceConversionRates {
  /** Base currency */
  baseCurrency: string;
  /** Conversion rates */
  rates: Record<string, number>;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Balance utility functions
 */
export class BalanceUtils {
  /** Decimal places for different units */
  private static readonly UNIT_DECIMALS: Record<BalanceUnit, number> = {
    [BalanceUnit.WEI]: 0,
    [BalanceUnit.KWEI]: 3,
    [BalanceUnit.MWEI]: 6,
    [BalanceUnit.GWEI]: 9,
    [BalanceUnit.MICRO]: 6,
    [BalanceUnit.MILLI]: 3,
    [BalanceUnit.ETH]: 18,
    [BalanceUnit.KETH]: 21,
    [BalanceUnit.METH]: 24,
    [BalanceUnit.PLANCK]: 0,
    [BalanceUnit.ATTO]: 18,
  };

  /**
   * Convert balance to different unit
   */
  static convert(balance: Balance, fromUnit: BalanceUnit, toUnit: BalanceUnit): BalanceCalculation {
    const fromDecimals = this.UNIT_DECIMALS[fromUnit];
    const toDecimals = this.UNIT_DECIMALS[toUnit];
    const decimalDifference = toDecimals - fromDecimals;

    let calculatedBalance: bigint;

    if (typeof balance === 'string') {
      calculatedBalance = BigInt(balance);
    } else {
      calculatedBalance = balance;
    }

    if (decimalDifference > 0) {
      calculatedBalance = calculatedBalance * BigInt(10 ** decimalDifference);
    } else if (decimalDifference < 0) {
      calculatedBalance = calculatedBalance / BigInt(10 ** Math.abs(decimalDifference));
    }

    return {
      original: balance,
      calculated: calculatedBalance.toString(),
      unit: toUnit,
      formatted: this.format(calculatedBalance.toString(), { unit: toUnit }),
      decimals: toDecimals,
    };
  }

  /**
   * Format balance for display
   */
  static format(balance: Balance, options: BalanceFormatOptions = {}): string {
    const {
      unit = BalanceUnit.ETH,
      decimals = 6,
      showUnit = true,
      useGrouping = true,
      customUnit,
    } = options;

    // Convert to smallest unit (wei/planck) first
    const inWei = this.convert(balance, unit, BalanceUnit.WEI);
    const inTargetUnit = this.convert(inWei.calculated, BalanceUnit.WEI, unit);

    // Format the balance
    const number = Number(inTargetUnit.calculated) / Math.pow(10, this.UNIT_DECIMALS[unit]);
    let formatted = number.toFixed(decimals);

    // Remove trailing zeros and unnecessary decimal point
    formatted = formatted.replace(/\.?0+$/, '');

    // Add grouping if requested
    if (useGrouping) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }

    // Add unit suffix if requested
    if (showUnit) {
      const unitName = customUnit || unit.toUpperCase();
      formatted = `${formatted} ${unitName}`;
    }

    return formatted;
  }

  /**
   * Parse formatted balance string
   */
  static parse(formatted: string, unit: BalanceUnit = BalanceUnit.ETH): Balance {
    // Remove unit suffix and whitespace
    const numeric = formatted.replace(/[a-zA-Z]/g, '').trim();

    // Remove grouping separators
    const ungrouped = numeric.replace(/,/g, '');

    // Convert to bigint in the specified unit
    const decimals = this.UNIT_DECIMALS[unit];
    const [integer, fraction = '0'] = ungrouped.split('.');

    const integerBigInt = BigInt(integer) * BigInt(10 ** decimals);
    const fractionBigInt = BigInt((fraction + '0'.repeat(decimals)).slice(0, decimals));

    return (integerBigInt + fractionBigInt).toString();
  }

  /**
   * Calculate transaction fee
   */
  static calculateFee(
    weight: number,
    weightPrice: Balance,
    length: number,
    lengthPrice: Balance,
    tip: Balance = '0',
  ): TransactionFee {
    const weightFeeBigInt = BigInt(weight) * BigInt(weightPrice);
    const lengthFeeBigInt = BigInt(length) * BigInt(lengthPrice);
    const tipBigInt = BigInt(tip);

    const baseFeeBigInt = weightFeeBigInt + lengthFeeBigInt;
    const totalFeeBigInt = baseFeeBigInt + tipBigInt;

    return {
      baseFee: baseFeeBigInt.toString(),
      weightFee: weightFeeBigInt.toString(),
      lengthFee: lengthFeeBigInt.toString(),
      adjustmentFee: tipBigInt.toString(),
      totalFee: totalFeeBigInt.toString(),
    };
  }

  /**
   * Compare two balances
   */
  static compare(balance1: Balance, balance2: Balance): -1 | 0 | 1 {
    const b1 = typeof balance1 === 'string' ? BigInt(balance1) : balance1;
    const b2 = typeof balance2 === 'string' ? BigInt(balance2) : balance2;

    if (b1 < b2) {
      return -1;
    } else if (b1 > b2) {
      return 1;
    } else {
      return 0;
    }
  }

  /**
   * Check if balance is sufficient for transaction
   */
  static isSufficient(balance: Balance, requiredAmount: Balance, fee: Balance = '0'): boolean {
    const balanceBigInt = typeof balance === 'string' ? BigInt(balance) : balance;
    const amountBigInt =
      typeof requiredAmount === 'string' ? BigInt(requiredAmount) : requiredAmount;
    const feeBigInt = typeof fee === 'string' ? BigInt(fee) : fee;

    return balanceBigInt >= amountBigInt + feeBigInt;
  }

  /**
   * Add two balances
   */
  static add(balance1: Balance, balance2: Balance): Balance {
    const b1 = typeof balance1 === 'string' ? BigInt(balance1) : balance1;
    const b2 = typeof balance2 === 'string' ? BigInt(balance2) : balance2;
    return (b1 + b2).toString();
  }

  /**
   * Subtract one balance from another
   */
  static subtract(balance1: Balance, balance2: Balance): Balance {
    const b1 = typeof balance1 === 'string' ? BigInt(balance1) : balance1;
    const b2 = typeof balance2 === 'string' ? BigInt(balance2) : balance2;
    return (b1 - b2).toString();
  }

  /**
   * Multiply balance by a number
   */
  static multiply(balance: Balance, multiplier: number): Balance {
    const b = typeof balance === 'string' ? BigInt(balance) : balance;
    return ((b * BigInt(Math.floor(multiplier * 1000000))) / BigInt(1000000)).toString();
  }

  /**
   * Divide balance by a number
   */
  static divide(balance: Balance, divisor: number): Balance {
    const b = typeof balance === 'string' ? BigInt(balance) : balance;
    return ((b * BigInt(1000000)) / BigInt(Math.floor(divisor * 1000000))).toString();
  }
}
