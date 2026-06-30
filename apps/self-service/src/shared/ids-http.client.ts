import { Injectable } from '@nestjs/common';
import { ConfigService } from '@app/config';
import { AppLoggerService } from '@app/common';
import * as http from 'node:http';
import * as https from 'node:https';

@Injectable()
export class IdsHttpClient {
  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  private getTimeoutMs() {
    return this.config.get<number>('idsTimeoutMs') ?? 20_000;
  }

  getBaseUrl(): string {
    return (
      this.config.get<string>('idsBaseUrl') ??
      this.config.get<string>('IDS_BASE_URL') ??
      '/api/v2.0'
    ).replace(/\/$/, '');
  }

  getCredentials() {
    return {
      username:
        this.config.get<string>('idsUsername') ??
        this.config.get<string>('IDS_USERNAME') ??
        '',
      password:
        this.config.get<string>('idsPassword') ??
        this.config.get<string>('IDS_PASSWORD') ??
        '',
    };
  }

  async requestJson(
    method: 'GET' | 'POST',
    url: string,
    body?: any,
    headers: Record<string, string> = {},
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; data: any }> {
    const parsedUrl = new URL(url);
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const client = parsedUrl.protocol === 'http:' ? http : https;
    const agent =
      parsedUrl.protocol === 'https:'
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined;
    const timeoutMs = this.getTimeoutMs();

    return new Promise((resolve, reject) => {
      const request = client.request(
        parsedUrl,
        {
          method,
          agent,
          timeout: timeoutMs,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'PostmanRuntime/7.44.0',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
            ...(payload
              ? {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(payload).toString(),
                }
              : {}),
            ...headers,
          },
        },
        (response) => {
          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          response.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            let data: any = text;
            if (text) {
              try {
                data = JSON.parse(text);
              } catch {
                data = text;
              }
            }
            resolve({
              status: response.statusCode ?? 0,
              headers: response.headers,
              data,
            });
          });
        },
      );
      request.on('timeout', () => {
        request.destroy(new Error('IDS request timed out'));
      });
      request.on('error', reject);
      if (payload) {
        request.write(payload);
      }
      request.end();
    });
  }

  async login(): Promise<string> {
    const { username, password } = this.getCredentials();
    if (!username || !password) {
      throw new Error('IDS credentials are not configured');
    }

    const response = await this.requestJson(
      'POST',
      `${this.getBaseUrl()}/authenticate`,
      { username, password },
    );
    const cookies = response.headers['set-cookie'];
    const cookieList = Array.isArray(cookies)
      ? cookies
      : cookies
        ? [cookies]
        : [];
    const sessionCookie = cookieList.find((cookie) =>
      cookie.startsWith('JSESSIONID='),
    );
    const sessionId = sessionCookie?.split(';')[0]?.split('=')[1];
    this.logger.debug('IDS login completed', {
      status: response.status,
      hasSession: Boolean(sessionId),
    });
    if (response.status === 200 && sessionId) {
      return sessionId;
    }
    throw new Error('IDS login failed');
  }
}
