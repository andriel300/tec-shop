import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

const makeContext = (
  user: object | undefined,
  requiredRoles?: string[],
): ExecutionContext => {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    __requiredRoles: requiredRoles,
  } as unknown as ExecutionContext;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── No roles required ─────────────────────────────────────────────────────

  describe('when no roles are required on the endpoint', () => {
    it('returns true (open endpoint)', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = makeContext({ userId: 'x', userType: 'CUSTOMER' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true for an empty roles array', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      const ctx = makeContext({ userId: 'x', userType: 'CUSTOMER' });

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  // ─── User has required role (userType field) ───────────────────────────────

  describe('when user has the required role via userType', () => {
    it('returns true for a matching SELLER role', () => {
      reflector.getAllAndOverride.mockReturnValue(['SELLER']);
      const ctx = makeContext({ userId: 'u1', userType: 'SELLER' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true for a matching ADMIN role', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const ctx = makeContext({ userId: 'u2', userType: 'ADMIN' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when user has one of multiple accepted roles', () => {
      reflector.getAllAndOverride.mockReturnValue(['SELLER', 'ADMIN']);
      const ctx = makeContext({ userId: 'u3', userType: 'ADMIN' });

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  // ─── User has required role (role field) ──────────────────────────────────

  describe('when user has the required role via role field', () => {
    it('returns true when role field matches', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const ctx = makeContext({ userId: 'u4', role: 'ADMIN' });

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  // ─── User does not have required role ─────────────────────────────────────

  describe('when user lacks the required role', () => {
    it('throws ForbiddenException for a CUSTOMER accessing SELLER endpoint', () => {
      reflector.getAllAndOverride.mockReturnValue(['SELLER']);
      const ctx = makeContext({ userId: 'u5', userType: 'CUSTOMER' });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for a SELLER accessing ADMIN endpoint', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const ctx = makeContext({ userId: 'u6', userType: 'SELLER' });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user has neither userType nor role set', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const ctx = makeContext({ userId: 'u7' });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  // ─── No user in request ────────────────────────────────────────────────────

  describe('when request has no user', () => {
    it('throws ForbiddenException with "Authentication required"', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const ctx = makeContext(undefined);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  // ─── Reflector receives correct metadata key ───────────────────────────────

  describe('metadata key', () => {
    it('queries the ROLES_KEY metadata from the reflector', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = makeContext({ userId: 'x', userType: 'CUSTOMER' });

      guard.canActivate(ctx);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        ROLES_KEY,
        [ctx.getHandler(), ctx.getClass()],
      );
    });
  });
});
