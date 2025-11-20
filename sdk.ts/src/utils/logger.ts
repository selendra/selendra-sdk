/**
 * Logger utility
 * 
 * @module utils/logger
 */

/**
 * Logger class for consistent logging across the SDK
 */
export class Logger {
  private context: string;
  private debugEnabled: boolean;

  constructor(context: string, debugEnabled = false) {
    this.context = context;
    this.debugEnabled = debugEnabled;
  }

  /**
   * Enable or disable debug logging
   */
  setDebug(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  /**
   * Log debug messages
   */
  debug(...args: any[]): void {
    if (this.debugEnabled) {
      console.log(`[${this.context}]`, ...args);
    }
  }

  /**
   * Log info messages
   */
  info(...args: any[]): void {
    console.log(`[${this.context}]`, ...args);
  }

  /**
   * Log warning messages
   */
  warn(...args: any[]): void {
    console.warn(`[${this.context}]`, ...args);
  }

  /**
   * Log error messages
   */
  error(...args: any[]): void {
    console.error(`[${this.context}]`, ...args);
  }
}
