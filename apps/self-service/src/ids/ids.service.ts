import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ConfigService } from '@app/config';
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';

const { MobileCommonService } = require('../shared/mobile-common.service');

@Injectable()
export class MobileIdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(MobileCommonService) private readonly common: any,
  ) {}

  private getIdsBaseUrl(): string {
    return (
      this.config.get<string>('idsBaseUrl') ??
      this.config.get<string>('IDS_BASE_URL') ??
      '/api/v2.0'
    ).replace(/\/$/, '');
  }

  private getIdsCredentials() {
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

  private async requestJson(
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

    return new Promise((resolve, reject) => {
      const request = client.request(
        parsedUrl,
        {
          method,
          agent,
          timeout: 20000,
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

  private async idsLogin(): Promise<string> {
    const { username, password } = this.getIdsCredentials();
    if (!username || !password) {
      return this.common.fail(500, 'IDS credentials are not configured');
    }

    const response = await this.requestJson(
      'POST',
      `${this.getIdsBaseUrl()}/authenticate`,
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
    if (response.status === 200 && sessionId) {
      return sessionId;
    }
    return this.common.fail(502, 'IDS login failed');
  }

  private getFileBuffer(file: any): Buffer {
    if (!file) {
      return this.common.fail(400, 'Image file is required');
    }
    if (typeof file.bufferBase64 === 'string') {
      return Buffer.from(file.bufferBase64, 'base64');
    }
    if (Buffer.isBuffer(file.buffer)) {
      return file.buffer;
    }
    if (typeof file.buffer === 'string') {
      return Buffer.from(file.buffer, 'base64');
    }
    if (Array.isArray(file.buffer?.data)) {
      return Buffer.from(file.buffer.data);
    }
    if (file.path && fs.existsSync(file.path)) {
      return fs.readFileSync(file.path);
    }
    return this.common.fail(400, 'Image file is required');
  }

  private getAppTypeFromUserAgent(userAgent?: string | string[]): string {
    const raw = Array.isArray(userAgent) ? userAgent[0] : (userAgent ?? '');
    return raw.split('dart/')[1] || 'fieldtrack';
  }

  private async createIdsTransaction(payload: {
    employeeId: number;
    subjectEmpNo: string;
    reason: string;
    geolocation: string;
    deviceId?: string | number | null;
    appVersion?: string | string[];
    userAgent?: string | string[];
  }) {
    const createdId = Number(payload.employeeId);
    if (!createdId || Number.isNaN(createdId)) {
      this.common.fail(400, 'created_id is required and must be a valid number');
    }

    const employee = await this.prisma.employee_master.findUnique({
      where: { emp_no: payload.subjectEmpNo },
    });
    if (!employee) {
      return this.common.fail(
        400,
        'Employee not found for the identified subject',
      );
    }

    const appVersion = Array.isArray(payload.appVersion)
      ? payload.appVersion[0]
      : payload.appVersion;
    const appType = this.getAppTypeFromUserAgent(payload.userAgent);
    const transactionTime = await this.common.getServerTime();
    const transaction = await (
      this.prisma.employee_event_transactions.create as any
    )({
      data: {
        reason: payload.reason,
        created_id: createdId,
        last_updated_id: createdId,
        transaction_time: transactionTime,
        device_id:
          payload.deviceId === undefined || payload.deviceId === null
            ? null
            : Number(payload.deviceId),
        employee_master: {
          connect: {
            employee_id: employee.employee_id,
          },
        },
        geolocation: payload.geolocation,
        remarks: `Punch via IDS integration - ${appType} : ${appVersion || 'unknown version'}`,
        app_version_no: appVersion || null,
      },
    });

    return {
      success: true,
      message: 'Verification successful',
      subject: {
        ...transaction,
        name_eng: employee.firstname_eng,
        name_arb: employee.firstname_arb,
      },
    };
  }

  async verifyEncounter(payload: any) {
    const employeeId = Number(payload.employeeId);
    const body = payload.body ?? {};
    if (!employeeId || Number.isNaN(employeeId)) {
      this.common.fail(400, 'created_id is required and must be a valid number');
    }
    if (!body.subjectId) {
      this.common.fail(400, 'subjectId is required');
    }
    if (!body.reason) {
      this.common.fail(400, 'reason is required');
    }
    if (!body.geolocation) {
      this.common.fail(400, 'geolocation is required');
    }

    const imageBase64 = this.getFileBuffer(payload.file).toString('base64');
    const sessionId = await this.idsLogin();
    const verificationPayload = {
      notes: `${body.reason} , ${body.geolocation}`,
      subjectId: body.subjectId,
      samples: [
        {
          contentType: 'image/jpeg',
          modality: 'Face',
          submodality: 'FrontalFace',
          facePosition: 'Front',
          sampleType: 'Probe',
          data: imageBase64,
        },
      ],
    };

    const verificationResponse = await this.requestJson(
      'POST',
      `${this.getIdsBaseUrl()}/verify-encounter?liveness=true`,
      verificationPayload,
      { Cookie: `JSESSIONID=${sessionId}` },
    );
    const bestCandidate = verificationResponse.data?.bestCandidate;
    if (verificationResponse.status !== 200 || !bestCandidate?.subjectId) {
      this.common.fail(400, 'Verification failed', {
        data: verificationResponse.data,
      });
    }

    const subjectResponse = await this.requestJson(
      'GET',
      `${this.getIdsBaseUrl()}/subjects/${bestCandidate.subjectId}`,
      undefined,
      { Cookie: `JSESSIONID=${sessionId}` },
    );
    const subjectEmpNo = subjectResponse.data?.subjectId;
    if (!subjectEmpNo) {
      this.common.fail(400, 'Verification failed', { data: subjectResponse.data });
    }

    return this.createIdsTransaction({
      employeeId,
      subjectEmpNo,
      reason: body.reason,
      geolocation: body.geolocation,
      deviceId: body.device_id,
      appVersion: payload.appVersion,
      userAgent: payload.userAgent,
    });
  }
}
