import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { HoneypotService } from './honeypot.service';

/**
 * Global guard that rejects requests from IPs already in the honeypot blocklist.
 *
 * Registered as APP_GUARD before ConditionalThrottlerGuard so banned IPs are
 * dropped before any rate-limit counter is incremented — keeping throttle
 * storage clean and avoiding wasted work on known-bad actors.
 *
 * Returns 403 Forbidden for blocked IPs (different from the honeypot trap
 * path itself, which returns 200 to avoid tipping off scanners — by the time
 * a blocked IP hits a real route, there is no benefit to further deception).
 */
@Injectable()
export class BlocklistGuard implements CanActivate {
  constructor(private readonly honeypot: HoneypotService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = extractIp(req);

    if (await this.honeypot.isBlocked(ip)) {
      throw new ForbiddenException();
    }

    return true;
  }
}

function extractIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() ?? '';
  }
  return req.socket.remoteAddress ?? 'unknown';
}
