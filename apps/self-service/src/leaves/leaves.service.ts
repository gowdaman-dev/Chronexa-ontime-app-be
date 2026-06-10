import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AppLoggerService } from '@app/common';
import { WorkflowCommonService } from '../shared/workflow-common.service';

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly common: WorkflowCommonService,
    private readonly logger: AppLoggerService,
  ) {}

  private include() {
    return {
      leave_types: true,
      employee_master_employee_leaves_employee_idToemployee_master: {
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
      employee_master_employee_leaves_approver_idToemployee_master: {
        select: {
          employee_id: true,
          emp_no: true,
          firstname_eng: true,
          lastname_eng: true,
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
        this.common.fail(
          400,
          'Invalid employee ID, leave type ID, or approver ID. Referenced entities do not exist.',
        );
      }
      this.logger.error(`Leave workflow failed: ${action}`, error);
      this.common.fail(500, 'Internal server error');
    }
  }

  private whereFromQuery(query: Record<string, any> = {}) {
    const where: any = {};
    const employeeId = this.common.toNumber(query.employee_id);
    const leaveTypeId = this.common.toNumber(query.leave_type_id);
    const managerId = this.common.toNumber(query.manager_id);
    const organizationId = this.common.toNumber(query.organization_id);
    const departmentId = this.common.toNumber(query.department_id);
    const leaveStatus =
      this.common.toNumber(query.leave_status) ??
      this.common.toNumber(query.approve_reject_flag);

    if (employeeId) where.employee_id = employeeId;
    if (leaveTypeId) where.leave_type_id = leaveTypeId;
    if (leaveStatus !== undefined) where.approve_reject_flag = leaveStatus;
    if (query.from_date || query.to_date) {
      where.from_date = this.common.dateFilter(query.from_date, query.to_date);
    }
    if (query.transaction_from_date || query.transaction_to_date) {
      where.created_date = this.common.dateFilter(
        query.transaction_from_date,
        query.transaction_to_date,
      );
    }
    if (
      query.search ||
      query.employee_number ||
      query.employee_name ||
      managerId ||
      organizationId ||
      departmentId
    ) {
      where.employee_master_employee_leaves_employee_idToemployee_master = {
        ...(managerId ? { manager_id: managerId } : {}),
        ...(organizationId ? { organization_id: organizationId } : {}),
        ...(departmentId ? { department_id: departmentId } : {}),
        ...(query.employee_number
          ? { emp_no: { contains: String(query.employee_number) } }
          : {}),
        ...(query.employee_name || query.search
          ? {
              OR: [
                { firstname_eng: { contains: String(query.employee_name ?? query.search) } },
                { lastname_eng: { contains: String(query.employee_name ?? query.search) } },
                { firstname_arb: { contains: String(query.employee_name ?? query.search) } },
                { lastname_arb: { contains: String(query.employee_name ?? query.search) } },
                { emp_no: { contains: String(query.employee_name ?? query.search) } },
              ],
            }
          : {}),
      };
    }
    return where;
  }

  async add(payload: { user: any; body: any; file?: any }) {
    return this.run('add', async () => {
      const employeeId = Number(payload.user?.employeeId);
      const body = payload.body ?? {};
      const fromDate = this.common.parseDate(body.from_date);
      const toDate = this.common.parseDate(body.to_date);
      const leaveTypeId = this.common.toNumber(body.leave_type_id);
      if (!employeeId || !leaveTypeId || !fromDate || !toDate) {
        this.common.fail(400, 'Invalid input');
      }

      const overlap = await this.prisma.employee_leaves.findFirst({
        where: {
          employee_id: employeeId,
          from_date: { lte: toDate },
          to_date: { gte: fromDate },
        },
      });
      if (overlap) {
        this.common.fail(
          400,
          'Leave dates overlap with existing leave application',
        );
      }

      const created = await this.prisma.employee_leaves.create({
        data: this.common.compact({
          leave_type_id: leaveTypeId,
          employee_id: employeeId,
          from_date: fromDate,
          to_date: toDate,
          number_of_leaves: this.common.toNumber(body.number_of_leaves),
          employee_remarks: body.employee_remarks,
          approve_reject_flag: this.common.toNumber(body.approve_reject_flag) ?? 0,
          approver_id: this.common.toNumber(body.approver_id),
          approver_remarks: body.approver_remarks,
          approved_date: this.common.parseDate(body.approved_date),
          leave_status: body.leave_status ?? 'PENDING',
          alternate_employee_id: this.common.toNumber(body.alternate_employee_id),
          handovers_to_alternate_employee: body.handovers_to_alternate_employee,
          leave_doc_filename_path:
            this.common.uploadPath(payload.file) ?? body.leave_doc_filename_path,
          leave_unique_ref_no: `LEAVE-${Date.now()}-${employeeId}`,
          carryforward_flag: this.common.toBoolean(body.carryforward_flag) ?? false,
          created_id: employeeId,
          last_updated_id: employeeId,
        }),
      });
      this.logger.info('Employee leave created', {
        employeeId,
        employeeLeaveId: created.employee_leave_id,
      });
      return {
        message: 'Employee leave application submitted successfully',
        data: created,
      };
    });
  }

  async all(payload: { query: any }) {
    return this.run('all', async () => {
      const { skip, take } = this.common.parsePagination(payload.query);
      const where = this.whereFromQuery(payload.query);
      const [data, total] = await Promise.all([
        this.prisma.employee_leaves.findMany({
          where,
          skip,
          take,
          orderBy: { employee_leave_id: 'desc' },
          include: this.include(),
        }),
        this.prisma.employee_leaves.count({ where }),
      ]);
      return { success: true, data, total, hasNext: skip + data.length < total };
    });
  }

  async pending(payload: { query: any }) {
    return this.all({
      query: { ...(payload.query ?? {}), approve_reject_flag: 0 },
    });
  }

  async get(payload: { id: number }) {
    return this.run('get', async () => {
      const id = Number(payload.id);
      if (!id) this.common.fail(400, 'Invalid input');
      const data = await this.prisma.employee_leaves.findUnique({
        where: { employee_leave_id: id },
        include: this.include(),
      });
      if (!data) this.common.fail(404, 'Employee leave not found');
      return { success: true, data };
    });
  }

  async byEmployee(payload: { id: number; query: any }) {
    return this.all({
      query: { ...(payload.query ?? {}), employee_id: Number(payload.id) },
    });
  }

  async myRequests(payload: { user: any; query: any }) {
    return this.byEmployee({
      id: Number(payload.user?.employeeId),
      query: payload.query,
    });
  }

  async teamAll(payload: { user: any; query: any }) {
    return this.run('teamAll', async () => {
      const managerId = Number(payload.user?.employeeId);
      if (!managerId) this.common.fail(400, 'manager_id is required');
      return this.all({
        query: { ...(payload.query ?? {}), manager_id: managerId },
      });
    });
  }

  async approve(payload: { id: number; body: any; user: any }) {
    return this.run('approve', async () => {
      const id = Number(payload.id);
      const existing = await this.prisma.employee_leaves.findUnique({
        where: { employee_leave_id: id },
      });
      if (!existing) this.common.fail(404, 'Employee leave not found');
      const flag = this.common.toNumber(payload.body?.approve_reject_flag);
      if (flag === undefined) this.common.fail(400, 'Invalid input');
      await this.prisma.employee_leaves.update({
        where: { employee_leave_id: id },
        data: {
          approve_reject_flag: flag,
          approver_remarks: payload.body?.approver_remarks,
          approver_id: Number(payload.user?.employeeId),
          approved_date: new Date(),
          leave_status: flag === 1 ? 'APPROVED' : flag === 2 ? 'REJECTED' : 'PENDING',
          last_updated_id: Number(payload.user?.employeeId),
          last_updated_date: new Date(),
        },
      });
      const action = flag === 1 ? 'approved' : 'rejected';
      return { message: `Employee leave ${action} successfully`, employee_leave_id: id };
    });
  }

  async edit(payload: { id: number; body: any; file?: any; user: any }) {
    return this.run('edit', async () => {
      const id = Number(payload.id);
      const existing = await this.prisma.employee_leaves.findUnique({
        where: { employee_leave_id: id },
      });
      if (!existing) this.common.fail(404, 'Employee leave not found');
      if (existing.leave_status && existing.leave_status !== 'PENDING') {
        this.common.fail(400, 'Cannot edit leave that has already been processed');
      }
      const body = payload.body ?? {};
      const data = await this.prisma.employee_leaves.update({
        where: { employee_leave_id: id },
        data: this.common.compact({
          leave_type_id: this.common.toNumber(body.leave_type_id),
          from_date: this.common.parseDate(body.from_date),
          to_date: this.common.parseDate(body.to_date),
          number_of_leaves: this.common.toNumber(body.number_of_leaves),
          employee_remarks: body.employee_remarks,
          alternate_employee_id: this.common.toNumber(body.alternate_employee_id),
          handovers_to_alternate_employee: body.handovers_to_alternate_employee,
          leave_doc_filename_path:
            this.common.uploadPath(payload.file) ?? body.leave_doc_filename_path,
          carryforward_flag: this.common.toBoolean(body.carryforward_flag),
          last_updated_id: Number(payload.user?.employeeId),
          last_updated_date: new Date(),
        }),
      });
      return { message: 'Employee leave updated successfully', data };
    });
  }

  async delete(payload: { id: number }) {
    return this.run('delete', async () => {
      const id = Number(payload.id);
      const existing = await this.prisma.employee_leaves.findUnique({
        where: { employee_leave_id: id },
      });
      if (!existing) this.common.fail(404, 'Employee leave not found');
      if (existing.leave_status && existing.leave_status !== 'PENDING') {
        this.common.fail(400, 'Cannot delete leave that has already been processed');
      }
      await this.prisma.employee_leaves.delete({ where: { employee_leave_id: id } });
      return { message: 'Employee leave deleted successfully', employee_leave_id: id };
    });
  }

  async deleteMany(payload: { body: any }) {
    return this.run('deleteMany', async () => {
      const ids = Array.isArray(payload.body?.ids)
        ? payload.body.ids.map(Number).filter(Number.isFinite)
        : [];
      if (!ids.length) {
        this.common.fail(400, "Invalid input, 'ids' must be a non-empty array.");
      }
      const deleted = await this.prisma.employee_leaves.deleteMany({
        where: { employee_leave_id: { in: ids } },
      });
      return {
        status: true,
        message: `Employee leaves deleted successfully (${deleted.count} deleted)`,
      };
    });
  }
}
