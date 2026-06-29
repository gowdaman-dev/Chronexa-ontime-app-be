import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ConfigService } from '@app/config';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '@app/redis';
import { AppLoggerService, runMicroserviceAction } from '@app/common';
import * as crypto from 'crypto';

@Injectable()
export class UserServiceService {
  private readonly pepper: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly cache: CacheService,
    private readonly logger: AppLoggerService,
  ) {
    this.pepper = this.config.get<string>('accessTokenSecret') ?? 'default-pepper';
  }

  private run<T>(action: string, fn: () => Promise<T>): Promise<T> {
    return runMicroserviceAction(this.logger, action, fn, {
      logContext: 'User service action failed',
    });
  }

  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt + this.pepper, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  private mapUserResponse(user: any) {
    const { password, ...rest } = user;
    return {
      userId: rest.user_id,
      login: rest.login,
      employeeId: rest.employee_id,
      employeeName: rest.employee_master
        ? `${rest.employee_master.firstname_eng ?? ''} ${rest.employee_master.lastname_eng ?? ''}`.trim()
        : null,
      email: rest.employee_master?.email ?? null,
      accessControlPanel: rest.access_control_panel,
      accessMobileApp: rest.access_mobile_app,
      isAdUser: rest.is_ad_user,
      appType: rest.app_type,
      activeUser: rest.active_user,
      lastLogin: rest.last_login,
      roles: rest.sec_user_roles?.map((r: any) => r.sec_roles?.role_name).filter(Boolean) ?? [],
    };
  }

  private mapEmployeeResponse(emp: any) {
    return {
      employeeId: emp.employee_id,
      empNo: emp.emp_no,
      firstnameEng: emp.firstname_eng,
      lastnameEng: emp.lastname_eng,
      firstnameArb: emp.firstname_arb,
      lastnameArb: emp.lastname_arb,
      email: emp.email ?? null,
      mobile: emp.mobile ?? null,
      departmentId: emp.department_id ?? null,
      designationId: emp.designation_id ?? null,
      activeFlag: emp.active_flag ?? null,
      employeeStatus: emp.employee_status ?? null,
      createdDate: emp.created_date,
      lastUpdatedDate: emp.last_updated_date,
    };
  }

  async getUserById(id: number) {
    return this.run('getUserById', async () => {
      const user = await this.prisma.sec_users.findUnique({
      where: { user_id: id },
      include: {
        employee_master: { select: { firstname_eng: true, lastname_eng: true, email: true } },
        sec_user_roles: { include: { sec_roles: { select: { role_name: true } } } },
      },
    });
    if (!user) return null;
    return this.mapUserResponse(user);
    });
  }

  async getUserByLogin(login: string) {
    return this.run('getUserByLogin', async () => {
      const user = await this.prisma.sec_users.findUnique({
      where: { login },
      include: {
        employee_master: { select: { firstname_eng: true, lastname_eng: true, email: true } },
        sec_user_roles: { include: { sec_roles: { select: { role_name: true } } } },
      },
    });
    if (!user) return null;
    return this.mapUserResponse(user);
    });
  }

  async getAllUsers(limit = 20, offset = 0) {
    return this.run('getAllUsers', async () => {
      const cacheKey = CACHE_KEYS.USERS_LIST(limit, offset);
    const cached = await this.cache.get<{
      success: boolean;
      data: any[];
      total: number;
      hasNext: boolean;
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    const [users, total] = await Promise.all([
      this.prisma.sec_users.findMany({
        skip: offset,
        take: limit,
        include: {
          employee_master: { select: { firstname_eng: true, lastname_eng: true, email: true } },
          sec_user_roles: { include: { sec_roles: { select: { role_name: true } } } },
        },
      }),
      this.prisma.sec_users.count(),
    ]);

    const data = users.map((u) => this.mapUserResponse(u));
    const response = {
      success: true,
      data,
      total,
      hasNext: offset + limit < total,
    };
    await this.cache.set(cacheKey, response, CACHE_TTL.LIST);

    return response;
    });
  }

  async createUser(data: any) {
    return this.run('createUser', async () => {
      const createData: any = {
      login: data.login,
      employee_id: data.employeeId ?? data.employee_id,
      created_id: data.createdId ?? data.created_id,
      created_date: new Date(),
      last_updated_id: data.lastUpdatedId ?? data.last_updated_id ?? data.createdId ?? data.created_id,
      last_updated_date: new Date(),
    };

    if (data.password) {
      createData.password = this.hashPassword(data.password);
    }

    if (data.accessControlPanel !== undefined) createData.access_control_panel = data.accessControlPanel;
    if (data.accessMobileApp !== undefined) createData.access_mobile_app = data.accessMobileApp;
    if (data.isAdUser !== undefined) createData.is_ad_user = data.isAdUser;
    if (data.appType !== undefined) createData.app_type = data.appType;
    if (data.activeUser !== undefined) createData.active_user = data.activeUser;

    const user = await (this.prisma.sec_users.create as any)({ data: createData });
    await this.cache.delPattern('users:list:*');
    return this.getUserById(user.user_id);
    });
  }

  async updateUser(id: number, data: any) {
    return this.run('updateUser', async () => {
      const updateData: any = {};

    if (data.login !== undefined) updateData.login = data.login;
    if (data.password !== undefined) updateData.password = this.hashPassword(data.password);
    if (data.accessControlPanel !== undefined) updateData.access_control_panel = data.accessControlPanel;
    if (data.accessMobileApp !== undefined) updateData.access_mobile_app = data.accessMobileApp;
    if (data.isAdUser !== undefined) updateData.is_ad_user = data.isAdUser;
    if (data.appType !== undefined) updateData.app_type = data.appType;
    if (data.activeUser !== undefined) updateData.active_user = data.activeUser;
    if (data.employeeId !== undefined) updateData.employee_id = data.employeeId;

    updateData.last_updated_id = data.lastUpdatedId ?? data.last_updated_id;
    updateData.last_updated_date = new Date();

    await (this.prisma.sec_users.update as any)({
      where: { user_id: id },
      data: updateData,
    });
    await this.cache.delPattern('users:list:*');
    return this.getUserById(id);
    });
  }

  async deleteUser(id: number) {
    return this.run('deleteUser', async () => {
      await (this.prisma.sec_user_roles.deleteMany as any)({ where: { user_id: id } });
    await (this.prisma.sec_users.delete as any)({ where: { user_id: id } });
    await this.cache.delPattern('users:list:*');
    return { success: true };
    });
  }

  async getEmployeeById(id: number) {
    return this.run('getEmployeeById', async () => {
      const emp = await this.prisma.employee_master.findUnique({ where: { employee_id: id } });
    if (!emp) return null;
    return this.mapEmployeeResponse(emp);
    });
  }

  async getAllEmployees(limit = 20, offset = 0) {
    return this.run('getAllEmployees', async () => {
      const cacheKey = CACHE_KEYS.EMPLOYEES_LIST(limit, offset);
    const cached = await this.cache.get<{
      success: boolean;
      data: any[];
      total: number;
      hasNext: boolean;
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    const [emps, total] = await Promise.all([
      this.prisma.employee_master.findMany({ skip: offset, take: limit }),
      this.prisma.employee_master.count(),
    ]);

    const data = emps.map((e) => this.mapEmployeeResponse(e));
    const response = {
      success: true,
      data,
      total,
      hasNext: offset + limit < total,
    };
    await this.cache.set(cacheKey, response, CACHE_TTL.LIST);

    return response;
    });
  }

  async createEmployee(data: any) {
    return this.run('createEmployee', async () => {
      const createData: Record<string, any> = {
      emp_no: data.empNo ?? data.emp_no,
      firstname_eng: data.firstnameEng ?? data.firstname_eng,
      lastname_eng: data.lastnameEng ?? data.lastname_eng,
      firstname_arb: data.firstnameArb ?? data.firstname_arb,
      lastname_arb: data.lastnameArb ?? data.lastname_arb,
      created_id: data.createdId ?? data.created_id,
      created_date: new Date(),
      last_updated_id: data.lastUpdatedId ?? data.last_updated_id ?? data.createdId ?? data.created_id,
      last_updated_date: new Date(),
    };

    const fieldMap: Record<string, string> = {
      cardNumber: 'card_number',
      organizationId: 'organization_id',
      gradeId: 'grade_id',
      designationId: 'designation_id',
      citizenshipId: 'citizenship_id',
      employeeTypeId: 'employee_type_id',
      departmentId: 'department_id',
      managerId: 'manager_id',
      locationId: 'location_id',
      contractCompanyId: 'contract_company_id',
      joinDate: 'join_date',
      activeDate: 'active_date',
      inactiveDate: 'inactive_date',
      nationalId: 'national_id',
      nationalIdExpiryDate: 'national_id_expiry_date',
      passportNumber: 'passport_number',
      passportExpiryDate: 'passport_expiry_date',
      passportIssueCountryId: 'passport_issue_country_id',
      mobile: 'mobile',
      email: 'email',
      personalEmail: 'personal_email',
      gender: 'gender',
      photoFileName: 'photo_file_name',
      remarks: 'remarks',
      employeeStatus: 'employee_status',
      costCenter: 'cost_center',
      costCode: 'cost_code',
      activeFlag: 'active_flag',
      localFlag: 'local_flag',
      punchFlag: 'punch_flag',
      managerFlag: 'manager_flag',
      onReportsFlag: 'on_reports_flag',
      includeEmailFlag: 'include_email_flag',
      openShiftFlag: 'open_shift_flag',
      overtimeFlag: 'overtime_flag',
      webPunchFlag: 'web_punch_flag',
      shiftFlag: 'shift_flag',
      sapUserFlag: 'sap_user_flag',
      localUserFlag: 'local_user_flag',
      inpayrollFlag: 'inpayroll_flag',
      shareRosterFlag: 'share_roster_flag',
      geofenceFlag: 'geofence_flag',
      emailNotificationsFlag: 'email_notifications_flag',
      checkInoutSelfieFlag: 'check_inout_selfie_flag',
      calculateMonthlyMissedHrsFlag: 'calculate_monthly_missed_hrs_flag',
      excludeFromIntegrationFlag: 'exclude_from_integration_flag',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (data[camel] !== undefined) {
        createData[snake] = data[camel];
      }
    }

    const emp = await (this.prisma.employee_master.create as any)({ data: createData });
    await this.cache.delPattern('employees:list:*');
    return this.mapEmployeeResponse(emp);
    });
  }

  async updateEmployee(id: number, data: any) {
    return this.run('updateEmployee', async () => {
      const updateData: Record<string, any> = {};

    const fieldMap: Record<string, string> = {
      empNo: 'emp_no',
      firstnameEng: 'firstname_eng',
      lastnameEng: 'lastname_eng',
      firstnameArb: 'firstname_arb',
      lastnameArb: 'lastname_arb',
      cardNumber: 'card_number',
      pin: 'pin',
      organizationId: 'organization_id',
      gradeId: 'grade_id',
      designationId: 'designation_id',
      citizenshipId: 'citizenship_id',
      employeeTypeId: 'employee_type_id',
      departmentId: 'department_id',
      managerId: 'manager_id',
      locationId: 'location_id',
      contractCompanyId: 'contract_company_id',
      joinDate: 'join_date',
      activeDate: 'active_date',
      inactiveDate: 'inactive_date',
      nationalId: 'national_id',
      nationalIdExpiryDate: 'national_id_expiry_date',
      passportNumber: 'passport_number',
      passportExpiryDate: 'passport_expiry_date',
      passportIssueCountryId: 'passport_issue_country_id',
      mobile: 'mobile',
      email: 'email',
      personalEmail: 'personal_email',
      gender: 'gender',
      photoFileName: 'photo_file_name',
      remarks: 'remarks',
      employeeStatus: 'employee_status',
      costCenter: 'cost_center',
      costCode: 'cost_code',
      activeFlag: 'active_flag',
      localFlag: 'local_flag',
      punchFlag: 'punch_flag',
      managerFlag: 'manager_flag',
      onReportsFlag: 'on_reports_flag',
      includeEmailFlag: 'include_email_flag',
      openShiftFlag: 'open_shift_flag',
      overtimeFlag: 'overtime_flag',
      webPunchFlag: 'web_punch_flag',
      shiftFlag: 'shift_flag',
      sapUserFlag: 'sap_user_flag',
      localUserFlag: 'local_user_flag',
      inpayrollFlag: 'inpayroll_flag',
      shareRosterFlag: 'share_roster_flag',
      geofenceFlag: 'geofence_flag',
      emailNotificationsFlag: 'email_notifications_flag',
      checkInoutSelfieFlag: 'check_inout_selfie_flag',
      calculateMonthlyMissedHrsFlag: 'calculate_monthly_missed_hrs_flag',
      excludeFromIntegrationFlag: 'exclude_from_integration_flag',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (data[camel] !== undefined) {
        updateData[snake] = data[camel];
      }
    }

    updateData.last_updated_id = data.lastUpdatedId ?? data.last_updated_id;
    updateData.last_updated_date = new Date();

    await (this.prisma.employee_master.update as any)({
      where: { employee_id: id },
      data: updateData,
    });
    await this.cache.delPattern('employees:list:*');
    return this.getEmployeeById(id);
    });
  }

  async deleteEmployee(id: number) {
    return this.run('deleteEmployee', async () => {
      await (this.prisma.employee_master.delete as any)({ where: { employee_id: id } });
      await this.cache.delPattern('employees:list:*');
      return { success: true };
    });
  }
}
