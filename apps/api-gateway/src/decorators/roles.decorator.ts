import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../guards/roles.guard';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for accessing an endpoint.
 * Use in combination with @UseGuards(JwtAuthGuard, RolesGuard).
 *
 * @example
 * ```typescript
 * @Post()
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('ADMIN')
 * async createCategory(@Body() dto: CreateCategoryDto) {
 *   // Only users with ADMIN role can access this
 * }
 * ```
 *
 * @param roles - One or more user roles required to access the endpoint
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
