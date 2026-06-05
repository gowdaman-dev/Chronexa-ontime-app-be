import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@app/prisma';
import { ConfigService } from '@app/config';
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';

@Injectable()
export class SelfServiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private fail(statusCode: number, message: string, extra?: Record<string, any>): never {
    throw new RpcException({ statusCode, message, ...extra });
  }

  private getIdsBaseUrl(): string {
    return (
      this.config.get<string>('idsBaseUrl') ??
      this.config.get<string>('IDS_BASE_URL') ??
      'https://localhost:8443/api/v2.0'
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
      this.fail(500, 'IDS credentials are not configured');
    }

    const response = await this.requestJson(
      'POST',
      `${this.getIdsBaseUrl()}/authenticate`,
      { username, password },
    );
    const cookies = response.headers['set-cookie'];
    const cookieList = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
    const sessionCookie = cookieList.find((cookie) => cookie.startsWith('JSESSIONID='));
    const sessionId = sessionCookie?.split(';')[0]?.split('=')[1];
    if (response.status === 200 && sessionId) {
      return sessionId;
    }
    this.fail(502, 'IDS login failed');
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
    const raw = Array.isArray(userAgent) ? userAgent[0] : userAgent ?? '';
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
    const transaction = await (this.prisma.employee_event_transactions.create as any)({
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

  private async runIdsVerification(payload: any, mode: 'identify' | 'verify-encounter') {
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

    const verificationResponse = await this.requestJson(
      'POST',
      `${this.getIdsBaseUrl()}/${mode}?liveness=true`,
      verificationPayload,
      { Cookie: `JSESSIONID=${sessionId}` },
    );
    const bestCandidate = verificationResponse.data?.bestCandidate;
    if (verificationResponse.status !== 200 || !bestCandidate?.subjectId) {
      this.fail(400, 'Verification failed', { data: verificationResponse.data });
    }

    const subjectResponse = await this.requestJson(
      'GET',
      `${this.getIdsBaseUrl()}/subjects/${bestCandidate.subjectId}`,
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
    const rows = await this.prisma.$queryRaw<{ time: Date }[]>`SELECT GETDATE() AS time;`;
    return rows?.[0]?.time ?? new Date();
  }

  private assertEmployeeId(employeeId: number): void {
    if (!Number.isFinite(employeeId)) {
      this.fail(400, 'Invalid employee ID');
    }
  }

  private assertCoordinates(coordinates: number[]): asserts coordinates is [number, number] {
    if (
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      !coordinates.every((coordinate) => Number.isFinite(coordinate))
    ) {
      this.fail(400, 'Invalid coordinates format. Expected an array of [latitude, longitude].');
    }
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private distanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const earthRadiusMeters = 6371000;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  private isWithinAnyLocation(
    coordinates: [number, number],
    locations: Array<{ radius?: number | string | null; geolocation?: string | null }>,
  ): boolean {
    const [targetLat, targetLon] = coordinates;
    const processed = locations
      .map((location) => {
        if (!location.geolocation) return null;
        const [rawLat, rawLon] = location.geolocation.split(',');
        const latitude = Number.parseFloat(rawLat?.trim() ?? '');
        const longitude = Number.parseFloat(rawLon?.trim() ?? '');
        const radius = Number(location.radius ?? 0);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
        return { latitude, longitude, radius: Number.isFinite(radius) ? radius : 0 };
      })
      .filter(Boolean) as Array<{ latitude: number; longitude: number; radius: number }>;

    return processed.some((location) => {
      const distance = this.distanceInMeters(
        targetLat,
        targetLon,
        location.latitude,
        location.longitude,
      );
      return distance <= location.radius;
    });
  }

  private async getSparkEmployee(
    employeeId: number,
    options: {
      requireActive?: boolean;
      wrongGroupStatusCode?: number;
      includeErrorCodes?: boolean;
    } = {},
  ) {
    this.assertEmployeeId(employeeId);
    const employee = await this.prisma.employee_master.findUnique({
      where: { employee_id: employeeId },
      select: {
        active_flag: true,
        organization_id: true,
        employee_type_id: true,
        emp_no: true,
      },
    });

    if (!employee || (options.requireActive && !employee.active_flag)) {
      this.fail(404, 'Employee not found or inactive', {
        ...(options.includeErrorCodes
          ? {
              error: 'Employee not found or inactive',
              error_code: 'EMPLOYEE_NOT_FOUND_OR_INACTIVE',
            }
          : {}),
      });
    }
    if (!employee.emp_no) {
      this.fail(404, 'Employee not found', {
        ...(options.includeErrorCodes
          ? { error: 'Employee not found', error_code: 'EMPLOYEE_NOT_FOUND' }
          : {}),
      });
    }
    if (employee.organization_id !== 27 || employee.employee_type_id !== 26) {
      const message = 'Employee does not belong to the required organization or employee type';
      this.fail(options.wrongGroupStatusCode ?? 403, message, {
        ...(options.includeErrorCodes
          ? { error: message, error_code: 'EMPLOYEE_NOT_IN_REQUIRED_GROUP' }
          : {}),
      });
    }
    return employee;
  }

  async getLastTransactions(employeeId: number) {
    this.assertEmployeeId(employeeId);
    const currentDate = await this.getServerTime();
    const lastDaysAgo = new Date(currentDate);
    lastDaysAgo.setDate(lastDaysAgo.getDate() - 4);

    const transactions = await this.prisma.employee_event_transactions.findMany({
      where: {
        employee_id: employeeId,
        transaction_time: {
          gte: lastDaysAgo,
          lte: currentDate,
        },
      },
      orderBy: { transaction_id: 'desc' },
    });

    return {
      message: 'Last transactions fetched successfully',
      data: transactions,
    };
  }

  async getMyCheckInOut(employeeId: number) {
    this.assertEmployeeId(employeeId);
    const currentDate = await this.getServerTime();
    const year = currentDate.getUTCFullYear();
    const month = currentDate.getUTCMonth();
    const day = currentDate.getUTCDate();
    const todayStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    const yesterdayStart = new Date(Date.UTC(year, month, day - 1, 0, 0, 0, 0));
    const yesterdayEnd = new Date(Date.UTC(year, month, day - 1, 23, 59, 59, 999));

    const [todayTransactions, yesterdayLastCheckIn] = await Promise.all([
      this.prisma.employee_event_transactions.findMany({
        where: {
          employee_id: employeeId,
          transaction_time: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        orderBy: { transaction_time: 'asc' },
      }),
      this.prisma.employee_event_transactions.findFirst({
        where: {
          employee_id: employeeId,
          reason: 'IN',
          transaction_time: {
            gte: yesterdayStart,
            lte: yesterdayEnd,
          },
        },
        orderBy: { transaction_time: 'desc' },
      }),
    ]);

    let checkIn: Date | null = null;
    let checkOut: Date | null = null;
    const todayCheckIns = todayTransactions.filter((transaction) => transaction.reason === 'IN');
    const todayCheckOuts = todayTransactions.filter((transaction) => transaction.reason === 'OUT');

    if (todayCheckIns.length > 0) {
      checkIn = todayCheckIns[0].transaction_time;
      const validCheckOuts = todayCheckOuts.filter(
        (transaction) => transaction.transaction_time.getTime() > checkIn!.getTime(),
      );
      checkOut = validCheckOuts.length
        ? validCheckOuts[validCheckOuts.length - 1].transaction_time
        : null;
    } else if (todayCheckOuts.length > 0 && yesterdayLastCheckIn) {
      const lastCheckOut = todayCheckOuts[todayCheckOuts.length - 1];
      const diffHours =
        (lastCheckOut.transaction_time.getTime() -
          yesterdayLastCheckIn.transaction_time.getTime()) /
        (1000 * 60 * 60);
      if (diffHours > 0 && diffHours <= 16) {
        checkIn = yesterdayLastCheckIn.transaction_time;
        checkOut = lastCheckOut.transaction_time;
      }
    }

    return {
      message: "Today's check-in/check-out fetched successfully",
      data: { checkIn, checkOut },
    };
  }

  async getMyWorkLocation(employeeId: number) {
    const employee = await this.getSparkEmployee(employeeId, {
      requireActive: true,
      wrongGroupStatusCode: 400,
      includeErrorCodes: true,
    });
    const serverTime = await this.getServerTime();
    const workLocation = await this.prisma.local_SparkEmployeeLocationdetailsLocal.findFirst({
      where: {
        EmployeeNumber: employee.emp_no,
        AND: [
          {
            OR: [{ FromDate: { lte: serverTime } }, { FromDate: null }],
          },
          {
            OR: [{ ToDate: { gte: serverTime } }, { ToDate: null }],
          },
        ],
      },
      select: {
        EmployeeNumber: true,
        NameEng: true,
        LocationCode: true,
        LocationEng: true,
        City: true,
        Geolocation: true,
      },
    });

    if (!workLocation) {
      this.fail(404, 'No work schedule assigned for today.');
    }
    if (!workLocation.Geolocation) {
      this.fail(
        404,
        'Geolocation Coordinates not available for the assigned work location, Please contact your Manager.',
      );
    }

    return {
      success: true,
      message: 'Work location details fetched successfully',
      data: workLocation,
    };
  }

  async verifyLocation(coordinates: number[]) {
    this.assertCoordinates(coordinates);
    const locations = await this.prisma.locations.findMany({
      select: { radius: true, geolocation: true },
    });
    if (!this.isWithinAnyLocation(coordinates, locations)) {
      this.fail(403, 'You are not within the allowed work location.');
    }
    return {
      success: true,
      message: 'Location verified successfully. You are within the allowed work location.',
    };
  }

  async verifyAssignedLocation(employeeId: number, coordinates: number[]) {
    this.assertCoordinates(coordinates);
    const employee = await this.getSparkEmployee(employeeId);
    const serverTime = await this.getServerTime();
    const assignedLocations =
      await this.prisma.local_SparkEmployeeLocationdetailsLocal.findMany({
        where: {
          EmployeeNumber: employee.emp_no,
          AND: [
            {
              OR: [{ FromDate: { lte: serverTime } }, { FromDate: null }],
            },
            {
              OR: [{ ToDate: { gte: serverTime } }, { ToDate: null }],
            },
          ],
        },
        select: { Radius: true, Geolocation: true },
      });
    const locationInput = assignedLocations.map((location) => ({
      radius: Number(location.Radius ?? 0) + 500000000,
      geolocation: location.Geolocation,
    }));
    if (!this.isWithinAnyLocation(coordinates, locationInput)) {
      this.fail(403, 'You are not within the allowed work location.');
    }
    return {
      success: true,
      message: 'Location verified successfully. You are within the allowed work location.',
    };
  }

  async getSparkTodayLocation(employeeId: number) {
    const employee = await this.getSparkEmployee(employeeId);
    const now = new Date();
    const todayLocation =
      await this.prisma.local_SparkEmployeeLocationdetailsLocal.findFirst({
        where: {
          EmployeeNumber: employee.emp_no,
          AND: [
            {
              OR: [{ FromDate: null }, { FromDate: { lte: now } }],
            },
            {
              OR: [{ ToDate: null }, { ToDate: { gte: now } }],
            },
          ],
        },
        select: {
          EmployeeNumber: true,
          Radius: true,
          Geolocation: true,
        },
        orderBy: { FromDate: 'desc' },
      });

    if (!todayLocation) {
      this.fail(404, 'No location data found for today');
    }

    return {
      message: 'Current location data for employee',
      data: {
        ...todayLocation,
        Radius: '5000000',
      },
    };
  }

  async punch(payload: any) {
    return this.runIdsVerification(payload, 'identify');
  }

  async verifyEncounter(payload: any) {
    return this.runIdsVerification(payload, 'verify-encounter');
  }
}
