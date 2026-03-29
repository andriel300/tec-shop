import { Test } from '@nestjs/testing';
import { SecuritySignalService } from './security-signal.service';
import { LogProducerService } from '@tec-shop/logger-producer';
import { LogCategory, SecuritySignalType } from '@tec-shop/dto';
import type { Request } from 'express';

describe('SecuritySignalService', () => {
  let service: SecuritySignalService;
  let logProducer: jest.Mocked<LogProducerService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SecuritySignalService,
        {
          provide: LogProducerService,
          useValue: {
            warn: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<SecuritySignalService>(SecuritySignalService);
    logProducer = module.get(LogProducerService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── record ────────────────────────────────────────────────────────────────

  describe('record', () => {
    it('emits a SECURITY log event with type and ip', async () => {
      await service.record(SecuritySignalType.DEVTOOLS_OPEN, '1.2.3.4');

      expect(logProducer.warn).toHaveBeenCalledWith(
        'api-gateway',
        LogCategory.SECURITY,
        `Client security signal: ${SecuritySignalType.DEVTOOLS_OPEN}`,
        expect.objectContaining({
          metadata: expect.objectContaining({
            ip: '1.2.3.4',
            type: SecuritySignalType.DEVTOOLS_OPEN,
          }),
        }),
      );
    });

    it('spreads optional metadata into the log payload', async () => {
      await service.record(SecuritySignalType.BOT_DETECTED, '5.5.5.5', {
        signals: ['webdriver', 'no-plugins'],
      });

      expect(logProducer.warn).toHaveBeenCalledWith(
        'api-gateway',
        LogCategory.SECURITY,
        expect.any(String),
        expect.objectContaining({
          metadata: expect.objectContaining({
            signals: ['webdriver', 'no-plugins'],
          }),
        }),
      );
    });

    it('works without optional metadata', async () => {
      await expect(
        service.record(SecuritySignalType.AUTOMATION_DETECTED, '9.9.9.9'),
      ).resolves.toBeUndefined();
    });
  });

  // ─── extractIp ─────────────────────────────────────────────────────────────

  describe('extractIp', () => {
    it('returns req.ip when set', () => {
      const req = {
        ip: '172.16.0.1',
        socket: { remoteAddress: '10.0.0.1' },
      } as unknown as Request;
      expect(service.extractIp(req)).toBe('172.16.0.1');
    });

    it('falls back to socket.remoteAddress when req.ip is undefined', () => {
      const req = {
        ip: undefined,
        socket: { remoteAddress: '10.0.0.2' },
      } as unknown as Request;
      expect(service.extractIp(req)).toBe('10.0.0.2');
    });

    it('returns "unknown" when both are undefined', () => {
      const req = {
        ip: undefined,
        socket: {},
      } as unknown as Request;
      expect(service.extractIp(req)).toBe('unknown');
    });
  });
});
