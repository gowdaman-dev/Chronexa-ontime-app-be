import { Injectable, LoggerService } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as util from 'node:util';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'log';

type AppLoggerOptions = {
  logDir?: string;
  serviceName?: string;
  writeToConsole?: boolean;
};

const SENSITIVE_KEY_PATTERN =
  /(password|passwd|pwd|secret|token|authorization|cookie|client_secret|database_url|databaseUrl|connectionString|accessToken|refreshToken|adToken|idsPassword|REDIS_URL|DATABASE_URL)/i;

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logDir: string;
  private readonly serviceName: string;
  private readonly writeToConsole: boolean;

  constructor(options: AppLoggerOptions = {}) {
    this.logDir =
      options.logDir ?? process.env.LOG_DIR ?? path.join(process.cwd(), 'logs');
    this.serviceName =
      options.serviceName ??
      process.env.SERVICE_NAME ??
      process.env.npm_package_name ??
      'chronexa-backend';
    this.writeToConsole = options.writeToConsole ?? process.env.LOG_TO_CONSOLE !== 'false';
  }

  log(message: any, context?: string) {
    this.write('log', message, { context });
  }

  info(message: string, meta?: Record<string, any>) {
    this.write('info', message, meta);
  }

  warn(message: any, meta?: Record<string, any>) {
    this.write('warn', message, meta);
  }

  debug(message: any, meta?: Record<string, any>) {
    this.write('debug', message, meta);
  }

  error(message: any, errorOrTrace?: any, meta?: Record<string, any>) {
    const serializedError =
      errorOrTrace instanceof Error
        ? this.serializeError(errorOrTrace)
        : typeof errorOrTrace === 'string'
          ? { stack: errorOrTrace }
          : errorOrTrace
            ? this.redact(errorOrTrace)
            : undefined;

    this.write('error', message, {
      ...meta,
      ...(serializedError ? { error: serializedError } : {}),
    });
  }

  redact<T>(value: T): T {
    return this.redactValue(value) as T;
  }

  private write(level: LogLevel, message: any, meta?: Record<string, any>) {
    const redactedMeta = this.redact(meta ?? {});
    const { error, ...safeMeta } = redactedMeta as Record<string, any>;
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message: this.formatMessage(message),
      ...(error ? { error } : {}),
      meta: safeMeta,
    };

    this.append(entry);

    if (this.writeToConsole) {
      const consoleMessage = JSON.stringify(entry);
      if (level === 'error') {
        console.error(consoleMessage);
      } else if (level === 'warn') {
        console.warn(consoleMessage);
      } else {
        console.log(consoleMessage);
      }
    }
  }

  private append(entry: Record<string, any>) {
    try {
      fs.mkdirSync(this.logDir, { recursive: true });
      fs.appendFileSync(
        path.join(this.logDir, `${this.serviceName}.log`),
        `${JSON.stringify(entry)}\n`,
        'utf8',
      );
    } catch (error) {
      console.error('Failed to write application log:', error);
    }
  }

  private formatMessage(message: any): string {
    return typeof message === 'string' ? message : util.inspect(this.redact(message));
  }

  private serializeError(error: Error) {
    return this.redact({
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }

  private redactValue(value: any, depth = 0): any {
    if (depth > 10) return '[MAX_DEPTH]';
    if (value === null || value === undefined) return value;
    if (value instanceof Date) return value.toISOString();
    if (Buffer.isBuffer(value)) return `[Buffer:${value.length}]`;
    if (value instanceof Error) return this.serializeError(value);
    if (Array.isArray(value)) {
      return value.map((item) => this.redactValue(item, depth + 1));
    }
    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          SENSITIVE_KEY_PATTERN.test(key)
            ? '[REDACTED]'
            : this.redactValue(item, depth + 1),
        ]),
      );
    }
    return value;
  }
}
