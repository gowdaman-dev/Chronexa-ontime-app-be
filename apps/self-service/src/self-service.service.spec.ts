import { RpcException } from '@nestjs/microservices';
import { SelfServiceService } from './self-service.service';

describe('SelfServiceService mobile migration', () => {
  const fixedNow = new Date('2026-05-02T10:00:00.000Z');
  let prisma: any;
  let config: any;
  let service: SelfServiceService;

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ time: fixedNow }]),
      employee_event_transactions: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      employee_master: {
        findUnique: jest.fn(),
      },
      locations: {
        findMany: jest.fn(),
      },
      local_SparkEmployeeLocationdetailsLocal: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };
    config = {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    };
    service = new SelfServiceService(prisma, config);
    config.get.mockImplementation((key: string, defaultValue?: string) => {
      const values: Record<string, string> = {
        idsBaseUrl: 'https://ids.local/api/v2.0',
        idsUsername: 'ids-user',
        idsPassword: 'ids-password',
      };
      return values[key] ?? defaultValue;
    });
  });

  it('returns last four days of employee transactions', async () => {
    const rows = [{ transaction_id: 2 }, { transaction_id: 1 }];
    prisma.employee_event_transactions.findMany.mockResolvedValue(rows);

    await expect(service.getLastTransactions(123)).resolves.toEqual({
      message: 'Last transactions fetched successfully',
      data: rows,
    });

    expect(prisma.employee_event_transactions.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ employee_id: 123 }),
        orderBy: { transaction_id: 'desc' },
      }),
    );
  });

  it('returns first IN and latest valid OUT for today', async () => {
    const checkIn = new Date('2026-05-02T08:00:00.000Z');
    const firstOut = new Date('2026-05-02T12:00:00.000Z');
    const lastOut = new Date('2026-05-02T17:30:00.000Z');
    prisma.employee_event_transactions.findMany.mockResolvedValue([
      { reason: 'IN', transaction_time: checkIn },
      { reason: 'OUT', transaction_time: firstOut },
      { reason: 'OUT', transaction_time: lastOut },
    ]);
    prisma.employee_event_transactions.findFirst.mockResolvedValue(null);

    await expect(service.getMyCheckInOut(123)).resolves.toEqual({
      message: "Today's check-in/check-out fetched successfully",
      data: { checkIn, checkOut: lastOut },
    });
  });

  it('verifies coordinates inside any configured location radius', async () => {
    prisma.locations.findMany.mockResolvedValue([
      { radius: 100, geolocation: '25.2048,55.2708' },
    ]);

    await expect(service.verifyLocation([25.2048, 55.2708])).resolves.toEqual({
      success: true,
      message: 'Location verified successfully. You are within the allowed work location.',
    });
  });

  it('rejects invalid coordinate payloads', async () => {
    await expect(service.verifyLocation([25.2048])).rejects.toBeInstanceOf(RpcException);
  });

  it('returns assigned work location for active Spark employees', async () => {
    prisma.employee_master.findUnique.mockResolvedValue({
      active_flag: true,
      organization_id: 27,
      employee_type_id: 26,
      emp_no: 'E001',
    });
    prisma.local_SparkEmployeeLocationdetailsLocal.findFirst.mockResolvedValue({
      EmployeeNumber: 'E001',
      NameEng: 'Test Employee',
      LocationCode: 'LOC',
      LocationEng: 'Office',
      City: 'Dubai',
      Geolocation: '25.2048,55.2708',
    });

    await expect(service.getMyWorkLocation(123)).resolves.toEqual({
      success: true,
      message: 'Work location details fetched successfully',
      data: {
        EmployeeNumber: 'E001',
        NameEng: 'Test Employee',
        LocationCode: 'LOC',
        LocationEng: 'Office',
        City: 'Dubai',
        Geolocation: '25.2048,55.2708',
      },
    });
  });

  it('rejects assigned-location checks for non-Spark employees', async () => {
    prisma.employee_master.findUnique.mockResolvedValue({
      emp_no: 'E001',
      organization_id: 1,
      employee_type_id: 1,
    });

    await expect(
      service.verifyAssignedLocation(123, [25.2048, 55.2708]),
    ).rejects.toBeInstanceOf(RpcException);
  });

  it('returns Spark today location with legacy radius override', async () => {
    prisma.employee_master.findUnique.mockResolvedValue({
      emp_no: 'E001',
      organization_id: 27,
      employee_type_id: 26,
    });
    prisma.local_SparkEmployeeLocationdetailsLocal.findFirst.mockResolvedValue({
      EmployeeNumber: 'E001',
      Radius: '100',
      Geolocation: '25.2048,55.2708',
    });

    await expect(service.getSparkTodayLocation(123)).resolves.toEqual({
      message: 'Current location data for employee',
      data: {
        EmployeeNumber: 'E001',
        Radius: '5000000',
        Geolocation: '25.2048,55.2708',
      },
    });
  });

  it('throws not found when no Spark location is assigned for today', async () => {
    prisma.employee_master.findUnique.mockResolvedValue({
      emp_no: 'E001',
      organization_id: 27,
      employee_type_id: 26,
    });
    prisma.local_SparkEmployeeLocationdetailsLocal.findFirst.mockResolvedValue(null);

    await expect(service.getSparkTodayLocation(123)).rejects.toBeInstanceOf(RpcException);
  });

  it('creates an employee transaction after IDS 1:N identification succeeds', async () => {
    const requestJson = jest
      .spyOn(service as any, 'requestJson')
      .mockResolvedValueOnce({
        status: 200,
        headers: { 'set-cookie': ['JSESSIONID=session-1; Path=/'] },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: { bestCandidate: { subjectId: 'EMP001' } },
      });
    requestJson.mockResolvedValueOnce({ status: 200, headers: {}, data: { subjectId: 'EMP001' } });
    prisma.employee_master.findUnique.mockResolvedValue({
      employee_id: 456,
      firstname_eng: 'John',
      firstname_arb: 'جون',
    });
    prisma.employee_event_transactions.create.mockResolvedValue({
      transaction_id: 99,
      employee_id: 456,
      reason: 'IN',
      transaction_time: fixedNow,
    });

    await expect(
      service.punch({
        employeeId: 123,
        file: { buffer: Buffer.from('image') },
        body: { reason: 'IN', geolocation: '25.2048,55.2708' },
        userAgent: 'dart/',
        appVersion: '1.0.0',
      }),
    ).resolves.toEqual({
      success: true,
      message: 'Verification successful',
      subject: expect.objectContaining({
        transaction_id: 99,
        name_eng: 'John',
        name_arb: 'جون',
      }),
    });

    expect(requestJson).toHaveBeenNthCalledWith(
      2,
      'POST',
      'https://ids.local/api/v2.0/identify?liveness=true',
      expect.objectContaining({
        samples: [expect.objectContaining({ data: Buffer.from('image').toString('base64') })],
      }),
      expect.any(Object),
    );
  });

  it('uses IDS verify-encounter for 1:1 verification', async () => {
    const requestJson = jest
      .spyOn(service as any, 'requestJson')
      .mockResolvedValueOnce({
        status: 200,
        headers: { 'set-cookie': ['JSESSIONID=session-1; Path=/'] },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: { bestCandidate: { subjectId: 'EMP001' } },
      });
    requestJson.mockResolvedValueOnce({ status: 200, headers: {}, data: { subjectId: 'EMP001' } });
    prisma.employee_master.findUnique.mockResolvedValue({
      employee_id: 456,
      firstname_eng: 'John',
      firstname_arb: 'جون',
    });
    prisma.employee_event_transactions.create.mockResolvedValue({
      transaction_id: 100,
      employee_id: 456,
      reason: 'OUT',
      transaction_time: fixedNow,
    });

    await service.verifyEncounter({
      employeeId: 123,
      file: { buffer: Buffer.from('image') },
      body: {
        reason: 'OUT',
        subjectId: 'EMP001',
        geolocation: '25.2048,55.2708',
      },
    });

    expect(requestJson).toHaveBeenNthCalledWith(
      2,
      'POST',
      'https://ids.local/api/v2.0/verify-encounter?liveness=true',
      expect.objectContaining({ subjectId: 'EMP001' }),
      expect.any(Object),
    );
  });
});
