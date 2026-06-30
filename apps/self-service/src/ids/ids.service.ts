import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import * as fs from 'node:fs';
import { IdsHttpClient } from '../shared/ids-http.client';

const { MobileCommonService } = require('../shared/mobile-common.service');

@Injectable()
export class MobileIdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idsHttp: IdsHttpClient,
    @Inject(MobileCommonService) private readonly common: any,
  ) {}

  private async idsLogin(): Promise<string> {
    try {
      return await this.idsHttp.login();
    } catch (error: any) {
      if (error?.message === 'IDS credentials are not configured') {
        return this.common.fail(500, 'IDS credentials are not configured');
      }
      return this.common.fail(502, 'IDS login failed');
    }
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

  private async runVerifyEncounter(payload: any) {
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

    const baseUrl = this.idsHttp.getBaseUrl();
    const verificationResponse = await this.idsHttp.requestJson(
      'POST',
      `${baseUrl}/verify-encounter?liveness=true`,
      verificationPayload,
      { Cookie: `JSESSIONID=${sessionId}` },
    );
    const bestCandidate = verificationResponse.data?.bestCandidate;
    if (verificationResponse.status !== 200 || !bestCandidate?.subjectId) {
      this.common.fail(400, 'Verification failed', {
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

  async verifyEncounter(payload: any) {
    try {
      return await this.runVerifyEncounter(payload);
    } catch (error: any) {
      if (error?.getError) throw error;
      if (error?.message === 'IDS request timed out') {
        this.common.fail(504, 'IDS request timed out');
      }
      throw error;
    }
  }
}
