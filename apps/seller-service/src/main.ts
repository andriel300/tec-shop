import { initializeTracing } from '@tec-shop/tracing';
initializeTracing('seller-service');

// Initialize Sentry before any other imports
import { initializeSentry } from './instrumentation';
initializeSentry('seller-service', 6003);

import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { readFileSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  // Load mTLS certificates
  const certsPath = join(process.cwd(), 'certs');
  const tlsOptions = {
    key: readFileSync(join(certsPath, 'seller-service/seller-service-key.pem')),
    cert: readFileSync(join(certsPath, 'seller-service/seller-service-cert.pem')),
    ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
    requestCert: true,
    rejectUnauthorized: true,
  };

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.TCP,
      options: {
        host: process.env.SELLER_SERVICE_HOST ?? 'localhost',
        port: parseInt(process.env.SELLER_SERVICE_PORT ?? '6003', 10),
        tlsOptions,
      },
    },
    { inheritAppConfig: true },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  app.enableShutdownHooks();
  await app.startAllMicroservices();
  const metricsPort = parseInt(process.env.SELLER_METRICS_PORT ?? '9003', 10);
  await app.listen(metricsPort, '0.0.0.0');
  Logger.log(`seller-service TCP on port ${process.env.SELLER_SERVICE_PORT ?? 6003} with mTLS, metrics on port ${metricsPort}`);
}
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();
