import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@app/prisma';
import { ConfigService } from '@app/config';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '@app/redis';
import { AppLoggerService } from '@app/common';
import { isMobileClient, isPostmanClient } from '@app/auth';
import axios from 'axios';
import * as crypto from 'crypto';
import { AppValidatorService } from './app-validator.service';

@Injectable()
export class AuthServiceService {
  private readonly pepper: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly cache: CacheService,
    private readonly logger: AppLoggerService,
    private readonly appValidator: AppValidatorService,
  ) {
    this.pepper = this.config.get<string>('accessTokenSecret') ?? 'default-pepper';
  }

  private sessionStorageKey(
    token: string,
    payload?: Record<string, any>,
  ): string {
    const decoded =
      payload ?? (this.jwtService.decode(token) as Record<string, any> | null);
    if (decoded?.jti) return `jti:${decoded.jti}`;
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async getSessionCache(token: string) {
    const compactKey = CACHE_KEYS.AUTH_SESSION(this.sessionStorageKey(token));
    const legacyKey = CACHE_KEYS.AUTH_SESSION(token);
    return (await this.cache.get(compactKey)) ?? (await this.cache.get(legacyKey));
  }

  private async setSessionCache(token: string, verified: Record<string, any>) {
    const key = CACHE_KEYS.AUTH_SESSION(
      this.sessionStorageKey(token, verified),
    );
    await this.cache.set(key, verified, CACHE_TTL.AUTH_SESSION);
  }

  private async deleteSessionCache(token: string) {
    const decoded = this.jwtService.decode(token) as Record<string, any> | null;
    await this.cache.del(
      CACHE_KEYS.AUTH_SESSION(this.sessionStorageKey(token, decoded ?? undefined)),
    );
    await this.cache.del(CACHE_KEYS.AUTH_SESSION(token));
  }

  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt + this.pepper, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    if (!stored.includes(':')) {
      const a = Buffer.from(password);
      const b = Buffer.from(stored);
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    }
    const [salt, hash] = stored.split(':');
    const computed = crypto
      .pbkdf2Sync(password, salt + this.pepper, 10000, 64, 'sha512')
      .toString('hex');
    const a = Buffer.from(computed);
    const b = Buffer.from(hash);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  private getRole(managerFlag: boolean | null): string {
    return managerFlag === true ? 'Manager' : 'Employee';
  }

  private getEmployeeType(employeeTypeId: number | null): string {
    return employeeTypeId === 26 ? 'Technical' : 'Professional';
  }

  private async getOrganizationByEmployeeId(employeeId: number) {
    try {
      const result: any = await this.prisma.$queryRaw`
        SELECT o.organization_id, o.organization_eng AS organization_name
        FROM employee_master em
        LEFT JOIN organizations o ON em.organization_id = o.organization_id
        WHERE em.employee_id = ${employeeId}
      `;
      if (result && result.length > 0) {
        return {
          organizationId: result[0].organization_id,
          organizationName: result[0].organization_name,
        };
      }
    } catch (err) {
      this.logger.error('Get organization error', err, { employeeId });
    }
    return null;
  }

  private async getLastTransaction(employeeId: number) {
    const txn = await this.prisma.employee_event_transactions.findFirst({
      where: { employee_id: employeeId },
      orderBy: { transaction_time: 'desc' },
      take: 1,
      select: { transaction_id: true, transaction_time: true, reason: true },
    });
    return txn
      ? { id: txn.transaction_id, date: txn.transaction_time, type: txn.reason }
      : null;
  }

  async login(login: string, password: string, userAgent?: string) {
    const mobileClient = isMobileClient(userAgent);
    const postmanClient = isPostmanClient(userAgent);
    this.logger.info('Login attempt received', {
      login,
      isMobileClient: mobileClient,
      userAgent,
    });

    const user = await this.prisma.sec_users.findFirst({
      where: { login },
      include: { employee_master: true },
    });

    if (!user || !user.password) {
      this.logger.warn('Login rejected: invalid credentials', {
        login,
        isMobileClient: mobileClient,
      });
      throw new RpcException({ statusCode: 401, message: 'Invalid login or password' });
    }

    if (!postmanClient) {
      if (mobileClient && !user.access_mobile_app) {
        this.logger.warn('Login rejected: mobile access disabled', {
          login,
          employeeId: user.employee_id,
        });
        throw new RpcException({
          statusCode: 403,
          message: 'Access to mobile app is disabled. Please contact IT support.',
        });
      }
      if (mobileClient) {
        await this.appValidator.validateAppAccess(user.user_id!, userAgent);
      }
      if (!mobileClient && !user.access_control_panel) {
        this.logger.warn('Login rejected: control panel access disabled', {
          login,
          employeeId: user.employee_id,
        });
        throw new RpcException({
          statusCode: 403,
          message: 'Access to control panel is disabled. Please contact IT support.',
        });
      }
    }

    if (!this.verifyPassword(password, user.password)) {
      this.logger.warn('Login rejected: invalid credentials', {
        login,
        employeeId: user.employee_id,
        isMobileClient: mobileClient,
      });
      throw new RpcException({ statusCode: 401, message: 'Invalid login or password' });
    }

    const emp = user.employee_master;
    if (!emp) {
      this.logger.warn('Login rejected: employee record missing', {
        login,
        userId: user.user_id,
      });
      throw new RpcException({ statusCode: 401, message: 'Employee record not found' });
    }

    const role = this.getRole(emp.manager_flag);
    const employeeType = this.getEmployeeType(emp.employee_type_id);

    const [orgDetails, lastTxn] = await Promise.all([
      this.getOrganizationByEmployeeId(emp.employee_id),
      this.getLastTransaction(emp.employee_id),
    ]);

    const payload = {
      sub: emp.employee_id,
      userId: user.user_id,
      role,
      employeeType,
      employeeId: emp.employee_id,
      login: user.login,
      isADUser: false,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.prisma.user_tokens.create({
      data: {
        employee_id: emp.employee_id,
        refresh_token: accessToken,
        created_date: new Date(),
        last_updated_date: new Date(),
      },
    });

    await this.prisma.sec_users.update({
      where: { user_id: user.user_id },
      data: { last_login: new Date() },
    });

    if (mobileClient) {
      await this.saveMobileAccessToken(emp.employee_id, accessToken);
    }

    await this.setSessionCache(accessToken, payload);
    this.logger.info('Login succeeded', {
      login: user.login,
      employeeId: emp.employee_id,
      userId: user.user_id,
      isMobileClient: mobileClient,
    });

    return {
      accessToken,
      user: {
        userId: user.user_id,
        employeeName: {
          firsteng: emp.firstname_eng,
          lasteng: emp.lastname_eng,
          firstarb: emp.firstname_arb,
          lastarb: emp.lastname_arb,
        },
        role: role.toUpperCase(),
        employeeType,
        employeeNumber: emp.employee_id,
        subjectId: emp.emp_no,
        email: emp.email,
        isGeofence: emp.geofence_flag ?? false,
        employeeTypeId: emp.employee_type_id,
        organization: orgDetails,
        lastTransaction: lastTxn,
      },
    };
  }

  async adLogin(adToken: string, userAgent?: string) {
    this.logger.info('AD login attempt received', { userAgent });
    const cacheKey = CACHE_KEYS.AD_TOKEN(crypto.createHash('sha256').update(adToken).digest('hex'));
    let empNo = await this.cache.get<string>(cacheKey);
    if (!empNo) {
      empNo = await this.validateTokenWithGraphAPI(adToken);
      if (empNo) {
        await this.cache.set(cacheKey, empNo, CACHE_TTL.AD_TOKEN);
      }
    }

    if (!empNo) {
      this.logger.warn('AD login rejected: invalid AD token');
      throw new RpcException({ statusCode: 401, message: 'Invalid AD token' });
    }

    const mobileClient = isMobileClient(userAgent);
    const postmanClient = isPostmanClient(userAgent);

    const empRecord: any = await this.prisma.employee_master.findFirst({
      where: { emp_no: empNo },
      include: { sec_users: true },
    });

    if (!empRecord) {
      this.logger.warn('AD login rejected: user not found', { empNo });
      throw new RpcException({ statusCode: 404, message: 'User not found' });
    }

    const secUser = empRecord.sec_users;
    if (!secUser) {
      this.logger.warn('AD login rejected: no linked user account', {
        employeeId: empRecord.employee_id,
      });
      throw new RpcException({ statusCode: 401, message: 'No user account linked to this employee' });
    }

    if (!postmanClient) {
      if (mobileClient && !secUser.access_mobile_app) {
        this.logger.warn('AD login rejected: mobile access disabled', {
          employeeId: empRecord.employee_id,
        });
        throw new RpcException({
          statusCode: 403,
          message: 'Access to mobile app is disabled. Please contact IT support.',
        });
      }
      if (mobileClient) {
        await this.appValidator.validateAppAccess(secUser.user_id!, userAgent);
      }
    }

    const role = this.getRole(empRecord.manager_flag);
    const employeeType = this.getEmployeeType(empRecord.employee_type_id);

    const payload = {
      sub: empRecord.employee_id,
      userId: secUser.user_id,
      role,
      employeeType,
      employeeId: empRecord.employee_id,
      login: secUser.login,
      isADUser: true,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.prisma.user_tokens.create({
      data: {
        employee_id: empRecord.employee_id,
        refresh_token: accessToken,
        created_date: new Date(),
        last_updated_date: new Date(),
      },
    });

    if (mobileClient) {
      await this.saveMobileAccessToken(empRecord.employee_id, accessToken);
    }

    await this.setSessionCache(accessToken, payload);
    this.logger.info('AD login succeeded', {
      login: secUser.login,
      employeeId: empRecord.employee_id,
      isMobileClient: mobileClient,
    });

    const [orgDetails, lastTxn] = await Promise.all([
      this.getOrganizationByEmployeeId(empRecord.employee_id),
      this.getLastTransaction(empRecord.employee_id),
    ]);

    return {
      accessToken,
      user: {
        userId: secUser.user_id,
        employeeName: {
          firsteng: empRecord.firstname_eng,
          lasteng: empRecord.lastname_eng,
          firstarb: empRecord.firstname_arb,
          lastarb: empRecord.lastname_arb,
        },
        role: role.toUpperCase(),
        employeeType,
        employeeNumber: empRecord.employee_id,
        subjectId: empRecord.emp_no,
        email: empRecord.email,
        isGeofence: empRecord.geofence_flag ?? false,
        employeeTypeId: empRecord.employee_type_id,
        organization: orgDetails,
        lastTransaction: lastTxn,
      },
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.user_tokens.deleteMany({
      where: { refresh_token: refreshToken },
    });

    try {
      const payload: any = this.jwtService.decode(refreshToken);
      if (payload?.jti) {
        await this.cache.set(CACHE_KEYS.AUTH_BLACKLIST(payload.jti), true, CACHE_TTL.BLACKLIST);
      }
    } catch {}

    await this.deleteSessionCache(refreshToken);

    return { success: true, message: 'Logged out successfully' };
  }

  async validateToken(token: string, userAgent?: string) {
    try {
      const payload: any = this.jwtService.decode(token);
      if (payload?.jti) {
        const blacklisted = await this.cache.exists(CACHE_KEYS.AUTH_BLACKLIST(payload.jti));
        if (blacklisted) return null;
      }

      const cached = await this.getSessionCache(token);
      if (cached) {
        await this.enforceMobileAccess(cached, token, userAgent);
        return cached;
      }

      const verified = this.jwtService.verify(token);
      if (verified) {
        await this.enforceMobileAccess(verified, token, userAgent);
        await this.setSessionCache(token, verified);
      }
      return verified;
    } catch (err) {
      if (err instanceof RpcException) throw err;
      return null;
    }
  }

  private async enforceMobileAccess(
    payload: Record<string, any>,
    token: string,
    userAgent?: string,
  ) {
    if (isPostmanClient(userAgent) || !isMobileClient(userAgent)) return;
    const userId = Number(payload.userId);
    const employeeId = Number(payload.employeeId ?? payload.sub);
    if (!userId) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid token payload',
        code: 'INVALID_TOKEN',
      });
    }
    await this.appValidator.validateAppAccess(userId, userAgent);
    if (employeeId) {
      await this.appValidator.validateMobileToken(employeeId, token);
    }
  }

  private async validateTokenWithGraphAPI(token: string): Promise<string | null> {
    try {
      const { data, status } = await axios.get(
        'https://graph.microsoft.com/v1.0/me?$select=employeeId',
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: this.config.get<number>('graphApiTimeoutMs') ?? 15_000,
        },
      );
      if (status === 200) {
        this.logger.debug('Graph API user resolved', {
          employeeId: data.employeeId,
        });
        return data.employeeId;
      }
    } catch (err: any) {
      this.logger.error('Graph API token validation failed', err);
    }
    return null;
  }

  private async saveMobileAccessToken(employeeId: number, accessToken: string) {
    const existing = await this.prisma.user_tokens.findFirst({
      where: { employee_id: employeeId },
      orderBy: { token_id: 'desc' },
      select: { token_id: true },
    });

    if (existing) {
      await this.prisma.user_tokens.update({
        where: { token_id: existing.token_id },
        data: { refresh_token: accessToken },
      });
      return;
    }

    await this.prisma.user_tokens.create({
      data: { employee_id: employeeId, refresh_token: accessToken },
    });
  }
}
