import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 4
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: unknown;
}

/**
 * Production-ready logging service.
 *
 * In development: Logs to console with full details
 * In production: Only logs WARN and ERROR levels, can be extended to send to remote logging service
 *
 * Usage:
 *   private readonly logger = inject(LoggerService);
 *   this.logger.debug('Debug message', { data: 'value' });
 *   this.logger.info('Info message');
 *   this.logger.warn('Warning message');
 *   this.logger.error('Error message', error);
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly isProduction = environment.production;
  private readonly minLevel: LogLevel = this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;

  /**
   * Log a debug message (development only)
   */
  debug(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Log an info message (development only)
   */
  info(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: unknown, context?: string): void {
    this.log(LogLevel.ERROR, message, error, context);
  }

  private log(level: LogLevel, message: string, data?: unknown, context?: string): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data
    };

    // Console output
    this.logToConsole(entry);

    // In production, send critical errors to remote logging service
    if (this.isProduction && level >= LogLevel.ERROR) {
      this.sendToRemote(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = entry.context ? `[${entry.context}]` : '';
    const timestamp = entry.timestamp.toISOString();
    const formattedMessage = `${timestamp} ${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (entry.data !== undefined) {
          console.debug(formattedMessage, entry.data);
        } else {
          console.debug(formattedMessage);
        }
        break;
      case LogLevel.INFO:
        if (entry.data !== undefined) {
          console.info(formattedMessage, entry.data);
        } else {
          console.info(formattedMessage);
        }
        break;
      case LogLevel.WARN:
        if (entry.data !== undefined) {
          console.warn(formattedMessage, entry.data);
        } else {
          console.warn(formattedMessage);
        }
        break;
      case LogLevel.ERROR:
        if (entry.data !== undefined) {
          console.error(formattedMessage, entry.data);
        } else {
          console.error(formattedMessage);
        }
        break;
    }
  }

  /**
   * Send log entry to remote logging service (e.g., Sentry, LogRocket, custom backend)
   * Override this method to integrate with your preferred logging service
   */
  private sendToRemote(entry: LogEntry): void {
    // TODO: Implement remote logging integration
    // Example integrations:
    // - Sentry: Sentry.captureException(entry.data)
    // - Custom API: this.http.post('/api/logs', entry)
    // - LogRocket: LogRocket.captureException(entry.data)

    // For now, this is a placeholder that can be extended
    // when a remote logging service is configured
  }
}
