import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AppLoggerService } from '@app/common';
import { WorkflowCommonService } from '../shared/workflow-common.service';

@Injectable()
export class PermissionTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly common: WorkflowCommonService,
    private readonly logger: AppLoggerService,
  ) {}

  private async run<T>(action: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.getError) throw error;
      if (error?.code === 'P2002') {
        this.common.fail(400, 'Permission type code already exists.');
      }
      this.logger.error(`Permission types failed: ${action}`, error);
      this.common.fail(500, 'Internal server error');
    }
  }

  private whereFromQuery(query: Record<string, any> = {}) {
    const where: any = {};
    if (query.search || query.name || query.code) {
      const term = String(query.search ?? query.name ?? query.code);
      where.OR = [
        { permission_type_code: { contains: term } },
        { permission_type_eng: { contains: term } },
        { permission_type_arb: { contains: term } },
      ];
    }
    if (query.gender) where.specific_gender = String(query.gender).toUpperCase();
    if (this.common.toBoolean(query.status_flag) !== undefined) {
      where.status_flag = this.common.toBoolean(query.status_flag);
    }
    return where;
  }

  async all(payload: { query?: any }) {
    return this.run('all', async () => {
      const { skip, take } = this.common.parsePagination(payload.query);
      const where = this.whereFromQuery(payload.query);
      const [data, total] = await Promise.all([
        this.prisma.permission_types.findMany({
          where,
          skip,
          take,
          orderBy: { permission_type_id: 'desc' },
        }),
        this.prisma.permission_types.count({ where }),
      ]);
      return { success: true, data, total, hasNext: skip + data.length < total };
    });
  }

  active() {
    return this.all({ query: { status_flag: true, limit: 1000, offset: 1 } });
  }

  byGender(payload: { gender: string }) {
    return this.all({ query: { gender: payload.gender, limit: 1000, offset: 1 } });
  }

  async get(payload: { id: number }) {
    return this.run('get', async () => {
      const data = await this.prisma.permission_types.findUnique({
        where: { permission_type_id: Number(payload.id) },
      });
      if (!data) this.common.fail(404, 'Permission type not found');
      return { success: true, data };
    });
  }

  async add(payload: { body: any; user: any }) {
    return this.run('add', async () => {
      const body = payload.body ?? {};
      const actorId = Number(payload.user?.employeeId ?? body.created_id ?? 1);
      const data = await this.prisma.permission_types.create({
        data: this.common.compact({
          permission_type_code: body.permission_type_code,
          permission_type_eng: body.permission_type_eng ?? body.permission_type_arb ?? '',
          permission_type_arb: body.permission_type_arb ?? body.permission_type_eng ?? '',
          max_perm_per_day: this.common.toNumber(body.max_perm_per_day),
          max_minutes_per_day: this.common.toNumber(body.max_minutes_per_day),
          max_perm_per_month: this.common.toNumber(body.max_perm_per_month),
          max_minutes_per_month: this.common.toNumber(body.max_minutes_per_month),
          group_apply_flag: this.common.toBoolean(body.group_apply_flag) ?? false,
          official_flag: this.common.toBoolean(body.official_flag) ?? false,
          full_day_permission_flag: this.common.toBoolean(body.full_day_permission_flag) ?? false,
          status_flag: this.common.toBoolean(body.status_flag) ?? true,
          workflow_id: this.common.toNumber(body.workflow_id),
          specific_gender: body.specific_gender,
          medical_pass_flag: this.common.toBoolean(body.medical_pass_flag) ?? false,
          mandatory_comments_flag: this.common.toBoolean(body.mandatory_comments_flag) ?? false,
          mandatory_attachment_flag:
            this.common.toBoolean(body.mandatory_attachment_flag) ?? false,
          apply_ramadan_restriction_flag:
            this.common.toBoolean(body.apply_ramadan_restriction_flag) ?? false,
          minutes_permission_flag: this.common.toBoolean(body.minutes_permission_flag) ?? false,
          from_to_time_permission_flag:
            this.common.toBoolean(body.from_to_time_permission_flag) ?? false,
          weekdays_permission_flag: this.common.toBoolean(body.weekdays_permission_flag) ?? false,
          created_id: actorId,
          last_updated_id: actorId,
        }) as any,
      });
      return { message: 'Permission type created successfully', data };
    });
  }

  async edit(payload: { id: number; body: any; user: any }) {
    return this.run('edit', async () => {
      const id = Number(payload.id);
      const existing = await this.prisma.permission_types.findUnique({
        where: { permission_type_id: id },
      });
      if (!existing) this.common.fail(404, 'Permission type not found');
      const body = payload.body ?? {};
      const data = await this.prisma.permission_types.update({
        where: { permission_type_id: id },
        data: this.common.compact({
          permission_type_code: body.permission_type_code,
          permission_type_eng: body.permission_type_eng,
          permission_type_arb: body.permission_type_arb,
          status_flag: this.common.toBoolean(body.status_flag),
          max_perm_per_day: this.common.toNumber(body.max_perm_per_day),
          max_minutes_per_day: this.common.toNumber(body.max_minutes_per_day),
          max_perm_per_month: this.common.toNumber(body.max_perm_per_month),
          max_minutes_per_month: this.common.toNumber(body.max_minutes_per_month),
          specific_gender: body.specific_gender,
          last_updated_id: Number(payload.user?.employeeId ?? body.last_updated_id ?? 1),
          last_updated_date: new Date(),
        }),
      });
      return { message: 'Permission type updated successfully', data };
    });
  }

  async delete(payload: { id: number }) {
    return this.run('delete', async () => {
      const id = Number(payload.id);
      const refs = await this.prisma.employee_short_permissions.count({
        where: { permission_type_id: id },
      });
      if (refs > 0) {
        this.common.fail(400, 'Cannot delete permission type referenced by requests.');
      }
      await this.prisma.permission_types.delete({ where: { permission_type_id: id } });
      return { message: 'Permission type deleted successfully', permission_type_id: id };
    });
  }

  async deleteMany(payload: { body: any }) {
    return this.run('deleteMany', async () => {
      const ids = this.common.parseNumberArray(payload.body?.ids);
      if (!ids.length) this.common.fail(400, "Invalid input, 'ids' must be a non-empty array.");
      const deleted = await this.prisma.permission_types.deleteMany({
        where: { permission_type_id: { in: ids } },
      });
      return {
        status: true,
        message: `Permission types deleted successfully (${deleted.count} deleted)`,
      };
    });
  }

  search(payload: { query: any }) {
    return this.all(payload);
  }
}
