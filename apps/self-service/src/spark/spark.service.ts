import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

const { MobileCommonService } = require('../shared/mobile-common.service');

@Injectable()
export class MobileSparkService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MobileCommonService) private readonly common: any,
  ) {}

  async getSparkTodayLocation(employeeId: number) {
    const employee = await this.common.getSparkEmployee(employeeId);
    const now = new Date();
    const todayLocation =
      await this.prisma.local_SparkEmployeeLocationdetailsLocal.findFirst({
        where: {
          EmployeeNumber: employee.emp_no,
          AND: [
            {
              OR: [{ FromDate: null }, { FromDate: { lte: now } }],
            },
            {
              OR: [{ ToDate: null }, { ToDate: { gte: now } }],
            },
          ],
        },
        select: {
          EmployeeNumber: true,
          Radius: true,
          Geolocation: true,
        },
        orderBy: { FromDate: 'desc' },
      });

    if (!todayLocation) {
      this.common.fail(404, 'No location data found for today');
    }

    return {
      message: 'Current location data for employee',
      data: {
        ...todayLocation,
        Radius: '5000000',
      },
    };
  }
}
