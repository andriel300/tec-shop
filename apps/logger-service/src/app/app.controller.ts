import { Controller } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Controller()
export class AppController {
  constructor(private readonly appService: LoggerService) {}
}
