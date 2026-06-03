import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@app/prisma';
import { ConfigService } from '@app/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class AuthServiceService {
  private readonly logger = new Logger(AuthServiceService.name);
  private readonly pepper: string;
  private readonly tenantId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.pepper =
      this.config.get<string>('accessTokenSecret') ?? 'default-pepper';
    this.tenantId = process.env.TENANT_ID ?? '';
    this.clientId = process.env.CLIENT_ID ?? '';
    this.clientSecret = process.env.CLIENT_SECRET ?? '';
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
      this.logger.error('Get organization error:', err);
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
    const ua = (userAgent ?? '').toLowerCase();
    const isMobileClient = ua.includes('dart/');

    const user = await this.prisma.sec_users.findFirst({
      where: { login },
      include: {
        employee_master: true,
        sec_user_roles: { include: { sec_roles: true } },
      },
    });

    if (!user || !user.password) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid login or password',
      });
    }

    if (isMobileClient && !user.access_mobile_app) {
      throw new RpcException({
        statusCode: 403,
        message: 'Access to mobile app is disabled. Please contact IT support.',
      });
    }
    if (!isMobileClient && !user.access_control_panel) {
      throw new RpcException({
        statusCode: 403,
        message:
          'Access to control panel is disabled. Please contact IT support.',
      });
    }

    if (password !== user.password) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid login or password',
      });
    }

    const emp = user.employee_master;
    if (!emp) {
      throw new RpcException({
        statusCode: 401,
        message: 'Employee record not found',
      });
    }

    const role = user.sec_user_roles[0]?.sec_roles?.role_name ?? 'Employee';
    const [orgDetails, lastTxn] = await Promise.all([
      this.getOrganizationByEmployeeId(emp.employee_id),
      this.getLastTransaction(emp.employee_id),
    ]);

    const payload = {
      sub: emp.employee_id,
      userId: user.user_id,
      role,
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

    if (isMobileClient) {
      await this.saveMobileAccessToken(emp.employee_id, accessToken);
    }

    return {
      accessToken,
      user: {
        userId: user.user_id,
        roleId: user.sec_user_roles[0]?.sec_roles?.role_id,
        employeeName: {
          firsteng: emp.firstname_eng,
          lasteng: emp.lastname_eng,
          firstarb: emp.firstname_arb,
          lastarb: emp.lastname_arb,
        },
        role: role.toUpperCase(),
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
    const empNo = await this.validateTokenWithGraphAPI(adToken);
    if (!empNo) {
      throw new RpcException({ statusCode: 401, message: 'Invalid AD token' });
    }

    const ua = (userAgent ?? '').toLowerCase();
    const isMobileClient =
      ua.includes('dart/') || ua.includes('flutter') || ua.includes('okhttp');

    const empRecord: any = await this.prisma.employee_master.findFirst({
      where: { emp_no: empNo },
      include: {
        sec_users: {
          include: { sec_user_roles: { include: { sec_roles: true } } },
        },
      },
    });

    if (!empRecord) {
      throw new RpcException({ statusCode: 404, message: 'User not found' });
    }

    const secUser = empRecord.sec_users;
    if (!secUser) {
      throw new RpcException({
        statusCode: 401,
        message: 'No user account linked to this employee',
      });
    }

    if (isMobileClient && !secUser.access_mobile_app) {
      throw new RpcException({
        statusCode: 403,
        message: 'Access to mobile app is disabled. Please contact IT support.',
      });
    }

    const role = secUser.sec_user_roles[0]?.sec_roles?.role_name ?? 'Employee';

    const payload = {
      sub: empRecord.employee_id,
      userId: secUser.user_id,
      role,
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

    if (isMobileClient) {
      await this.saveMobileAccessToken(empRecord.employee_id, accessToken);
    }

    const [orgDetails, lastTxn] = await Promise.all([
      this.getOrganizationByEmployeeId(empRecord.employee_id),
      this.getLastTransaction(empRecord.employee_id),
    ]);

    return {
      accessToken,
      user: {
        userId: secUser.user_id,
        roleId: secUser.sec_user_roles[0]?.sec_roles?.role_id,
        employeeName: {
          firsteng: empRecord.firstname_eng,
          lasteng: empRecord.lastname_eng,
          firstarb: empRecord.firstname_arb,
          lastarb: empRecord.lastname_arb,
        },
        role: role.toUpperCase(),
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
    return { success: true, message: 'Logged out successfully' };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      return null;
    }
  }

  private async validateTokenWithGraphAPI(
    token: string,
  ): Promise<string | null> {
    try {
      const { data, status } = await axios.get(
        'https://graph.microsoft.com/v1.0/me?$select=employeeId',
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (status === 200) {
        this.logger.debug('Graph API User:', data);
        return data.employeeId;
      }
    } catch (err: any) {
      this.logger.error('Graph API Error:', err?.message);
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
