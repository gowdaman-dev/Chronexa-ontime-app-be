import { RpcException } from '@nestjs/microservices';

const { MobileSparkService } = require('./spark.service');

describe('MobileSparkService', () => {
  let prisma: any;
  let common: any;
  let service: any;

  beforeEach(() => {
    prisma = {
      local_SparkEmployeeLocationdetailsLocal: {
        findFirst: jest.fn(),
      },
    };
    common = {
      getSparkEmployee: jest.fn(),
      fail: jest.fn((statusCode: number, message: string) => {
        throw new RpcException({ statusCode, message });
      }),
    };
    service = new MobileSparkService(prisma, common);
  });

  it('returns Spark today location with legacy radius override', async () => {
    common.getSparkEmployee.mockResolvedValue({ emp_no: 'E001' });
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
    common.getSparkEmployee.mockResolvedValue({ emp_no: 'E001' });
    prisma.local_SparkEmployeeLocationdetailsLocal.findFirst.mockResolvedValue(null);

    await expect(service.getSparkTodayLocation(123)).rejects.toBeInstanceOf(
      RpcException,
    );
  });
});
