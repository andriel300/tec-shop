import { Module } from '@nestjs/common';
import { SecuritySignalController } from './security-signal.controller';
import { SecuritySignalService } from './security-signal.service';

// LogProducerModule is @Global() — LogProducerService is injectable without importing the module.

@Module({
  controllers: [SecuritySignalController],
  providers: [SecuritySignalService],
})
export class SecuritySignalModule {}
