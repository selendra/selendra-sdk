/**
 * Balance-related types and utilities for the Selendra SDK
 */
import type { Balance as BalanceValue, Address } from './common';
export type { Balance };
/**
 * Balance interface for SDK operations
 */
export interface Balance {
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
/**
 * Backward compatibility
 */
export type BalancePrimitive = BalanceValue;
/**
 * Balance unit enumeration
 */
export declare enum BalanceUnit {
    WEI = "wei",
    KWEI = "kwei",
    MWEI = "mwei",
    GWEI = "gwei",
    MICRO = "micro",
    MILLI = "milli",
    ETH = "eth",
    KETH = "keth",
    METH = "meth",
    PLANCK = "planck",
    ATTO = "atto"
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
export declare class BalanceUtils {
    /** Decimal places for different units */
    private static readonly UNIT_DECIMALS;
    /**
     * Convert balance to different unit
     */
    static convert(balance: BalancePrimitive, fromUnit: BalanceUnit, toUnit: BalanceUnit): BalanceCalculation;
    /**
     * Format balance for display
     */
    static format(balance: BalancePrimitive, options?: BalanceFormatOptions): string;
    /**
     * Parse formatted balance string
     */
    static parse(formatted: string, unit?: BalanceUnit): Balance;
    /**
     * Calculate transaction fee
     */
    static calculateFee(weight: number, weightPrice: Balance, length: number, lengthPrice: Balance, tip?: Balance): TransactionFee;
    /**
     * Compare two balances
     */
    static compare(balance1: BalancePrimitive, balance2: BalancePrimitive): -1 | 0 | 1;
    /**
     * Check if balance is sufficient for transaction
     */
    static isSufficient(balance: BalancePrimitive, requiredAmount: BalancePrimitive, fee?: BalancePrimitive): boolean;
    /**
     * Add two balances
     */
    static add(balance1: BalancePrimitive, balance2: BalancePrimitive): BalancePrimitive;
    /**
     * Subtract one balance from another
     */
    static subtract(balance1: BalancePrimitive, balance2: BalancePrimitive): BalancePrimitive;
    /**
     * Multiply balance by a number
     */
    static multiply(balance: BalancePrimitive, multiplier: number): BalancePrimitive;
    /**
     * Divide balance by a number
     */
    static divide(balance: BalancePrimitive, divisor: number): BalancePrimitive;
}
//# sourceMappingURL=balance.d.ts.map