"use strict";
/**
 * Balance-related types and utilities for the Selendra SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceUtils = exports.BalanceUnit = void 0;
/**
 * Balance unit enumeration
 */
var BalanceUnit;
(function (BalanceUnit) {
    BalanceUnit["WEI"] = "wei";
    BalanceUnit["KWEI"] = "kwei";
    BalanceUnit["MWEI"] = "mwei";
    BalanceUnit["GWEI"] = "gwei";
    BalanceUnit["MICRO"] = "micro";
    BalanceUnit["MILLI"] = "milli";
    BalanceUnit["ETH"] = "eth";
    BalanceUnit["KETH"] = "keth";
    BalanceUnit["METH"] = "meth";
    BalanceUnit["PLANCK"] = "planck";
    BalanceUnit["ATTO"] = "atto";
})(BalanceUnit || (exports.BalanceUnit = BalanceUnit = {}));
/**
 * Balance utility functions
 */
class BalanceUtils {
    /**
     * Convert balance to different unit
     */
    static convert(balance, fromUnit, toUnit) {
        const fromDecimals = this.UNIT_DECIMALS[fromUnit];
        const toDecimals = this.UNIT_DECIMALS[toUnit];
        const decimalDifference = toDecimals - fromDecimals;
        let calculatedBalance;
        if (typeof balance === 'string') {
            calculatedBalance = BigInt(balance);
        }
        else {
            calculatedBalance = balance;
        }
        if (decimalDifference > 0) {
            calculatedBalance = calculatedBalance * BigInt(10 ** decimalDifference);
        }
        else if (decimalDifference < 0) {
            calculatedBalance = calculatedBalance / BigInt(10 ** Math.abs(decimalDifference));
        }
        return {
            original: balance,
            calculated: calculatedBalance.toString(),
            unit: toUnit,
            formatted: this.format(calculatedBalance.toString(), toUnit),
            decimals: toDecimals
        };
    }
    /**
     * Format balance for display
     */
    static format(balance, options = {}) {
        const { unit = BalanceUnit.ETH, decimals = 6, showUnit = true, useGrouping = true, customUnit } = options;
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
    static parse(formatted, unit = BalanceUnit.ETH) {
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
    static calculateFee(weight, weightPrice, length, lengthPrice, tip = '0') {
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
            totalFee: totalFeeBigInt.toString()
        };
    }
    /**
     * Compare two balances
     */
    static compare(balance1, balance2) {
        const b1 = typeof balance1 === 'string' ? BigInt(balance1) : balance1;
        const b2 = typeof balance2 === 'string' ? BigInt(balance2) : balance2;
        if (b1 < b2) {
            return -1;
        }
        else if (b1 > b2) {
            return 1;
        }
        else {
            return 0;
        }
    }
    /**
     * Check if balance is sufficient for transaction
     */
    static isSufficient(balance, requiredAmount, fee = '0') {
        const balanceBigInt = typeof balance === 'string' ? BigInt(balance) : balance;
        const amountBigInt = typeof requiredAmount === 'string' ? BigInt(requiredAmount) : requiredAmount;
        const feeBigInt = typeof fee === 'string' ? BigInt(fee) : fee;
        return balanceBigInt >= amountBigInt + feeBigInt;
    }
    /**
     * Add two balances
     */
    static add(balance1, balance2) {
        const b1 = typeof balance1 === 'string' ? BigInt(balance1) : balance1;
        const b2 = typeof balance2 === 'string' ? BigInt(balance2) : balance2;
        return (b1 + b2).toString();
    }
    /**
     * Subtract one balance from another
     */
    static subtract(balance1, balance2) {
        const b1 = typeof balance1 === 'string' ? BigInt(balance1) : balance1;
        const b2 = typeof balance2 === 'string' ? BigInt(balance2) : balance2;
        return (b1 - b2).toString();
    }
    /**
     * Multiply balance by a number
     */
    static multiply(balance, multiplier) {
        const b = typeof balance === 'string' ? BigInt(balance) : balance;
        return (b * BigInt(Math.floor(multiplier * 1000000)) / BigInt(1000000)).toString();
    }
    /**
     * Divide balance by a number
     */
    static divide(balance, divisor) {
        const b = typeof balance === 'string' ? BigInt(balance) : balance;
        return (b * BigInt(1000000) / BigInt(Math.floor(divisor * 1000000))).toString();
    }
}
exports.BalanceUtils = BalanceUtils;
/** Decimal places for different units */
Object.defineProperty(BalanceUtils, "UNIT_DECIMALS", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
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
        [BalanceUnit.ATTO]: 18
    }
});
//# sourceMappingURL=balance.js.map