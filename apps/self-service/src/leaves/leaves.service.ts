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

  private employeeRelationKey =
    'employee_master_employee_leaves_employee_idToemployee_master';

  private leaveApproverRelationKey =
    'employee_master_employee_leaves_approver_idToemployee_master';

  private mapLeaveRow(row: any) {
    if (!row || typeof row !== 'object') return row;
    const mapped = { ...row };
    const employee =
      mapped[this.employeeRelationKey] ?? mapped.employee_master;
    if (employee) {
      mapped.employee_master = employee;
      delete mapped[this.employeeRelationKey];
    }
    const approver =
      mapped[this.leaveApproverRelationKey] ?? mapped.approver_master;
    if (approver) {
      mapped.approver_master = approver;
    }
    delete mapped[this.leaveApproverRelationKey];
    return mapped;
  }

  private async assertEmployeeOrgAccess(
    employeeId: number,
    user?: { role?: string },
    allowedOrgIds?: number[],
  ) {
    if (this.common.isAdminRole(user)) return;
    const employee = await this.prisma.employee_master.findUnique({
      where: { employee_id: employeeId },
      select: { organization_id: true },
    });
    if (
      employee?.organization_id &&
      allowedOrgIds?.length &&
      !allowedOrgIds.includes(employee.organization_id)
    ) {
      this.common.fail(403, 'You do not have permission to view these leaves');
    }
  }

  private whereFromQuery(
    query: Record<string, any> = {},
    options?: {
      mode?: 'all' | 'team' | 'employee';
      user?: { role?: string };
      allowedOrgIds?: number[];
    },
  ) {
    const mode = options?.mode ?? 'all';
    let where: any = {};
    const employeeId = this.common.resolveEmployeeId(query);
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
    if (
      query.pending === true ||
      query.pending === 'true' ||
      query.pending === '1'
    ) {
      where.approve_reject_flag = 0;
    }

    if (mode === 'team') {
      const teamDate = this.common.buildLeaveTeamDateFilter(
        query.from_date,
        query.to_date,
      );
      where = this.common.mergeWhere(where, teamDate);
    } else if (mode === 'employee') {
      const employeeDate = this.common.buildLeaveEmployeeGetDateFilter(
        query.from_date,
        query.to_date,
      );
      where = this.common.mergeWhere(where, employeeDate);
      if (query.search) {
        where.leave_types = {
          is: {
            OR: [
              { leave_type_eng: { contains: String(query.search) } },
              { leave_type_arb: { contains: String(query.search) } },
            ],
          },
        };
      }
    } else {
      const listDate = this.common.buildLeaveAllDateFilter(
        query.from_date,
        query.to_date,
      );
      where = this.common.mergeWhere(where, listDate);
    }

    if (query.transaction_from_date || query.transaction_to_date) {
      where.created_date = this.common.dateFilter(
        query.transaction_from_date,
        query.transaction_to_date,
      );
    }

    if (mode === 'team' && managerId) {
      const existing = where[this.employeeRelationKey] ?? {};
      where[this.employeeRelationKey] = { ...existing, manager_id: managerId };
    }

    if (
      query.search ||
      query.employee_number ||
      query.employee_name ||
      organizationId ||
      departmentId
    ) {
      const search = query.employee_name ?? query.search;
      const employeeFilter: Record<string, any> = {
        ...(organizationId ? { organization_id: organizationId } : {}),
        ...(departmentId ? { department_id: departmentId } : {}),
        ...(query.employee_number
          ? { emp_no: { contains: String(query.employee_number) } }
          : {}),
      };

      if (mode === 'team' && search) {
        where = this.common.mergeWhere(where, {
          OR: [
            {
              [this.employeeRelationKey]: {
                OR: [
                  { emp_no: { contains: String(search) } },
                  { firstname_eng: { contains: String(search) } },
                  { lastname_eng: { contains: String(search) } },
                  { firstname_arb: { contains: String(search) } },
                  { lastname_arb: { contains: String(search) } },
                ],
              },
            },
            {
              leave_types: {
                OR: [
                  { leave_type_eng: { contains: String(search) } },
                  { leave_type_arb: { contains: String(search) } },
                ],
              },
            },
          ],
        });
      } else if (search || query.employee_number) {
        employeeFilter.OR = search
          ? [
              { firstname_eng: { contains: String(search) } },
              { lastname_eng: { contains: String(search) } },
              { firstname_arb: { contains: String(search) } },
              { lastname_arb: { contains: String(search) } },
              { emp_no: { contains: String(search) } },
            ]
          : undefined;
        where[this.employeeRelationKey] = {
          ...(where[this.employeeRelationKey] ?? {}),
          ...this.common.compact(employeeFilter),
        };
      } else if (Object.keys(employeeFilter).length) {
        where[this.employeeRelationKey] = {
          ...(where[this.employeeRelationKey] ?? {}),
          ...employeeFilter,
        };
      }
    }

    return this.common.applyEmployeeOrgScope(
      where,
      this.employeeRelationKey,
      options?.user,
      options?.allowedOrgIds,
    );
  }

  private async listLeaves(
    query: Record<string, any>,
    options?: {
      mode?: 'all' | 'team' | 'employee';
      user?: { role?: string };
      allowedOrgIds?: number[];
    },
  ) {
    const { skip, take } = this.common.parsePagination(query);
    const where = this.whereFromQuery(query, options);
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
    const mapped = data.map((row) => this.mapLeaveRow(row));
    return {
      success: true,
      data: mapped,
      total,
      hasNext: skip + mapped.length < total,
    };
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

  async all(payload: { query: any; user?: any; allowedOrgIds?: number[] }) {
    return this.run('all', async () => {
      return this.listLeaves(payload.query ?? {}, {
        mode: 'all',
        user: payload.user,
        allowedOrgIds: payload.allowedOrgIds,
      });
    });
  }

  async pending(payload: { query: any; user?: any; allowedOrgIds?: number[] }) {
    return this.all({
      query: { ...(payload.query ?? {}), approve_reject_flag: 0 },
      user: payload.user,
      allowedOrgIds: payload.allowedOrgIds,
    });
  }

  async get(payload: {
    id: number;
    query?: any;
    user?: any;
    allowedOrgIds?: number[];
  }) {
    return this.run('get', async () => {
      const employeeId = Number(payload.id);
      if (!employeeId) this.common.fail(400, 'Invalid input');
      await this.assertEmployeeOrgAccess(
        employeeId,
        payload.user,
        payload.allowedOrgIds,
      );
      return this.listLeaves(
        { ...(payload.query ?? {}), employee_id: employeeId },
        {
          mode: 'employee',
          user: payload.user,
          allowedOrgIds: payload.allowedOrgIds,
        },
      );
    });
  }

  async byEmployee(payload: {
    id: number;
    query: any;
    user?: any;
    allowedOrgIds?: number[];
  }) {
    return this.get({
      id: Number(payload.id),
      query: payload.query,
      user: payload.user,
      allowedOrgIds: payload.allowedOrgIds,
    });
  }

  async myRequests(payload: { user: any; query: any }) {
    return this.byEmployee({
      id: Number(payload.user?.employeeId),
      query: payload.query,
    });
  }

  async teamAll(payload: { user: any; query: any; allowedOrgIds?: number[] }) {
    return this.run('teamAll', async () => {
      const managerId = Number(payload.user?.employeeId);
      if (!managerId) this.common.fail(400, 'manager_id is required');
      return this.listLeaves(
        { ...(payload.query ?? {}), manager_id: managerId },
        {
          mode: 'team',
          user: payload.user,
          allowedOrgIds: payload.allowedOrgIds,
        },
      );
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
