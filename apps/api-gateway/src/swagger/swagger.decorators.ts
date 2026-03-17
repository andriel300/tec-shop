import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';

/**
 * Applies JWT bearer auth + standard 401/403 responses.
 * Use on any controller or endpoint that requires authentication.
 *
 * @example
 * @ApiAuth()
 * @Get('profile')
 * getProfile() {}
 */
export const ApiAuth = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' }),
    ApiForbiddenResponse({ description: 'Insufficient permissions' }),
  );

/**
 * Documents a paginated list response with a typed data array.
 *
 * @example
 * @ApiPaginatedResponse(ProductEntity)
 * @Get()
 * findAll() {}
 */
export const ApiPaginatedResponse = <T extends Type<unknown>>(model: T) =>
  applyDecorators(
    ApiOkResponse({
      schema: {
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Success' },
          data: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: getSchemaPath(model) } },
              total: { type: 'number', example: 100 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 20 },
            },
          },
        },
      },
    }),
  );

/**
 * Documents a single-item response with a typed data object.
 *
 * @example
 * @ApiSingleResponse(UserEntity)
 * @Get(':id')
 * findOne() {}
 */
export const ApiSingleResponse = <T extends Type<unknown>>(model: T) =>
  applyDecorators(
    ApiOkResponse({
      schema: {
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Success' },
          data: { $ref: getSchemaPath(model) },
        },
      },
    }),
  );

/**
 * Applies standard 404 + 500 responses.
 * Combine with @ApiAuth() for full authenticated-endpoint coverage.
 *
 * @example
 * @ApiAuth()
 * @ApiStandardErrors()
 * @Get(':id')
 * findOne() {}
 */
export const ApiStandardErrors = () =>
  applyDecorators(
    ApiNotFoundResponse({ description: 'Resource not found' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );
