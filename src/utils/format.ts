import { ethers } from 'ethers';

export class FormatUtils {
  /**
   * Format Wei to Ether with specified decimal places
   */
  static formatEther(value: string | number, decimals: number = 4): string {
    const formatted = ethers.formatEther(value.toString());
    return parseFloat(formatted).toFixed(decimals);
  }

  /**
   * Parse Ether to Wei
   */
  static parseEther(value: string): string {
    return ethers.parseEther(value).toString();
  }

  /**
   * Format units with custom decimals
   */
  static formatUnits(value: string | number, decimals: number = 18): string {
    return ethers.formatUnits(value.toString(), decimals);
  }

  /**
   * Parse units with custom decimals
   */
  static parseUnits(value: string, decimals: number = 18): string {
    return ethers.parseUnits(value, decimals).toString();
  }

  /**
   * Format address to display format (0x1234...5678)
   */
  static formatAddress(address: string, startLength: number = 6, endLength: number = 4): string {
    if (!address || address.length < startLength + endLength) {
      return address;
    }
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  }

  /**
   * Format transaction hash
   */
  static formatTxHash(hash: string): string {
    return this.formatAddress(hash, 8, 6);
  }

  /**
   * Format number with commas
   */
  static formatNumber(num: number | string, decimals: number = 2): string {
    const number = typeof num === 'string' ? parseFloat(num) : num;
    return number.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Format percentage
   */
  static formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Format time duration
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    } else {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      return `${days}d ${hours}h`;
    }
  }

  /**
   * Validate Ethereum address
   */
  static isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Validate private key
   */
  static isValidPrivateKey(privateKey: string): boolean {
    try {
      new ethers.Wallet(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert hex to number
   */
  static hexToNumber(hex: string): number {
    return parseInt(hex, 16);
  }

  /**
   * Convert number to hex
   */
  static numberToHex(num: number): string {
    return '0x' + num.toString(16);
  }

  /**
   * Generate random hex string
   */
  static generateRandomHex(length: number): string {
    const chars = '0123456789abcdef';
    let result = '0x';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}