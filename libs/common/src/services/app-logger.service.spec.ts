const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { AppLoggerService } = require('./app-logger.service');

describe('AppLoggerService', () => {
  let logDir: string;
  let logger: any;

  beforeEach(() => {
    logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chronexa-logs-'));
    logger = new AppLoggerService({
      logDir,
      serviceName: 'test-service',
      writeToConsole: false,
    });
  });

  it('redacts sensitive fields recursively before writing logs', () => {
    logger.info('login attempt', {
      login: 'employee',
      password: 'secret-password',
      nested: {
        accessToken: 'jwt-token',
        authorization: 'Bearer token',
      },
    });

    const log = fs.readFileSync(path.join(logDir, 'test-service.log'), 'utf8');

    expect(log).toContain('login attempt');
    expect(log).toContain('[REDACTED]');
    expect(log).not.toContain('secret-password');
    expect(log).not.toContain('jwt-token');
    expect(log).not.toContain('Bearer token');
  });

  it('serializes errors without leaking secrets from metadata', () => {
    logger.error('backend failure', new Error('boom'), {
      client_secret: 'secret-client-value',
      databaseUrl: 'sqlserver://user:pass@host/db',
    });

    const [entry] = fs
      .readFileSync(path.join(logDir, 'test-service.log'), 'utf8')
      .trim()
      .split('\n')
      .map((line: string) => JSON.parse(line));

    expect(entry.level).toBe('error');
    expect(entry.error.message).toBe('boom');
    expect(entry.meta.client_secret).toBe('[REDACTED]');
    expect(entry.meta.databaseUrl).toBe('[REDACTED]');
  });
});
