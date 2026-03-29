import { Test } from '@nestjs/testing';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { BlocklistGuard } from './honeypot.guard';
import { HoneypotService } from './honeypot.service';
import type { Request } from 'express';

const makeContext = (req: Partial<Request>): ExecutionContext =>
  ({ switchToHttp: () => ({ getRequest: () => req }) }) as unknown as ExecutionContext;

describe('BlocklistGuard', () => {
  let guard: BlocklistGuard;
  let honeypotService: jest.Mocked<HoneypotService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BlocklistGuard,
        { provide: HoneypotService, useValue: { isBlocked: jest.fn() } },
      ],
    }).compile();

    guard = module.get<BlocklistGuard>(BlocklistGuard);
    honeypotService = module.get(HoneypotService);
  });

  it('throws ForbiddenException for a blocked IP', async () => {
    honeypotService.isBlocked.mockResolvedValue(true);
    await expect(
      guard.canActivate(makeContext({ ip: '10.0.0.1', socket: {} as Request['socket'] })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns true for a non-blocked IP', async () => {
    honeypotService.isBlocked.mockResolvedValue(false);
    expect(
      await guard.canActivate(makeContext({ ip: '8.8.8.8', socket: {} as Request['socket'] })),
    ).toBe(true);
  });

  it('falls back to "unknown" when req.ip and socket.remoteAddress are both absent', async () => {
    honeypotService.isBlocked.mockResolvedValue(false);
    await guard.canActivate(makeContext({ ip: undefined, socket: {} as Request['socket'] }));
    expect(honeypotService.isBlocked).toHaveBeenCalledWith('unknown');
  });
});
