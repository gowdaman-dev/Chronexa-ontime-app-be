import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@app/prisma';
import { AppLoggerService } from '@app/common';
import * as fs from 'node:fs';
import { IdsHttpClient } from './shared/ids-http.client';

@Injectable()
export class SelfServiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idsHttp: IdsHttpClient,
    private readonly logger: AppLoggerService,
  ) {}

  private fail(
    statusCode: number,
    message: string,
    extra?: Record<string, any>,
  ): never {
    const meta = { statusCode, ...extra };
    if (statusCode >= 500) {
      this.logger.error('Self-service error', { message, ...meta });
    } else {
      this.logger.warn('Self-service request rejected', { message, ...meta });
    }
    throw new RpcException({ statusCode, message, ...extra });
  }

  private async runIdsAction<T>(action: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.getError) throw error;
      if (error?.message === 'IDS request timed out') {
        this.fail(504, 'IDS request timed out');
      }
      if (error?.message === 'IDS login failed') {
        this.fail(502, 'IDS login failed');
      }
      if (error?.message === 'IDS credentials are not configured') {
        this.fail(500, 'IDS credentials are not configured');
      }
      this.logger.error(`IDS action failed: ${action}`, error);
      this.fail(500, 'Internal server error');
    }
  }

  private async idsLogin(): Promise<string> {
    try {
      return await this.idsHttp.login();
    } catch (error: any) {
      if (error?.message === 'IDS credentials are not configured') {
        this.fail(500, 'IDS credentials are not configured');
      }
      this.fail(502, 'IDS login failed');
    }
  }

  private getFileBuffer(file: any): Buffer {
    if (!file) {
      this.fail(400, 'Image file is required');
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
    this.fail(400, 'Image file is required');
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
      this.fail(400, 'created_id is required and must be a valid number');
    }

    const employee = await this.prisma.employee_master.findUnique({
      where: { emp_no: payload.subjectEmpNo },
    });
    if (!employee) {
      this.fail(400, 'Employee not found for the identified subject');
    }

    const appVersion = Array.isArray(payload.appVersion)
      ? payload.appVersion[0]
      : payload.appVersion;
    const appType = this.getAppTypeFromUserAgent(payload.userAgent);
    const transactionTime = await this.getServerTime();
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

  private async runIdsVerification(
    payload: any,
    mode: 'identify' | 'verify-encounter',
  ) {
    const employeeId = Number(payload.employeeId);
    const body = payload.body ?? {};
    if (!employeeId || Number.isNaN(employeeId)) {
      this.fail(400, 'created_id is required and must be a valid number');
    }
    if (mode === 'verify-encounter' && !body.subjectId) {
      this.fail(400, 'subjectId is required');
    }
    if (!body.reason) {
      this.fail(400, 'reason is required');
    }
    if (!body.geolocation) {
      this.fail(400, 'geolocation is required');
    }

    const imageBase64 = this.getFileBuffer(payload.file).toString('base64');
    const sessionId = await this.idsLogin();
    this.logger.info('IDS verification started', {
      mode,
      employeeId,
      hasSession: Boolean(sessionId),
    });
    const notes = `${body.reason} , ${body.geolocation}`;
    const verificationPayload: Record<string, any> = {
      notes,
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
    if (mode === 'verify-encounter') {
      verificationPayload.subjectId = body.subjectId;
    }

    const baseUrl = this.idsHttp.getBaseUrl();
    const verificationResponse = await this.idsHttp.requestJson(
      'POST',
      `${baseUrl}/${mode}?liveness=true`,
      verificationPayload,
      { Cookie: `JSESSIONID=${sessionId}` },
    );
    const bestCandidate = verificationResponse.data?.bestCandidate;
    if (verificationResponse.status !== 200 || !bestCandidate?.subjectId) {
      this.fail(400, 'Verification failed', {
        data: verificationResponse.data,
      });
    }

    const subjectResponse = await this.idsHttp.requestJson(
      'GET',
      `${baseUrl}/subjects/${bestCandidate.subjectId}`,
      undefined,
      { Cookie: `JSESSIONID=${sessionId}` },
    );
    const subjectEmpNo = subjectResponse.data?.subjectId;
    if (!subjectEmpNo) {
      this.fail(400, 'Verification failed', { data: subjectResponse.data });
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

  private async getServerTime(): Promise<Date> {
    const rows = await this.prisma.$queryRaw<
      { time: Date }[]
    >`SELECT GETDATE() AS time;`;
    return rows?.[0]?.time ?? new Date();
  }

  async punch(payload: any) {
    return this.runIdsAction('punch', () =>
      this.runIdsVerification(payload, 'identify'),
    );
  }
}
