/**
 * Production-safe logging utility
 * Logs to console in development, silent in production
 * Can be extended to send logs to external services
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isDevelopment = import.meta.env.DEV;

class Logger {
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!isDevelopment && level !== 'error') {
      return; // Only log errors in production
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message, data || '');
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      case 'debug':
        if (isDevelopment) {
          console.debug(prefix, message, data || '');
        }
        break;
      case 'info':
      default:
        console.log(prefix, message, data || '');
    }
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: unknown): void {
    this.log('error', message, error);
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }
}

export const logger = new Logger();
