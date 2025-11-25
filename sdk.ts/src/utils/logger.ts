/**
 * Logger utility
 * 
 * @module utils/logger
 */

// Suppress Node.js warnings IMMEDIATELY before anything else
if (typeof process !== 'undefined') {
  process.removeAllListeners('warning');
  process.on('warning', () => {});
  // Also suppress specific warning types via env
  process.env.NODE_NO_WARNINGS = '1';
}

export interface LoggerConfig {
  /** Enable/disable all logs */
  enabled: boolean;
  /** Enable/disable debug logs */
  debug: boolean;
  /** Enable/disable info logs */
  info: boolean;
  /** Enable/disable warning logs */
  warn: boolean;
  /** Enable/disable error logs */
  error: boolean;
  /** Suppress Node.js process warnings */
  suppressNodeWarnings: boolean;
}

const defaultConfig: LoggerConfig = {
  enabled: true,
  debug: false,
  info: true,
  warn: false, // Warnings disabled by default
  error: true,
  suppressNodeWarnings: true, // Suppress Node.js warnings by default
};

let currentConfig: LoggerConfig = { ...defaultConfig };

/**
 * Configure SDK logger globally
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  
  // Apply Node.js warning suppression
  if (currentConfig.suppressNodeWarnings && typeof process !== 'undefined') {
    suppressNodeWarnings();
  }
}

/**
 * Suppress Node.js process warnings
 */
export function suppressNodeWarnings(): void {
  if (typeof process === 'undefined') return;
  
  // Remove existing warning listeners
  process.removeAllListeners('warning');
  
  // Add no-op warning handler
  process.on('warning', () => {});
}

/**
 * Get current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...currentConfig };
}

/**
 * Reset logger to default configuration
 */
export function resetLogger(): void {
  currentConfig = { ...defaultConfig };
}

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
    if (currentConfig.enabled && (this.debugEnabled || currentConfig.debug)) {
      console.log(`[${this.context}] DEBUG:`, ...args);
    }
  }

  /**
   * Log info messages
   */
  info(...args: any[]): void {
    if (currentConfig.enabled && currentConfig.info) {
      console.log(`[${this.context}]`, ...args);
    }
  }

  /**
   * Log warning messages
   */
  warn(...args: any[]): void {
    if (currentConfig.enabled && currentConfig.warn) {
      console.warn(`[${this.context}]`, ...args);
    }
  }

  /**
   * Log error messages
   */
  error(...args: any[]): void {
    if (currentConfig.enabled && currentConfig.error) {
      console.error(`[${this.context}]`, ...args);
    }
  }
}

// Auto-suppress warnings on module load
if (typeof process !== 'undefined' && currentConfig.suppressNodeWarnings) {
  suppressNodeWarnings();
}
