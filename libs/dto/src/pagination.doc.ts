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

/**
 * Creates a decorator that documents pagination query parameters.
 *
 * @returns A decorator that attaches Swagger documentation for the `limit` and `offset` query parameters.
 */
export function ApiPaginationQueryParams() {
  return applyDecorators(
    ApiQuery({ name: 'limit', type: Number, required: false, example: 20, description: 'Number of records per page' }),
    ApiQuery({ name: 'offset', type: Number, required: false, example: 1, description: 'Page number (1-based)' }),
  );
}

