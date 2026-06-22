import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AppLoggerService } from '@app/common';
import { WorkflowCommonService } from '../shared/workflow-common.service';

@Injectable()
export class MissingMovementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly common: WorkflowCommonService,
    private readonly logger: AppLoggerService,
  ) {}

  private include() {
    return {
      employee_master: {
        select: {
          emp_no: true,
          firstname_eng: true,
          lastname_eng: true,
          firstname_arb: true,
          lastname_arb: true,
          manager_id: true,
          department_id: true,
        },
      },
    };
  }

  private async run<T>(action: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.getError) throw error;
      this.logger.error(`Missing movement workflow failed: ${action}`, error);
      this.common.fail(500, 'Internal server error');
    }
  }

  private whereFromQuery(query: Record<string, any> = {}, managerId?: number) {
    const where: any = {};
    const employeeId = this.common.resolveEmployeeId(query);
    if (employeeId) where.Employee_Id = employeeId;
    const dateFilter = this.common.dateFilter(query.from_date, query.to_date);
    if (dateFilter) where.TransDate = dateFilter;
    if (query.search) {
      const search = String(query.search);
      where.OR = [
        { employee_master: { firstname_eng: { contains: search } } },
        { employee_master: { lastname_eng: { contains: search } } },
        { employee_master: { firstname_arb: { contains: search } } },
        { employee_master: { lastname_arb: { contains: search } } },
        { employee_master: { emp_no: { contains: search } } },
      ];
    }
    const organizationId = this.common.toNumber(query.organization_id);
    const employeeMasterFilter: any = {};
    if (managerId) employeeMasterFilter.manager_id = managerId;
    if (query.department_id) {
      employeeMasterFilter.department_id = Number(query.department_id);
    }
    if (organizationId) employeeMasterFilter.organization_id = organizationId;
    if (Object.keys(employeeMasterFilter).length) {
      where.employee_master = employeeMasterFilter;
    }
    return where;
  }

  async all(payload: { query: any }) {
    return this.run('all', async () => {
      const { skip, take } = this.common.parsePagination(payload.query);
      const where = this.whereFromQuery(payload.query);
      const [data, total] = await Promise.all([
        this.prisma.emp_missing_movements.findMany({
          where,
          skip,
          take,
          orderBy: { TransDate: 'desc' },
          include: this.include(),
        } as any),
        this.prisma.emp_missing_movements.count({ where }),
      ]);
      return { success: true, data, hasNext: skip + data.length < total, total };
    });
  }

  async teamAll(payload: { user: any; query: any }) {
    return this.run('teamAll', async () => {
      const managerId = Number(payload.user?.employeeId);
      if (!managerId) this.common.fail(400, 'manager_id is required');
      const { skip, take } = this.common.parsePagination(payload.query);
      const where = this.whereFromQuery(payload.query, managerId);
      const [data, total] = await Promise.all([
        this.prisma.emp_missing_movements.findMany({
          where,
          skip,
          take,
          orderBy: { TransDate: 'desc' },
          include: this.include(),
        } as any),
        this.prisma.emp_missing_movements.count({ where }),
      ]);
      return { success: true, data, hasNext: skip + data.length < total, total };
    });
  }
}
