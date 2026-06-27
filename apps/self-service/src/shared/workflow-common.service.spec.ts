const { WorkflowCommonService } = require('./workflow-common.service');

describe('WorkflowCommonService date filters', () => {
  let service: any;

  beforeEach(() => {
    const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
    service = new WorkflowCommonService(logger);
  });

  it('dateFilter applies from/to independently', () => {
    expect(service.dateFilter('2026-06-01', undefined)).toEqual({
      gte: new Date('2026-06-01T00:00:00'),
    });
    expect(service.dateFilter(undefined, '2026-06-30')).toEqual({
      lte: new Date('2026-06-30T23:59:59.999'),
    });
    expect(service.dateFilter(undefined, undefined)).toBeUndefined();
  });

  it('buildLeaveAllDateFilter matches old /employeeLeave/all overlap logic', () => {
    expect(service.buildLeaveAllDateFilter()).toEqual({});
    expect(service.buildLeaveAllDateFilter('2026-06-01')).toEqual({
      OR: [
        { from_date: { gte: new Date('2026-06-01T00:00:00') } },
        { to_date: { gte: new Date('2026-06-01T00:00:00') } },
      ],
    });
    expect(service.buildLeaveAllDateFilter('2026-06-01', '2026-06-30').AND).toHaveLength(2);
  });

  it('buildLeaveTeamDateFilter matches old team overlap logic', () => {
    expect(service.buildLeaveTeamDateFilter('2026-06-01', '2026-06-30')).toEqual({
      to_date: { gte: new Date('2026-06-01') },
      from_date: { lte: new Date('2026-06-30') },
    });
  });

  it('buildLeaveEmployeeGetDateFilter matches old get/:id containment logic', () => {
    expect(service.buildLeaveEmployeeGetDateFilter('2026-06-01', '2026-06-30')).toEqual({
      from_date: { gte: new Date('2026-06-01T00:00:00') },
      to_date: { lte: new Date('2026-06-30T23:59:59.999') },
    });
  });
});
