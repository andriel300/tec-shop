import { Test } from '@nestjs/testing';
import { HoneypotMiddleware } from './honeypot.middleware';
import { HoneypotService } from './honeypot.service';
import type { Request, Response } from 'express';

const mockRes = (): jest.Mocked<Pick<Response, 'status' | 'end'>> => {
  const res = { status: jest.fn(), end: jest.fn() };
  res.status.mockReturnValue(res as unknown as Response);
  return res;
};

const mockReq = (
  path: string,
  method = 'GET',
  userAgent = 'test-agent',
  ip?: string,
): Partial<Request> => ({
  path,
  method,
  headers: { 'user-agent': userAgent },
  ip,
  socket: { remoteAddress: '127.0.0.1' } as unknown as Request['socket'],
});

describe('HoneypotMiddleware', () => {
  let middleware: HoneypotMiddleware;
  let honeypotService: jest.Mocked<HoneypotService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        HoneypotMiddleware,
        {
          provide: HoneypotService,
          useValue: {
            recordHit: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    middleware = module.get<HoneypotMiddleware>(HoneypotMiddleware);
    honeypotService = module.get(HoneypotService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Normal requests pass through ─────────────────────────────────────────

  describe('non-lure paths', () => {
    it('calls next() and does not record a hit for a normal API path', async () => {
      const req = mockReq('/api/products');
      const res = mockRes();
      const next = jest.fn();

      await middleware.use(req as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(honeypotService.recordHit).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('calls next() for root path "/"', async () => {
      const req = mockReq('/');
      const res = mockRes();
      const next = jest.fn();

      await middleware.use(req as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalled();
      expect(honeypotService.recordHit).not.toHaveBeenCalled();
    });
  });

  // ─── Exact lure path matches ───────────────────────────────────────────────

  describe('exact lure path matches', () => {
    it.each([
      ['/.env'],
      ['/wp-admin'],
      ['/wp-login.php'],
      ['/phpmyadmin'],
      ['/.git/config'],
      ['/actuator'],
      ['/xmlrpc.php'],
    ])('returns 200 and records hit for exact lure path %s', async (path) => {
      const req = mockReq(path, 'GET', 'curl/7.0', '10.0.0.1');
      const res = mockRes();
      const next = jest.fn();

      await middleware.use(req as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
      expect(honeypotService.recordHit).toHaveBeenCalledWith(
        '10.0.0.1',
        path,
        'GET',
        'curl/7.0',
      );
    });
  });

  // ─── Path normalization ────────────────────────────────────────────────────

  describe('path normalization', () => {
    it('matches uppercase variants (case-insensitive)', async () => {
      const req = mockReq('/WP-ADMIN');
      const res = mockRes();
      const next = jest.fn();

      await middleware.use(req as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('matches path with trailing slash stripped', async () => {
      const req = mockReq('/phpmyadmin/');
      const res = mockRes();
      const next = jest.fn();

      await middleware.use(req as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('matches mixed-case path with trailing slash', async () => {
      const req = mockReq('/PHPmyadmin/');
      const res = mockRes();
      const next = jest.fn();

      await middleware.use(req as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ─── Prefix subtree matching ───────────────────────────────────────────────

  describe('prefix subtree matching', () => {
    it.each([
      ['/.git/COMMIT_EDITMSG'],
      ['/.git/refs/heads/main'],
      ['/wp-content/plugins/evil.php'],
      ['/wp-includes/functions.php'],
      ['/actuator/prometheus'],
      ['/phpmyadmin/index.php'],
      ['/cgi-bin/attack.sh'],
    ])('records hit for prefix-matched subtree path %s', async (path) => {
      const req = mockReq(path);
      const res = mockRes();
      const next = jest.fn();

      await middleware.use(req as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(honeypotService.recordHit).toHaveBeenCalled();
    });
  });

  // ─── IP extraction ─────────────────────────────────────────────────────────

  describe('IP extraction', () => {
    it('uses req.ip when available', async () => {
      const req = mockReq('/wp-admin', 'GET', 'bot', '203.0.113.1');
      const res = mockRes();
      const next = jest.fn();

      await middleware.use(req as Request, res as unknown as Response, next);

      expect(honeypotService.recordHit).toHaveBeenCalledWith(
        '203.0.113.1',
        expect.any(String),
        expect.any(String),
        expect.any(String),
      );
    });

    it('falls back to socket.remoteAddress when req.ip is undefined', async () => {
      const req: Partial<Request> = {
        path: '/wp-admin',
        method: 'GET',
        headers: { 'user-agent': 'bot' },
        ip: undefined,
        socket: { remoteAddress: '192.0.2.55' } as unknown as Request['socket'],
      };
      const res = mockRes();
      const next = jest.fn();

      await middleware.use(req as Request, res as unknown as Response, next);

      expect(honeypotService.recordHit).toHaveBeenCalledWith(
        '192.0.2.55',
        expect.any(String),
        expect.any(String),
        expect.any(String),
      );
    });

    it('uses "unknown" when both req.ip and socket.remoteAddress are undefined', async () => {
      const req: Partial<Request> = {
        path: '/wp-admin',
        method: 'GET',
        headers: {},
        ip: undefined,
        socket: {} as Request['socket'],
      };
      const res = mockRes();
      const next = jest.fn();

      await middleware.use(req as Request, res as unknown as Response, next);

      expect(honeypotService.recordHit).toHaveBeenCalledWith(
        'unknown',
        expect.any(String),
        expect.any(String),
        expect.any(String),
      );
    });
  });

});
