/**
 * Logger utility for centralized and structured logging across the application
 * Supports different log levels, contexts, and environment-aware behavior
 */

// Log levels enum
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Configuration interface
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enablePersistence: boolean;
  maxStoredLogs: number;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  enableConsole: true,
  enablePersistence: true,
  maxStoredLogs: 1000,
};

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private persistenceKey = 'app_logs';

  private constructor(config: LoggerConfig = defaultConfig) {
    this.config = { ...defaultConfig, ...config };
    if (this.config.enablePersistence) {
      this.loadLogs();
    }
  }

  /**
   * Get the singleton logger instance
   */
  public static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * Log at DEBUG level
   */
  public debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log at INFO level
   */
  public info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log at WARN level
   */
  public warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log at ERROR level
   */
  public error(message: string, error?: any, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
    if (this.config.enablePersistence) {
      localStorage.removeItem(this.persistenceKey);
    }
  }

  /**
   * Get all logged entries
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs filtered by context
   */
  public getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter(log => log.context === context);
  }

  /**
   * Export logs as JSON string
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs);
  }

  /**
   * Send logs to server (to be implemented)
   */
  public sendLogsToServer(endpoint: string = '/api/logs'): Promise<boolean> {
    // Implementation could use the api service to post logs to backend
    return new Promise((resolve, reject) => {
      try {
        // Add implementation here
        // This is a placeholder
        console.log(`Sending ${this.logs.length} logs to server at ${endpoint}`);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, context?: string, data?: any, error?: Error): void {
    // Skip logging if below minimum level
    if (this.getSeverity(level) < this.getSeverity(this.config.minLevel)) {
      return;
    }

    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error,
    };

    // Add to internal logs array with limit
    this.logs.push(entry);
    if (this.logs.length > this.config.maxStoredLogs) {
      this.logs.shift();
    }

    // Console output if enabled
    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }

    // Persist logs if enabled
    if (this.config.enablePersistence) {
      this.saveLogs();
    }
  }

  /**
   * Write log entry to console
   */
  private writeToConsole(entry: LogEntry): void {
    const formattedMessage = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ''}: ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, entry.data || '', entry.error || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, entry.data || '', entry.error || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.data || '', entry.error || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, entry.data || '', entry.error || '');
        break;
    }
  }

  /**
   * Save logs to localStorage
   */
  private saveLogs(): void {
    try {
      localStorage.setItem(this.persistenceKey, JSON.stringify(this.logs));
    } catch (e) {
      console.error('Failed to save logs to localStorage:', e);
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadLogs(): void {
    try {
      const savedLogs = localStorage.getItem(this.persistenceKey);
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (e) {
      console.error('Failed to load logs from localStorage:', e);
    }
  }

  /**
   * Get numeric severity value for log level
   */
  private getSeverity(level: LogLevel): number {
    switch (level) {
      case LogLevel.DEBUG: return 0;
      case LogLevel.INFO: return 1;
      case LogLevel.WARN: return 2;
      case LogLevel.ERROR: return 3;
      default: return 0;
    }
  }
}

// Create a default export of the singleton instance
export default Logger.getInstance();

// Named export for direct use
export { Logger }; 