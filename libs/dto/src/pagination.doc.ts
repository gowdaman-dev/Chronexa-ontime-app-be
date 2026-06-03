import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiQuery } from '@nestjs/swagger';

export function ApiPaginatedResponse(dataType: string) {
  return applyDecorators(
    ApiProperty({
      example: {
        success: true,
        data: [],
        total: 0,
        hasNext: false,
      },
      description: `Paginated list of ${dataType}`,
    }),
  );
}

export function ApiPaginationQueryParams() {
  return applyDecorators(
    ApiQuery({ name: 'limit', type: Number, required: false, example: 20, description: 'Number of records per page' }),
    ApiQuery({ name: 'offset', type: Number, required: false, example: 0, description: 'Number of records to skip' }),
  );
}

