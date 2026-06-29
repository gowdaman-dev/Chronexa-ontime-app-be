const { MobileIdsService } = require('./ids.service');

describe('MobileIdsService', () => {
  const fixedNow = new Date('2026-05-02T10:00:00.000Z');
  let prisma: any;
  let idsHttp: any;
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
    idsHttp = {
      getBaseUrl: jest.fn().mockReturnValue('https://ids.local/api/v2.0'),
      login: jest.fn().mockResolvedValue('session-1'),
      requestJson: jest.fn(),
    };
    common = {
      fail: jest.fn((statusCode: number, message: string, extra?: any) => {
        throw { statusCode, message, ...extra };
      }),
      getServerTime: jest.fn().mockResolvedValue(fixedNow),
    };
    service = new MobileIdsService(prisma, idsHttp, common);
  });

  it('uses IDS verify-encounter for 1:1 verification', async () => {
    idsHttp.requestJson
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

    expect(idsHttp.requestJson).toHaveBeenNthCalledWith(
      1,
      'POST',
      'https://ids.local/api/v2.0/verify-encounter?liveness=true',
      expect.objectContaining({ subjectId: 'EMP001' }),
      expect.any(Object),
    );
  });
});
