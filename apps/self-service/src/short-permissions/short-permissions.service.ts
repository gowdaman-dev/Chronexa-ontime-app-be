import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AppLoggerService } from '@app/common';
import { WorkflowCommonService } from '../shared/workflow-common.service';

@Injectable()
export class ShortPermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly common: WorkflowCommonService,
    private readonly logger: AppLoggerService,
  ) {}

  private include() {
    return {
      permission_types: true,
      employee_master_employee_short_permissions_employee_idToemployee_master: {
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
      employee_master_employee_short_permissions_approver_idToemployee_master: {
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
          'Invalid employee ID, permission type ID, or approver ID. Referenced entities do not exist.',
        );
      }
      this.logger.error(`Short permission workflow failed: ${action}`, error);
      this.common.fail(500, 'Internal server error');
    }
  }

  private combineDateTime(date: any, time: any) {
    if (!date) return undefined;
    const datePart = String(date).includes('T')
      ? String(date).split('T')[0]
      : String(date);
    const timePart = time
      ? String(time).includes('T')
        ? String(time).split('T')[1].split('Z')[0]
        : String(time)
      : '00:00:00';
    const normalizedTime =
      timePart.split(':').length === 2 ? `${timePart}:00` : timePart;
    return this.common.parseDate(`${datePart}T${normalizedTime}.000Z`);
  }

  private mapShortPermissionRow(row: any) {
    if (!row || typeof row !== 'object') return row;
    const mapped = { ...row };
    const employee =
      mapped[this.permissionEmployeeRelationKey] ?? mapped.employee_master;
    if (employee) {
      mapped.employee_master = employee;
      delete mapped[this.permissionEmployeeRelationKey];
    }
    return mapped;
  }

  private whereFromTeamQuery(query: Record<string, any> = {}, managerId: number) {
    const where: any = {
      [this.permissionEmployeeRelationKey]: { manager_id: managerId },
    };
    const employeeId =
      this.common.toNumber(query.employee_id) ??
      this.common.toNumber(query.employeeId);
    if (employeeId) where.employee_id = employeeId;

    if (
      query.pending === true ||
      query.pending === 'true' ||
      query.pending === '1'
    ) {
      where.approve_reject_flag = 0;
    }

    const status =
      this.common.toNumber(query.status) ??
      this.common.toNumber(query.approve_reject_flag);
    if (status !== undefined) where.approve_reject_flag = status;

    if (query.from_date || query.to_date) {
      if (query.from_date) {
        where.to_date = { gte: new Date(`${query.from_date}T00:00:00.000Z`) };
      }
      if (query.to_date) {
        where.from_date = { lte: new Date(`${query.to_date}T23:59:59.999Z`) };
      }
    }

    const search = query.search ? String(query.search) : undefined;
    if (search) {
      return this.common.mergeWhere(where, {
        OR: [
          {
            permission_types: {
              is: {
                OR: [
                  { permission_type_eng: { contains: search } },
                  { permission_type_arb: { contains: search } },
                ],
              },
            },
          },
          {
            [this.permissionEmployeeRelationKey]: {
              OR: [
                { emp_no: { contains: search } },
                { firstname_eng: { contains: search } },
                { lastname_eng: { contains: search } },
                { firstname_arb: { contains: search } },
                { lastname_arb: { contains: search } },
              ],
            },
          },
        ],
      });
    }

    return where;
  }

  private permissionEmployeeRelationKey =
    'employee_master_employee_short_permissions_employee_idToemployee_master';

  private async listShortPermissions(
    query: Record<string, any>,
    options?: {
      mode?: 'list' | 'team';
      managerId?: number;
      user?: { role?: string };
      allowedOrgIds?: number[];
    },
  ) {
    const { skip, take } = this.common.parsePagination(query);
    const where =
      options?.mode === 'team' && options.managerId
        ? this.whereFromTeamQuery(query, options.managerId)
        : this.whereFromQuery(query, options?.user, options?.allowedOrgIds);
    const [rows, total] = await Promise.all([
      this.prisma.employee_short_permissions.findMany({
        where,
        skip,
        take,
        orderBy: { short_permission_id: 'desc' },
        include: this.include(),
      }),
      this.prisma.employee_short_permissions.count({ where }),
    ]);
    const data = rows.map((row) => this.mapShortPermissionRow(row));
    return { success: true, data, total, hasNext: skip + data.length < total };
  }

  private whereFromSearch(
    query: Record<string, any> = {},
    user?: { role?: string },
    allowedOrgIds?: number[],
  ) {
    const where: any = {};
    const status =
      this.common.toNumber(query.status) ??
      this.common.toNumber(query.approve_reject_flag);
    if (status !== undefined) where.approve_reject_flag = status;

    if (query.from_date || query.to_date) {
      const range = this.common.dateFilter(query.from_date, query.to_date);
      if (range) where.from_date = range;
    }

    if (query.employee_number || query.employee_name) {
      where[this.permissionEmployeeRelationKey] = {
        ...(query.employee_number
          ? { emp_no: { contains: String(query.employee_number) } }
          : {}),
        ...(query.employee_name
          ? {
              OR: [
                { firstname_eng: { contains: String(query.employee_name) } },
                { lastname_eng: { contains: String(query.employee_name) } },
                { firstname_arb: { contains: String(query.employee_name) } },
                { lastname_arb: { contains: String(query.employee_name) } },
              ],
            }
          : {}),
      };
    }

    return this.common.applyEmployeeOrgScope(
      where,
      this.permissionEmployeeRelationKey,
      user,
      allowedOrgIds,
    );
  }

  private whereFromQuery(
    query: Record<string, any> = {},
    user?: { role?: string },
    allowedOrgIds?: number[],
  ) {
    const where: any = {};
    const employeeId =
      this.common.resolveEmployeeId(query) ??
      this.common.toNumber(query.employee_id);
    const managerId = this.common.toNumber(query.manager_id);
    const status =
      this.common.toNumber(query.status) ??
      this.common.toNumber(query.approve_reject_flag);
    if (employeeId) where.employee_id = employeeId;
    if (status !== undefined) where.approve_reject_flag = status;
    if (query.from_date || query.to_date) {
      if (query.from_date) where.to_date = { gte: new Date(`${query.from_date}T00:00:00.000Z`) };
      if (query.to_date) where.from_date = { lte: new Date(`${query.to_date}T23:59:59.999Z`) };
    }
    if (query.employee_number || query.employee_name || query.search || managerId) {
      const search = query.employee_name ?? query.search;
      where[this.permissionEmployeeRelationKey] = {
        ...(managerId ? { manager_id: managerId } : {}),
        ...(query.employee_number
          ? { emp_no: { contains: String(query.employee_number) } }
          : {}),
        ...(search
          ? {
              OR: [
                { firstname_eng: { contains: String(search) } },
                { lastname_eng: { contains: String(search) } },
                { firstname_arb: { contains: String(search) } },
                { lastname_arb: { contains: String(search) } },
                { emp_no: { contains: String(search) } },
              ],
            }
          : {}),
      };
    }
    return this.common.applyEmployeeOrgScope(
      where,
      this.permissionEmployeeRelationKey,
      user,
      allowedOrgIds,
    );
  }

  async add(payload: { user: any; body: any }) {
    return this.run('add', async () => {
      const employeeId = Number(payload.user?.employeeId);
      const body = payload.body ?? {};
      const permissionTypeId = this.common.toNumber(body.permission_type_id);
      const fromDate = this.combineDateTime(body.from_date, body.from_time);
      const toDate = this.combineDateTime(
        body.to_date,
        body.to_time ?? body.from_time,
      );
      if (!employeeId || !permissionTypeId || !fromDate || !toDate || !body.remarks) {
        this.common.fail(400, 'Invalid input');
      }
      if (toDate < fromDate) {
        this.common.fail(
          400,
          'To date and time must be greater than or equal to from date and time',
        );
      }
      const overlap = await this.prisma.employee_short_permissions.findFirst({
        where: {
          employee_id: employeeId,
          from_date: { lte: toDate },
          to_date: { gte: fromDate },
        },
      });
      if (overlap) {
        this.common.fail(
          400,
          'Permission dates overlap with existing permission application',
        );
      }
      const created = await this.prisma.employee_short_permissions.create({
        data: {
          permission_type_id: permissionTypeId,
          employee_id: employeeId,
          from_date: fromDate,
          to_date: toDate,
          from_time: fromDate,
          to_time: toDate,
          perm_minutes: this.common.toNumber(body.perm_minutes),
          remarks: body.remarks,
          approver_remarks: null,
          approve_reject_flag: 0,
          approver_id: null,
          approved_date: null,
          created_id: employeeId,
          last_updated_id: employeeId,
        },
      });
      this.logger.info('Employee short permission created', {
        employeeId,
        shortPermissionId: created.short_permission_id,
      });
      return {
        message: 'Employee short permission application submitted successfully',
        data: created,
      };
    });
  }

  async all(payload: { query: any; user?: any; allowedOrgIds?: number[] }) {
    return this.run('all', async () =>
      this.listShortPermissions(payload.query ?? {}, {
        user: payload.user,
        allowedOrgIds: payload.allowedOrgIds,
      }),
    );
  }

  pending(payload: { query: any; user?: any; allowedOrgIds?: number[] }) {
    return this.all({
      query: { ...(payload.query ?? {}), approve_reject_flag: 0 },
      user: payload.user,
      allowedOrgIds: payload.allowedOrgIds,
    });
  }

  search(payload: { query: any; user?: any; allowedOrgIds?: number[] }) {
    return this.run('search', async () => {
      const { skip, take } = this.common.parsePagination(payload.query);
      const where = this.whereFromSearch(
        payload.query,
        payload.user,
        payload.allowedOrgIds,
      );
      const [rows, total] = await Promise.all([
        this.prisma.employee_short_permissions.findMany({
          where,
          skip,
          take,
          orderBy: { short_permission_id: 'desc' },
          include: this.include(),
        }),
        this.prisma.employee_short_permissions.count({ where }),
      ]);
      const data = rows.map((row) => this.mapShortPermissionRow(row));
      return { success: true, data, total, hasNext: skip + data.length < total };
    });
  }

  async get(payload: { id: number }) {
    return this.run('get', async () => {
      const id = Number(payload.id);
      const data = await this.prisma.employee_short_permissions.findUnique({
        where: { short_permission_id: id },
        include: this.include(),
      });
      if (!data) this.common.fail(404, 'Employee short permission not found');
      return { success: true, data: this.mapShortPermissionRow(data) };
    });
  }

  byEmployee(payload: { id: number; query: any }) {
    return this.all({
      query: { ...(payload.query ?? {}), employee_id: Number(payload.id) },
    });
  }

  teamAll(payload: { user: any; query: any; allowedOrgIds?: number[] }) {
    return this.run('teamAll', async () =>
      this.listShortPermissions(payload.query ?? {}, {
        mode: 'team',
        managerId: Number(payload.user?.employeeId),
        user: payload.user,
        allowedOrgIds: payload.allowedOrgIds,
      }),
    );
  }

  async approve(payload: { id: number; body: any; user: any }) {
    return this.run('approve', async () => {
      const id = Number(payload.id);
      const existing = await this.prisma.employee_short_permissions.findUnique({
        where: { short_permission_id: id },
      });
      if (!existing) this.common.fail(404, 'Employee short permission not found');
      const flag = this.common.toNumber(payload.body?.approve_reject_flag);
      if (flag === undefined) this.common.fail(400, 'Invalid input');
      const data = await this.prisma.employee_short_permissions.update({
        where: { short_permission_id: id },
        data: {
          approve_reject_flag: flag,
          approver_remarks: payload.body?.approver_remarks,
          approver_id: Number(payload.user?.employeeId),
          approved_date: new Date(),
          last_updated_id: Number(payload.user?.employeeId),
          last_updated_date: new Date(),
        },
      });
      const action = flag === 1 ? 'approved' : 'rejected';
      return { message: `Employee short permission ${action} successfully`, data };
    });
  }

  async edit(payload: { id: number; body: any; user: any }) {
    return this.run('edit', async () => {
      const id = Number(payload.id);
      const body = payload.body ?? {};
      const existing = await this.prisma.employee_short_permissions.findUnique({
        where: { short_permission_id: id },
      });
      if (!existing) this.common.fail(404, 'Employee short permission not found');
      if (existing.approve_reject_flag !== 0) {
        this.common.fail(
          400,
          'Cannot edit permission that has already been processed',
        );
      }
      const fromDate = body.from_date
        ? this.combineDateTime(body.from_date, body.from_time ?? existing.from_time)
        : undefined;
      const toDate = body.to_date
        ? this.combineDateTime(body.to_date, body.to_time ?? existing.to_time)
        : undefined;
      const data = await this.prisma.employee_short_permissions.update({
        where: { short_permission_id: id },
        data: this.common.compact({
          permission_type_id: this.common.toNumber(body.permission_type_id),
          from_date: fromDate,
          to_date: toDate,
          from_time: fromDate,
          to_time: toDate,
          perm_minutes: this.common.toNumber(body.perm_minutes),
          remarks: body.remarks,
          approver_remarks: body.approver_remarks,
          last_updated_id: Number(payload.user?.employeeId),
          last_updated_date: new Date(),
        }),
      });
      return { message: 'Employee short permission updated successfully', data };
    });
  }

  async delete(payload: { id: number }) {
    return this.run('delete', async () => {
      const id = Number(payload.id);
      const existing = await this.prisma.employee_short_permissions.findUnique({
        where: { short_permission_id: id },
      });
      if (!existing) this.common.fail(404, 'Employee short permission not found');
      if (existing.approve_reject_flag !== 0) {
        this.common.fail(
          400,
          'Cannot delete permission that has already been processed',
        );
      }
      await this.prisma.employee_short_permissions.delete({
        where: { short_permission_id: id },
      });
      return {
        message: 'Employee short permission deleted successfully',
        short_permission_id: id,
      };
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
      const deleted = await this.prisma.employee_short_permissions.deleteMany({
        where: { short_permission_id: { in: ids } },
      });
      return {
        status: true,
        message: `Employee short permissions deleted successfully (${deleted.count} deleted)`,
      };
    });
  }
}
