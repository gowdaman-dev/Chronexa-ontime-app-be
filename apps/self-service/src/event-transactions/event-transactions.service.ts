import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AppLoggerService } from '@app/common';
import { WorkflowCommonService } from '../shared/workflow-common.service';

@Injectable()
export class EventTransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly common: WorkflowCommonService,
    private readonly logger: AppLoggerService,
  ) {}

  private include() {
    return {
      employee_master: {
        select: {
          employee_id: true,
          emp_no: true,
          firstname_eng: true,
          lastname_eng: true,
          firstname_arb: true,
          lastname_arb: true,
          organization_id: true,
          department_id: true,
          manager_id: true,
        },
      },
    };
  }

  private async run<T>(action: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.getError) throw error;
      if (error?.code === 'P2003') {
        this.common.fail(400, 'Invalid employee ID. The employee does not exist.');
      }
      this.logger.error(`Event transactions failed: ${action}`, error);
      this.common.fail(500, 'Internal server error');
    }
  }

  private async whereFromQuery(query: Record<string, any> = {}, managerId?: number) {
    const where: any = {};
    const employeeId = this.common.resolveEmployeeId(query);
    if (employeeId) where.employee_id = employeeId;

    const dateFilter = this.common.dateFilter(
      query.from_date ?? query.startDate,
      query.to_date ?? query.endDate,
    );
    if (dateFilter) where.transaction_time = dateFilter;

    if (query.reason) where.reason = String(query.reason);
    if (query.search) {
      const term = String(query.search);
      where.OR = [
        { reason: { contains: term } },
        { remarks: { contains: term } },
        {
          employee_master: {
            OR: [
              { firstname_eng: { contains: term } },
              { lastname_eng: { contains: term } },
              { emp_no: { contains: term } },
            ],
          },
        },
      ];
    }

    const organizationId = this.common.toNumber(query.organization_id);
    const departmentId = this.common.toNumber(query.department_id);
    const employeeMasterFilter: any = {};
    if (organizationId) employeeMasterFilter.organization_id = organizationId;
    if (departmentId) employeeMasterFilter.department_id = departmentId;
    if (managerId) employeeMasterFilter.manager_id = managerId;
    else {
      const parsedManagerId = this.common.toNumber(query.manager_id);
      if (parsedManagerId) {
        const team = await this.prisma.employee_master.findMany({
          where: { manager_id: parsedManagerId },
          select: { employee_id: true },
        });
        where.employee_id = { in: team.map((e) => e.employee_id) };
      }
    }
    if (Object.keys(employeeMasterFilter).length) {
      where.employee_master = employeeMasterFilter;
    }
    return where;
  }

  async add(payload: { body: any; user: any }) {
    return this.run('add', async () => {
      const body = payload.body ?? {};
      const employeeId = this.common.toNumber(body.employee_id) ?? Number(payload.user?.employeeId);
      const transactionTime = this.common.parseDate(body.transaction_time);
      if (!employeeId || !transactionTime || !body.reason) {
        this.common.fail(400, 'Invalid input');
      }
      const actorId = Number(payload.user?.employeeId ?? body.created_id ?? employeeId);
      const data = await this.prisma.employee_event_transactions.create({
        data: {
          employee_id: employeeId,
          transaction_time: transactionTime,
          reason: String(body.reason),
          remarks: body.remarks,
          device_id: this.common.toNumber(body.device_id),
          user_entry_flag: this.common.toBoolean(body.user_entry_flag) ?? true,
          geolocation: body.geolocation,
          app_version_no: body.app_version_no,
          created_id: actorId,
          last_updated_id: actorId,
        },
      });
      return { message: 'Employee event transaction created successfully', data };
    });
  }

  async addWithSubjectId(payload: { body: any; user: any }) {
    return this.run('addWithSubjectId', async () => {
      const body = payload.body ?? {};
      const emp = await this.prisma.employee_master.findFirst({
        where: { emp_no: String(body.subject_id) },
        select: { employee_id: true },
      });
      if (!emp) this.common.fail(400, 'Invalid employee number.');
      return this.add({
        user: payload.user,
        body: { ...body, employee_id: emp.employee_id },
      });
    });
  }

  async all(payload: { query: any }) {
    return this.run('all', async () => {
      const { skip, take } = this.common.parsePagination(payload.query);
      const where = await this.whereFromQuery(payload.query);
      const [data, total] = await Promise.all([
        this.prisma.employee_event_transactions.findMany({
          where,
          skip,
          take,
          orderBy: { transaction_id: 'desc' },
          include: this.include(),
        }),
        this.prisma.employee_event_transactions.count({ where }),
      ]);
      return { success: true, data, total, hasNext: skip + data.length < total };
    });
  }

  async get(payload: { id: number }) {
    return this.run('get', async () => {
      const data = await this.prisma.employee_event_transactions.findUnique({
        where: { transaction_id: Number(payload.id) },
        include: this.include(),
      });
      if (!data) this.common.fail(404, 'Transaction not found');
      return { success: true, data };
    });
  }

  byEmployee(payload: { id: number; query: any }) {
    return this.all({
      query: { ...(payload.query ?? {}), employee_id: Number(payload.id) },
    });
  }

  async teamAll(payload: { user: any; query: any }) {
    const managerId = Number(payload.user?.employeeId);
    if (!managerId) this.common.fail(400, 'manager_id is required');
    return this.run('teamAll', async () => {
      const { skip, take } = this.common.parsePagination(payload.query);
      const where = await this.whereFromQuery(payload.query, managerId);
      const [data, total] = await Promise.all([
        this.prisma.employee_event_transactions.findMany({
          where,
          skip,
          take,
          orderBy: { transaction_id: 'desc' },
          include: this.include(),
        }),
        this.prisma.employee_event_transactions.count({ where }),
      ]);
      return { success: true, data, total, hasNext: skip + data.length < total };
    });
  }

  async edit(payload: { id: number; body: any; user: any }) {
    return this.run('edit', async () => {
      const id = Number(payload.id);
      const existing = await this.prisma.employee_event_transactions.findUnique({
        where: { transaction_id: id },
      });
      if (!existing) this.common.fail(404, 'Transaction not found');
      const body = payload.body ?? {};
      const data = await this.prisma.employee_event_transactions.update({
        where: { transaction_id: id },
        data: this.common.compact({
          transaction_time: this.common.parseDate(body.transaction_time),
          reason: body.reason,
          remarks: body.remarks,
          device_id: this.common.toNumber(body.device_id),
          geolocation: body.geolocation,
          last_updated_id: Number(payload.user?.employeeId ?? body.last_updated_id ?? 1),
          last_updated_date: new Date(),
        }),
      });
      return { message: 'Employee event transaction updated successfully', data };
    });
  }

  async delete(payload: { id: number }) {
    return this.run('delete', async () => {
      await this.prisma.employee_event_transactions.delete({
        where: { transaction_id: Number(payload.id) },
      });
      return { message: 'Employee event transaction deleted successfully', transaction_id: Number(payload.id) };
    });
  }

  async deleteMany(payload: { body: any }) {
    return this.run('deleteMany', async () => {
      const ids = this.common.parseNumberArray(payload.body?.ids);
      if (!ids.length) this.common.fail(400, "Invalid input, 'ids' must be a non-empty array.");
      const deleted = await this.prisma.employee_event_transactions.deleteMany({
        where: { transaction_id: { in: ids } },
      });
      return {
        status: true,
        message: `Employee event transactions deleted successfully (${deleted.count} deleted)`,
      };
    });
  }

  async myLastTransactions(payload: { id: number }) {
    return this.run('myLastTransactions', async () => {
      const data = await this.prisma.employee_event_transactions.findMany({
        where: { employee_id: Number(payload.id) },
        orderBy: { transaction_time: 'desc' },
        take: 10,
        include: this.include(),
      });
      return { success: true, data };
    });
  }

  async lastTransaction(payload: { employeeId: number }) {
    return this.run('lastTransaction', async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const data = await this.prisma.employee_event_transactions.findFirst({
        where: {
          employee_id: Number(payload.employeeId),
          transaction_time: { gte: start, lte: end },
        },
        orderBy: { transaction_time: 'desc' },
      });
      return { success: true, data };
    });
  }

  async punchStatus(payload: { query: any; user: any }) {
    return this.lastTransaction({
      employeeId:
        this.common.resolveEmployeeId(payload.query) ?? Number(payload.user?.employeeId),
    });
  }

  async todayStatus(payload: { query: any }) {
    return this.run('todayStatus', async () => {
      const employeeId = this.common.resolveEmployeeId(payload.query);
      const date = payload.query?.date ?? new Date().toISOString().slice(0, 10);
      if (!employeeId) this.common.fail(400, 'employee_id is required');
      const scheduleRows = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT dbo.fn_GetScheduleID(${employeeId}, '${date}') as schedule_id`,
      );
      const holidays = await this.prisma.holidays.findMany({
        where: {
          from_date: { lte: new Date(`${date}T23:59:59`) },
          to_date: { gte: new Date(`${date}T00:00:00`) },
        },
      });
      return {
        success: true,
        data: {
          employee_id: employeeId,
          date,
          schedule_id: scheduleRows?.[0]?.schedule_id ?? null,
          holidays,
        },
      };
    });
  }
}
