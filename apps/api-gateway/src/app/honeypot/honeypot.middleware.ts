import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HoneypotService } from './honeypot.service';
import { HONEYPOT_LURE_PATHS } from './honeypot.config';

@Injectable()
export class HoneypotMiddleware implements NestMiddleware {
  constructor(private readonly honeypot: HoneypotService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!HONEYPOT_LURE_PATHS.has(req.path)) {
      next();
      return;
    }

    const ip = extractIp(req);
    const userAgent = req.headers['user-agent'] ?? '';

    // Non-blocking: ban + log happen in background, response is sent immediately
    void this.honeypot.recordHit(ip, req.path, req.method, userAgent);

    // Return a convincing 200 so the scanner cannot tell it was detected.
    // Never return 401/403 here — those are tells that we reacted to the probe.
    res.status(200).end();
  }
}

function extractIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() ?? '';
  }
  return req.socket.remoteAddress ?? 'unknown';
}
