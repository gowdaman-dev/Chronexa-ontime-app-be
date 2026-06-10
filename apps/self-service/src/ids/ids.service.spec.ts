const { MobileIdsService } = require('./ids.service');

describe('MobileIdsService', () => {
  const fixedNow = new Date('2026-05-02T10:00:00.000Z');
  let prisma: any;
  let config: any;
  let common: any;
  let service: any;

  beforeEach(() => {
    prisma = {
      employee_event_transactions: {
        create: jest.fn(),
      },
      employee_master: {
        findUnique: jest.fn(),
      },
    };
    config = {
      get: jest.fn(),
    };
    config.get.mockImplementation((key: string, defaultValue?: string) => {
      const values: Record<string, string> = {
        idsBaseUrl: 'https://ids.local/api/v2.0',
        idsUsername: 'ids-user',
        idsPassword: 'ids-password',
      };
      return values[key] ?? defaultValue;
    });
    common = {
      fail: jest.fn((statusCode: number, message: string, extra?: any) => {
        throw { statusCode, message, ...extra };
      }),
      getServerTime: jest.fn().mockResolvedValue(fixedNow),
    };
    service = new MobileIdsService(prisma, config, common);
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
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        data: { subjectId: 'EMP001' },
      });
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
