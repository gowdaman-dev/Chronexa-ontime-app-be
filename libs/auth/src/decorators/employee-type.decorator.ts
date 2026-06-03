import { SetMetadata } from '@nestjs/common';
import { EMPLOYEE_TYPE_KEY } from '../auth.constants';

export const EmployeeType = (type: 'Professional' | 'Technical') =>
  SetMetadata(EMPLOYEE_TYPE_KEY, type);
