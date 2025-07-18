/**
 * Logging utility for the Selendra SDK
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  error?: Error;
  module?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStoredLogs: number;
  customHandler?: (entry: LogEntry) => void;
}

class SDKLogger {
  private config: LoggerConfig;
  private storedLogs: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: false,
      maxStoredLogs: 1000,
      ...config
    };
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log an error message
   */
  error(message: string, context?: Record<string, any>, error?: Error, module?: string): void {
    this.log(LogLevel.ERROR, message, context, error, module);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>, module?: string): void {
    this.log(LogLevel.WARN, message, context, undefined, module);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>, module?: string): void {
    this.log(LogLevel.INFO, message, context, undefined, module);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>, module?: string): void {
    this.log(LogLevel.DEBUG, message, context, undefined, module);
  }

  /**
   * Log a trace message
   */
  trace(message: string, context?: Record<string, any>, module?: string): void {
    this.log(LogLevel.TRACE, message, context, undefined, module);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error,
    module?: string
  ): void {
    // Check if this log level should be processed
    if (level > this.config.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      error,
      module
    };

    // Store log if enabled
    if (this.config.enableStorage) {
      this.storeLog(entry);
    }

    // Console output if enabled
    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }

    // Custom handler if provided
    if (this.config.customHandler) {
      try {
        this.config.customHandler(entry);
      } catch (handlerError) {
        // Fallback to console if custom handler fails
        console.error('Logger custom handler failed:', handlerError);
      }
    }
  }

  /**
   * Store log entry in memory
   */
  private storeLog(entry: LogEntry): void {
    this.storedLogs.push(entry);
    
    // Trim logs if exceeded max
    if (this.storedLogs.length > this.config.maxStoredLogs) {
      this.storedLogs = this.storedLogs.slice(-this.config.maxStoredLogs);
    }
  }

  /**
   * Write log entry to console
   */
  private writeToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = new Date(entry.timestamp).toISOString();
    const modulePrefix = entry.module ? `[${entry.module}] ` : '';
    
    let logMethod: 'error' | 'warn' | 'info' | 'debug' | 'log' = 'log';
    
    switch (entry.level) {
      case LogLevel.ERROR:
        logMethod = 'error';
        break;
      case LogLevel.WARN:
        logMethod = 'warn';
        break;
      case LogLevel.INFO:
        logMethod = 'info';
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        logMethod = 'debug';
        break;
    }

    const baseMessage = `[${timestamp}] ${levelName}: ${modulePrefix}${entry.message}`;

    if (entry.context || entry.error) {
      console.group(baseMessage);
      
      if (entry.context) {
        console.log('Context:', entry.context);
      }
      
      if (entry.error) {
        console.error('Error:', entry.error);
      }
      
      console.groupEnd();
    } else {
      console[logMethod](baseMessage);
    }
  }

  /**
   * Get stored logs
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.storedLogs.filter(log => log.level <= level);
    }
    return [...this.storedLogs];
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    this.storedLogs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.storedLogs, null, 2);
  }

  /**
   * Create a child logger with a specific module context
   */
  createModuleLogger(module: string): ModuleLogger {
    return new ModuleLogger(this, module);
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

/**
 * Module-specific logger that automatically includes module context
 */
class ModuleLogger {
  constructor(private parent: SDKLogger, private module: string) {}

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.parent.error(message, context, error, this.module);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.parent.warn(message, context, this.module);
  }

  info(message: string, context?: Record<string, any>): void {
    this.parent.info(message, context, this.module);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.parent.debug(message, context, this.module);
  }

  trace(message: string, context?: Record<string, any>): void {
    this.parent.trace(message, context, this.module);
  }
}

// Create default logger instance
export const logger = new SDKLogger();

// Export types and logger
export { SDKLogger, ModuleLogger };

// Convenience function to create module loggers
export function createLogger(module: string): ModuleLogger {
  return logger.createModuleLogger(module);
}

// Development mode detection
export function enableDevMode(): void {
  logger.configure({
    level: LogLevel.DEBUG,
    enableConsole: true,
    enableStorage: true
  });
}

// Production mode setup
export function enableProdMode(): void {
  logger.configure({
    level: LogLevel.WARN,
    enableConsole: false,
    enableStorage: true
  });
}