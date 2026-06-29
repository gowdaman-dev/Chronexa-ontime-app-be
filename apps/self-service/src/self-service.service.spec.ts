import { SelfServiceService } from './self-service.service';

describe('SelfServiceService IDS punch', () => {
  const fixedNow = new Date('2026-05-02T10:00:00.000Z');
  let prisma: any;
  let idsHttp: any;
  let logger: any;
  let service: SelfServiceService;

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ time: fixedNow }]),
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
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };
    service = new SelfServiceService(prisma, idsHttp, logger);
  });

  it('creates an employee transaction after IDS 1:N identification succeeds', async () => {
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

    expect(idsHttp.login).toHaveBeenCalled();
    expect(idsHttp.requestJson).toHaveBeenNthCalledWith(
      1,
      'POST',
      'https://ids.local/api/v2.0/identify?liveness=true',
      expect.objectContaining({
        samples: [
          expect.objectContaining({
            data: Buffer.from('image').toString('base64'),
          }),
        ],
      }),
      expect.any(Object),
    );
  });
});
