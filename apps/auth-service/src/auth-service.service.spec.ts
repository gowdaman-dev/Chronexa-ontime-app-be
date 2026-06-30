const { AuthServiceService } = require('./auth-service.service');

describe('AuthServiceService login response', () => {
  let service: any;
  let prisma: any;
  let jwtService: any;
  let cache: any;

  beforeEach(() => {
    prisma = {
      sec_users: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      user_tokens: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      employee_event_transactions: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $queryRaw: jest.fn().mockResolvedValue([
        { organization_id: 25, organization_name: 'Basatin' },
      ]),
    };
    jwtService = {
      sign: jest.fn(() => 'signed-token'),
      decode: jest.fn(),
      verify: jest.fn(),
    };
    cache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
    };
    const config = {
      get: jest.fn((key: string) =>
        key === 'accessTokenSecret' ? 'test-secret' : undefined,
      ),
    };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    const appValidator = {
      validateAppAccess: jest.fn(),
      validateMobileToken: jest.fn(),
    };

    service = new AuthServiceService(
      prisma,
      jwtService,
      config,
      cache,
      logger,
      appValidator,
    );

    jest.spyOn(service, 'hashPassword').mockImplementation(() => 'salt:hash');
    jest.spyOn(service as any, 'verifyPassword').mockReturnValue(true);
  });

  it('returns costCenter and costCode in login user payload', async () => {
    prisma.sec_users.findFirst.mockResolvedValue({
      user_id: 6520,
      login: 'manager@chronexa.ai',
      password: 'stored',
      employee_id: 74026,
      access_mobile_app: true,
      access_control_panel: true,
      employee_master: {
        employee_id: 74026,
        emp_no: 'EMP74026',
        firstname_eng: 'Test',
        lastname_eng: 'Manager',
        firstname_arb: 'Test',
        lastname_arb: 'Manager',
        email: 'manager@chronexa.ai',
        manager_flag: true,
        employee_type_id: 26,
        geofence_flag: true,
        cost_center: 'CC-IT-001',
        cost_code: 'IT-OPS',
      },
    });

    const result = await service.login('manager@chronexa.ai', 'password', 'Mozilla/5.0');

    expect(result.user).toEqual(
      expect.objectContaining({
        costCenter: 'CC-IT-001',
        costCode: 'IT-OPS',
        employeeNumber: 74026,
      }),
    );
  });
});
