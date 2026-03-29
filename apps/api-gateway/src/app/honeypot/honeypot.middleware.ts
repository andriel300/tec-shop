import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HoneypotService } from './honeypot.service';
import { HONEYPOT_LURE_PATHS, HONEYPOT_LURE_PREFIXES, normalizePath } from './honeypot.config';

@Injectable()
export class HoneypotMiddleware implements NestMiddleware {
  constructor(private readonly honeypot: HoneypotService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const normalized = normalizePath(req.path);

    const isLure =
      HONEYPOT_LURE_PATHS.has(normalized) ||
      HONEYPOT_LURE_PREFIXES.some((prefix) => normalized.startsWith(prefix));

    if (!isLure) {
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
  // req.ip is resolved by Express using the trusted proxy chain set via
  // app.set('trust proxy', 1) in main.ts — safe against X-Forwarded-For spoofing.
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}
