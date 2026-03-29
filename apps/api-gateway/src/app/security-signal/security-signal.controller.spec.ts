import { Test, TestingModule } from '@nestjs/testing';
import { SecuritySignalController } from './security-signal.controller';
import { SecuritySignalService } from './security-signal.service';
import { SecuritySignalDto, SecuritySignalType } from '@tec-shop/dto';
import type { Request } from 'express';

describe('SecuritySignalController', () => {
  let controller: SecuritySignalController;
  let service: jest.Mocked<SecuritySignalService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecuritySignalController],
      providers: [
        {
          provide: SecuritySignalService,
          useValue: {
            extractIp: jest.fn().mockReturnValue('1.2.3.4'),
            record: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<SecuritySignalController>(SecuritySignalController);
    service = module.get(SecuritySignalService);
  });

  it('extracts IP from request and delegates to SecuritySignalService', async () => {
    const dto: SecuritySignalDto = {
      type: SecuritySignalType.DEVTOOLS_OPEN,
      metadata: { method: 'getter' },
    };
    const req = { ip: '1.2.3.4' } as Request;

    await controller.handleSignal(dto, req);

    expect(service.extractIp).toHaveBeenCalledWith(req);
    expect(service.record).toHaveBeenCalledWith(
      SecuritySignalType.DEVTOOLS_OPEN,
      '1.2.3.4',
      { method: 'getter' },
    );
  });

  it('returns undefined (HTTP 204)', async () => {
    const dto: SecuritySignalDto = { type: SecuritySignalType.BOT_DETECTED };
    expect(await controller.handleSignal(dto, {} as Request)).toBeUndefined();
  });
});
