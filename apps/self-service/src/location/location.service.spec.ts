import { RpcException } from '@nestjs/microservices';

const { MobileLocationService } = require('./location.service');

describe('MobileLocationService', () => {
  const fixedNow = new Date('2026-05-02T10:00:00.000Z');
  let prisma: any;
  let common: any;
  let service: any;

  beforeEach(() => {
    prisma = {
      locations: {
        findMany: jest.fn(),
      },
      local_SparkEmployeeLocationdetailsLocal: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };
    common = {
      assertCoordinates: jest.fn((coordinates: number[]) => {
        if (!Array.isArray(coordinates) || coordinates.length !== 2) {
          throw new RpcException({ statusCode: 400, message: 'Invalid coordinates' });
        }
      }),
      fail: jest.fn((statusCode: number, message: string) => {
        throw new RpcException({ statusCode, message });
      }),
      getServerTime: jest.fn().mockResolvedValue(fixedNow),
      getSparkEmployee: jest.fn(),
      isWithinAnyLocation: jest.fn(),
    };
    service = new MobileLocationService(prisma, { get: () => 5000 }, common);
  });

  it('verifies coordinates inside any configured work location', async () => {
    prisma.locations.findMany.mockResolvedValue([
      { radius: 100, geolocation: '25.2048,55.2708' },
    ]);
    common.isWithinAnyLocation.mockReturnValue(true);

    await expect(service.verifyLocation([25.2048, 55.2708])).resolves.toEqual({
      success: true,
      message:
        'Location verified successfully. You are within the allowed work location.',
    });
  });

  it('rejects invalid coordinate payloads', async () => {
    await expect(service.verifyLocation([25.2048])).rejects.toBeInstanceOf(
      RpcException,
    );
  });

  it('returns assigned work location for active Spark employees', async () => {
    common.getSparkEmployee.mockResolvedValue({ emp_no: 'E001' });
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

  it('verifies assigned location using assigned Spark locations', async () => {
    common.getSparkEmployee.mockResolvedValue({ emp_no: 'E001' });
    prisma.local_SparkEmployeeLocationdetailsLocal.findMany.mockResolvedValue([
      { Radius: '100', Geolocation: '25.2048,55.2708' },
    ]);
    common.isWithinAnyLocation.mockReturnValue(true);

    await expect(
      service.verifyAssignedLocation(123, [25.2048, 55.2708]),
    ).resolves.toEqual({
      success: true,
      message:
        'Location verified successfully. You are within the allowed work location.',
    });
  });
});
