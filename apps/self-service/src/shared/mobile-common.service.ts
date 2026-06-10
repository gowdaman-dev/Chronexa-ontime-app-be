import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@app/prisma';
import { AppLoggerService } from '@app/common';

@Injectable()
export class MobileCommonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  fail(statusCode: number, message: string, extra?: Record<string, any>): never {
    const meta = { statusCode, ...extra };
    if (statusCode >= 500) {
      this.logger.error('Mobile self-service error', { message, ...meta });
    } else {
      this.logger.warn('Mobile self-service request rejected', {
        message,
        ...meta,
      });
    }
    throw new RpcException({ statusCode, message, ...extra });
  }

  async getServerTime(): Promise<Date> {
    const rows = await this.prisma.$queryRaw<
      { time: Date }[]
    >`SELECT GETDATE() AS time;`;
    return rows?.[0]?.time ?? new Date();
  }

  assertEmployeeId(employeeId: number): void {
    if (!Number.isFinite(employeeId)) {
      this.fail(400, 'Invalid employee ID');
    }
  }

  assertCoordinates(
    coordinates: number[],
  ): asserts coordinates is [number, number] {
    if (
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      !coordinates.every((coordinate) => Number.isFinite(coordinate))
    ) {
      this.fail(
        400,
        'Invalid coordinates format. Expected an array of [latitude, longitude].',
      );
    }
  }

  isWithinAnyLocation(
    coordinates: [number, number],
    locations: Array<{
      radius?: number | string | null;
      geolocation?: string | null;
    }>,
  ): boolean {
    const [targetLat, targetLon] = coordinates;
    const processed = locations
      .map((location) => {
        if (!location.geolocation) return null;
        const [rawLat, rawLon] = location.geolocation.split(',');
        const latitude = Number.parseFloat(rawLat?.trim() ?? '');
        const longitude = Number.parseFloat(rawLon?.trim() ?? '');
        const radius = Number(location.radius ?? 0);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }
        return {
          latitude,
          longitude,
          radius: Number.isFinite(radius) ? radius : 0,
        };
      })
      .filter(Boolean) as Array<{
      latitude: number;
      longitude: number;
      radius: number;
    }>;

    return processed.some((location) => {
      const distance = this.distanceInMeters(
        targetLat,
        targetLon,
        location.latitude,
        location.longitude,
      );
      return distance <= location.radius;
    });
  }

  async getSparkEmployee(
    employeeId: number,
    options: {
      requireActive?: boolean;
      wrongGroupStatusCode?: number;
      includeErrorCodes?: boolean;
    } = {},
  ) {
    this.assertEmployeeId(employeeId);
    const employee = await this.prisma.employee_master.findUnique({
      where: { employee_id: employeeId },
      select: {
        active_flag: true,
        organization_id: true,
        employee_type_id: true,
        emp_no: true,
      },
    });

    if (!employee || (options.requireActive && !employee.active_flag)) {
      this.fail(404, 'Employee not found or inactive', {
        ...(options.includeErrorCodes
          ? {
              error: 'Employee not found or inactive',
              error_code: 'EMPLOYEE_NOT_FOUND_OR_INACTIVE',
            }
          : {}),
      });
    }
    if (!employee.emp_no) {
      this.fail(404, 'Employee not found', {
        ...(options.includeErrorCodes
          ? { error: 'Employee not found', error_code: 'EMPLOYEE_NOT_FOUND' }
          : {}),
      });
    }
    if (employee.organization_id !== 27 || employee.employee_type_id !== 26) {
      const message =
        'Employee does not belong to the required organization or employee type';
      this.fail(options.wrongGroupStatusCode ?? 403, message, {
        ...(options.includeErrorCodes
          ? { error: message, error_code: 'EMPLOYEE_NOT_IN_REQUIRED_GROUP' }
          : {}),
      });
    }
    return employee;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private distanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const earthRadiusMeters = 6371000;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
  }
}
