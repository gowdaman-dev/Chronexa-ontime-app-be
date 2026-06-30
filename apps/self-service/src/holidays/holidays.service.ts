import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AppLoggerService } from '@app/common';
import { WorkflowCommonService } from '../shared/workflow-common.service';

@Injectable()
export class HolidaysService {
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
        this.common.fail(400, 'Holiday with the same name already exists');
      }
      this.logger.error(`Holidays failed: ${action}`, error);
      this.common.fail(500, 'Internal server error');
    }
  }

  private buildHolidayDateFilter(query: Record<string, any> = {}) {
    const fromInput = query.from_date;
    const toInput = query.to_date;
    const { startDate: from, endDate: to } = this.common.parseDateRange(
      fromInput,
      toInput,
    );
    if (!from && !to) return {};

    // One date only: holidays active on that calendar day.
    if (from && !to) {
      const { endDate: dayEnd } = this.common.parseDateRange(fromInput, fromInput);
      return {
        AND: [{ to_date: { gte: from } }, { from_date: { lte: dayEnd } }],
      };
    }

    // Both dates: holidays whose period overlaps the range.
    if (from && to) {
      return {
        AND: [{ to_date: { gte: from } }, { from_date: { lte: to } }],
      };
    }

    // to_date only: holidays that started on or before the given day.
    const range = this.common.dateFilter(undefined, toInput);
    return range ? { from_date: range } : {};
  }

  private whereFromQuery(query: Record<string, any> = {}) {
    const where: any = {};
    if (query.search || query.name) {
      const term = String(query.search ?? query.name);
      where.OR = [
        { holiday_eng: { contains: term } },
        { holiday_arb: { contains: term } },
      ];
    }
    if (this.common.toBoolean(query.recurring_flag) !== undefined) {
      where.recurring_flag = this.common.toBoolean(query.recurring_flag);
    }
    if (this.common.toBoolean(query.public_holiday_flag) !== undefined) {
      where.public_holiday_flag = this.common.toBoolean(query.public_holiday_flag);
    }
    const dateFilter = this.buildHolidayDateFilter(query);
    if (Object.keys(dateFilter).length) {
      return this.common.mergeWhere(where, dateFilter);
    }
    return where;
  }

  private buildYearMonthWhere(year?: number, month?: number) {
    if (!year) return {};
    if (year && month) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      return { from_date: { gte: start, lt: end } };
    }
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    return { from_date: { gte: start, lt: end } };
  }

  private buildListWhere(query: Record<string, any> = {}, year?: number, month?: number) {
    const base = this.whereFromQuery(query);
    const yearMonth = this.buildYearMonthWhere(year, month);
    if (!Object.keys(yearMonth).length) return base;
    return this.common.mergeWhere(base, yearMonth);
  }
  private filterHolidaysByYearMonth(
    rows: any[],
    year?: number,
    month?: number,
  ) {
    let holidays = rows;
    if (year) {
      holidays = holidays.filter((holiday) => {
        if (!holiday.from_date) return false;
        return new Date(holiday.from_date).getFullYear() === year;
      });
    }
    if (year && month) {
      holidays = holidays.filter((holiday) => {
        if (!holiday.from_date) return false;
        const holidayDate = new Date(holiday.from_date);
        return (
          holidayDate.getFullYear() === year &&
          holidayDate.getMonth() + 1 === month
        );
      });
    }
    return holidays;
  }

  async all(payload: { query?: any }) {
    return this.run('all', async () => {
      const query = payload.query ?? {};
      const { skip, take } = this.common.parsePagination(query);
      const year = this.common.toNumber(query.year);
      const month = this.common.toNumber(query.month);
      const where = this.buildListWhere(query, year, month);
      const [rows, total] = await Promise.all([
        this.prisma.holidays.findMany({
          where,
          orderBy: { from_date: 'asc' },
          skip,
          take,
        }),
        this.prisma.holidays.count({ where }),
      ]);
      const filtered = this.filterHolidaysByYearMonth(rows, year, month);
      return {
        success: true,
        data: filtered,
        total,
        hasNext: skip + filtered.length < total,
      };
    });
  }

  async get(payload: { id: number }) {
    return this.run('get', async () => {
      const data = await this.prisma.holidays.findUnique({
        where: { holiday_id: Number(payload.id) },
      });
      if (!data) this.common.fail(404, 'Holiday not found');
      return { success: true, data };
    });
  }

  async upcoming(payload: { query?: any }) {
    return this.run('upcoming', async () => {
      const query = payload.query ?? {};
      const { skip, take } = this.common.parsePagination(query);

      if (query.from_date || query.to_date) {
        const where: any = {};
        const range = this.common.dateFilter(query.from_date, query.to_date);
        if (range) where.from_date = range;
        const [rows, total] = await Promise.all([
          this.prisma.holidays.findMany({
            where,
            orderBy: { from_date: 'asc' },
            skip,
            take,
          }),
          this.prisma.holidays.count({ where }),
        ]);
        return {
          success: true,
          data: rows,
          total,
          hasNext: skip + rows.length < total,
        };
      }

      const days = this.common.toNumber(query.days) ?? 30;
      if (days < 1) this.common.fail(400, 'Invalid days parameter. Must be a positive number.');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setDate(end.getDate() + days);
      end.setHours(23, 59, 59, 999);

      const [rows, total] = await Promise.all([
        this.prisma.holidays.findMany({
          where: {
            from_date: { gte: today, lte: end },
          },
          orderBy: { from_date: 'asc' },
          skip,
          take,
        }),
        this.prisma.holidays.count({
          where: {
            from_date: { gte: today, lte: end },
          },
        }),
      ]);
      return {
        success: true,
        data: rows,
        total,
        hasNext: skip + rows.length < total,
      };
    });
  }

  search(payload: { query: any }) {
    return this.all(payload);
  }

  async add(payload: { body: any; user: any }) {
    return this.run('add', async () => {
      const body = payload.body ?? {};
      const actorId = Number(payload.user?.employeeId ?? body.created_id ?? 1);
      const fromDate = this.common.parseDate(body.from_date);
      const toDate = this.common.parseDate(body.to_date);
      if (!fromDate || !toDate || !body.holiday_eng) {
        this.common.fail(400, 'Invalid input');
      }
      const data = await this.prisma.holidays.create({
        data: {
          holiday_eng: body.holiday_eng,
          holiday_arb: body.holiday_arb ?? body.holiday_eng,
          remarks: body.remarks,
          from_date: fromDate,
          to_date: toDate,
          recurring_flag: this.common.toBoolean(body.recurring_flag) ?? false,
          public_holiday_flag: this.common.toBoolean(body.public_holiday_flag) ?? false,
          created_id: actorId,
          last_updated_id: actorId,
        },
      });
      return { message: 'Holiday created successfully', data };
    });
  }

  async edit(payload: { id: number; body: any; user: any }) {
    return this.run('edit', async () => {
      const id = Number(payload.id);
      const existing = await this.prisma.holidays.findUnique({ where: { holiday_id: id } });
      if (!existing) this.common.fail(404, 'Holiday not found');
      const body = payload.body ?? {};
      const data = await this.prisma.holidays.update({
        where: { holiday_id: id },
        data: this.common.compact({
          holiday_eng: body.holiday_eng,
          holiday_arb: body.holiday_arb,
          remarks: body.remarks,
          from_date: this.common.parseDate(body.from_date),
          to_date: this.common.parseDate(body.to_date),
          recurring_flag: this.common.toBoolean(body.recurring_flag),
          public_holiday_flag: this.common.toBoolean(body.public_holiday_flag),
          last_updated_id: Number(payload.user?.employeeId ?? body.last_updated_id ?? 1),
          last_updated_date: new Date(),
        }),
      });
      return { message: 'Holiday updated successfully', data };
    });
  }

  async delete(payload: { id: number }) {
    return this.run('delete', async () => {
      await this.prisma.holidays.delete({ where: { holiday_id: Number(payload.id) } });
      return { message: 'Holiday deleted successfully', holiday_id: Number(payload.id) };
    });
  }

  async deleteMany(payload: { body: any }) {
    return this.run('deleteMany', async () => {
      const ids = this.common.parseNumberArray(payload.body?.ids);
      if (!ids.length) this.common.fail(400, "Invalid input, 'ids' must be a non-empty array.");
      const deleted = await this.prisma.holidays.deleteMany({
        where: { holiday_id: { in: ids } },
      });
      return {
        status: true,
        message: `Holidays deleted successfully (${deleted.count} deleted)`,
      };
    });
  }
}
