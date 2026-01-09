/**
 * Frontend Logger Utility
 * Provides structured logging that respects environment settings
 * In production, logs are silenced or minimized
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

class FrontendLogger implements Logger {
  private isDevelopment: boolean;
  private logLevel: LogLevel;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    
    // Determine log level from environment
    const envLogLevel = import.meta.env.VITE_LOG_LEVEL?.toLowerCase();
    if (envLogLevel && ['debug', 'info', 'warn', 'error'].includes(envLogLevel)) {
      this.logLevel = envLogLevel as LogLevel;
    } else {
      this.logLevel = this.isDevelopment ? 'debug' : 'error';
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          // eslint-disable-next-line no-console
          console.debug(prefix, message, ...args);
        }
        break;
      case 'info':
        if (this.isDevelopment) {
          // eslint-disable-next-line no-console
          console.info(prefix, message, ...args);
        }
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        // eslint-disable-next-line no-console
        console.error(prefix, message, ...args);
        break;
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.formatMessage('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.formatMessage('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.formatMessage('error', message, ...args);
  }
}

// Export singleton instance
export const logger = new FrontendLogger();

// Export type for use in other files
export type { Logger };



