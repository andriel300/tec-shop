import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as {
      userId: string;
      username: string;
      role?: string;
      userType?: UserRole;
    };

    // User should be attached by JwtAuthGuard
    if (!user) {
      this.logger.warn('RolesGuard: No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => {
      // Check both userType and role fields for flexibility
      return user.userType === role || user.role === role;
    });

    if (!hasRole) {
      this.logger.warn(
        `Access denied for user ${user.userId}. Required: [${requiredRoles.join(
          ', '
        )}], User has: ${user.userType || user.role || 'none'}`
      );
      throw new ForbiddenException(
        'You do not have permission to access this resource'
      );
    }

    return true;
  }
}
