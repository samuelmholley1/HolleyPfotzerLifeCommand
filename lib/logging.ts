// lib/logging.ts

/**
 * COMPREHENSIVE LOGGING SYSTEM
 * Provides structured logging with different levels and contexts
 * Includes security audit logging and error tracking
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SECURITY = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private sessionId: string;
  private userId?: string;
  private logBuffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 1000;

  private constructor() {
    this.sessionId = this.generateSessionId();
    
    // Listen for errors globally
    window.addEventListener('error', (event) => {
      this.error('Global Error', event.error?.message || 'Unknown error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', event.reason?.message || 'Unknown rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context,
      userId: this.userId,
      sessionId: this.sessionId,
      error
    };
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift(); // Remove oldest entry
    }

    // Console output with appropriate level
    const logMethod = this.getConsoleMethod(entry.level);
    const formattedMessage = this.formatMessage(entry);
    
    if (entry.error) {
      logMethod(formattedMessage, entry.error);
    } else {
      logMethod(formattedMessage);
    }

    // Send critical logs to server (if configured)
    if (entry.level >= LogLevel.ERROR) {
      this.sendToServer(entry).catch(console.error);
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.SECURITY:
        return console.error;
      default:
        return console.log;
    }
  }

  private formatMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    return `[${entry.timestamp}] ${levelName} [${entry.category}] ${entry.message}${contextStr}`;
  }

  private async sendToServer(entry: LogEntry): Promise<void> {
    try {
      // Only send in production and if endpoint is configured
      if (process.env.NODE_ENV !== 'production' || !process.env.REACT_APP_LOG_ENDPOINT) {
        return;
      }

      const sanitizedEntry = {
        ...entry,
        error: entry.error ? {
          message: entry.error.message,
          stack: entry.error.stack,
          name: entry.error.name
        } : undefined
      };

      await fetch(process.env.REACT_APP_LOG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedEntry)
      });
    } catch (error) {
      console.error('Failed to send log to server:', error);
    }
  }

  // Public logging methods
  debug(category: string, message: string, context?: Record<string, any>): void {
    this.log(this.createLogEntry(LogLevel.DEBUG, category, message, context));
  }

  info(category: string, message: string, context?: Record<string, any>): void {
    this.log(this.createLogEntry(LogLevel.INFO, category, message, context));
  }

  warn(category: string, message: string, context?: Record<string, any>): void {
    this.log(this.createLogEntry(LogLevel.WARN, category, message, context));
  }

  error(category: string, message: string, context?: Record<string, any>, error?: Error): void {
    this.log(this.createLogEntry(LogLevel.ERROR, category, message, context, error));
  }

  security(category: string, message: string, context?: Record<string, any>): void {
    this.log(this.createLogEntry(LogLevel.SECURITY, category, message, {
      ...context,
      securityEvent: true,
      timestamp: Date.now()
    }));
  }

  // Security-specific logging methods
  authSuccess(userId: string, method: string): void {
    this.security('AUTH', 'Authentication successful', {
      userId,
      method,
      userAgent: navigator.userAgent
    });
  }

  authFailure(reason: string, attempted_userId?: string): void {
    this.security('AUTH', 'Authentication failed', {
      reason,
      attempted_userId,
      userAgent: navigator.userAgent,
      ip: 'client-side' // Would need server-side logging for real IP
    });
  }

  dataAccess(action: string, resource: string, resourceId?: string): void {
    this.security('DATA', `Data ${action}`, {
      action,
      resource,
      resourceId,
      userId: this.userId
    });
  }

  cryptoOperation(operation: string, success: boolean, error?: string): void {
    this.security('CRYPTO', `Crypto ${operation}`, {
      operation,
      success,
      error,
      userId: this.userId
    });
  }

  syncOperation(operation: string, recordCount?: number, error?: string): void {
    this.info('SYNC', `Sync ${operation}`, {
      operation,
      recordCount,
      error,
      userId: this.userId
    });
  }

  // Utility methods
  getLogs(level?: LogLevel): LogEntry[] {
    if (level === undefined) {
      return [...this.logBuffer];
    }
    return this.logBuffer.filter(entry => entry.level >= level);
  }

  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  clearLogs(): void {
    this.logBuffer = [];
    this.info('LOGGING', 'Log buffer cleared');
  }

  // Performance tracking
  startTimer(operation: string): () => void {
    const startTime = performance.now();
    this.debug('PERF', `Started: ${operation}`);
    
    return () => {
      const duration = performance.now() - startTime;
      this.info('PERF', `Completed: ${operation}`, { 
        duration: `${duration.toFixed(2)}ms` 
      });
    };
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const log = {
  debug: (category: string, message: string, context?: Record<string, any>) => 
    logger.debug(category, message, context),
  info: (category: string, message: string, context?: Record<string, any>) => 
    logger.info(category, message, context),
  warn: (category: string, message: string, context?: Record<string, any>) => 
    logger.warn(category, message, context),
  error: (category: string, message: string, context?: Record<string, any>, error?: Error) => 
    logger.error(category, message, context, error),
  security: (category: string, message: string, context?: Record<string, any>) => 
    logger.security(category, message, context),
};

// React Hook for component logging
export function useLogger(componentName: string) {
  return {
    debug: (message: string, context?: Record<string, any>) => 
      logger.debug(componentName, message, context),
    info: (message: string, context?: Record<string, any>) => 
      logger.info(componentName, message, context),
    warn: (message: string, context?: Record<string, any>) => 
      logger.warn(componentName, message, context),
    error: (message: string, context?: Record<string, any>, error?: Error) => 
      logger.error(componentName, message, context, error),
    timer: (operation: string) => logger.startTimer(`${componentName}:${operation}`)
  };
}
