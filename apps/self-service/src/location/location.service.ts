import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

const { MobileCommonService } = require('../shared/mobile-common.service');

@Injectable()
export class MobileLocationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MobileCommonService) private readonly common: any,
  ) {}

  async getMyWorkLocation(employeeId: number) {
    const employee = await this.common.getSparkEmployee(employeeId, {
      requireActive: true,
      wrongGroupStatusCode: 400,
      includeErrorCodes: true,
    });
    const serverTime = await this.common.getServerTime();
    const workLocation =
      await this.prisma.local_SparkEmployeeLocationdetailsLocal.findFirst({
        where: {
          EmployeeNumber: employee.emp_no,
          AND: [
            {
              OR: [{ FromDate: { lte: serverTime } }, { FromDate: null }],
            },
            {
              OR: [{ ToDate: { gte: serverTime } }, { ToDate: null }],
            },
          ],
        },
        select: {
          EmployeeNumber: true,
          NameEng: true,
          LocationCode: true,
          LocationEng: true,
          City: true,
          Geolocation: true,
        },
      });

    if (!workLocation) {
      return this.common.fail(404, 'No work schedule assigned for today.');
    }
    if (!workLocation.Geolocation) {
      return this.common.fail(
        404,
        'Geolocation Coordinates not available for the assigned work location, Please contact your Manager.',
      );
    }

    return {
      success: true,
      message: 'Work location details fetched successfully',
      data: workLocation,
    };
  }

  async verifyLocation(coordinates: number[]) {
    this.common.assertCoordinates(coordinates);
    const locations = await this.prisma.locations.findMany({
      select: { radius: true, geolocation: true },
    });
    if (!this.common.isWithinAnyLocation(coordinates, locations)) {
      return this.common.fail(
        403,
        'You are not within the allowed work location.',
      );
    }
    return {
      success: true,
      message:
        'Location verified successfully. You are within the allowed work location.',
    };
  }

  async verifyAssignedLocation(employeeId: number, coordinates: number[]) {
    this.common.assertCoordinates(coordinates);
    const employee = await this.common.getSparkEmployee(employeeId);
    const serverTime = await this.common.getServerTime();
    const assignedLocations =
      await this.prisma.local_SparkEmployeeLocationdetailsLocal.findMany({
        where: {
          EmployeeNumber: employee.emp_no,
          AND: [
            {
              OR: [{ FromDate: { lte: serverTime } }, { FromDate: null }],
            },
            {
              OR: [{ ToDate: { gte: serverTime } }, { ToDate: null }],
            },
          ],
        },
        select: { Radius: true, Geolocation: true },
      });
    const locationInput = assignedLocations.map((location) => ({
      radius: Number(location.Radius ?? 0) + 500000000,
      geolocation: location.Geolocation,
    }));
    if (!this.common.isWithinAnyLocation(coordinates, locationInput)) {
      return this.common.fail(
        403,
        'You are not within the allowed work location.',
      );
    }
    return {
      success: true,
      message:
        'Location verified successfully. You are within the allowed work location.',
    };
  }
}
