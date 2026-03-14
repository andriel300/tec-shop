import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Extends ThrottlerGuard to bypass rate limiting when LOAD_TEST=true in .env.
 *
 * The bypass is evaluated at request time (inside canActivate), after
 * ConfigModule has loaded the .env file — so process.env['LOAD_TEST'] is
 * reliably populated here, unlike @Throttle() decorators which are evaluated
 * at module load time before dotenv runs.
 *
 * Usage: replace ThrottlerGuard with ConditionalThrottlerGuard in APP_GUARD.
 * The @Throttle() decorators on each endpoint remain unchanged and are fully
 * enforced when LOAD_TEST is unset or false.
 *
 * Safety: LOAD_TEST=true is rejected at startup when NODE_ENV=production.
 * See main.ts bootstrap() for the fail-fast guard.
 */
@Injectable()
export class ConditionalThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(ConditionalThrottlerGuard.name);

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env['LOAD_TEST'] === 'true') {
      this.logger.warn('Rate limiting BYPASSED — LOAD_TEST=true is active');
      return true;
    }
    return super.canActivate(context);
  }
}
