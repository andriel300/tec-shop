import { initializeTracing } from '@tec-shop/tracing';
initializeTracing('auth-service');

// Initialize Sentry before any other imports
import { initializeSentry } from './instrumentation';
initializeSentry('auth-service', 6001);

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
  let tlsOptions: { key: Buffer; cert: Buffer; ca: Buffer; requestCert: boolean; rejectUnauthorized: boolean };
  try {
    tlsOptions = {
      key: readFileSync(join(certsPath, 'auth-service/auth-service-key.pem')),
      cert: readFileSync(join(certsPath, 'auth-service/auth-service-cert.pem')),
      ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
      requestCert: true,
      rejectUnauthorized: true,
    };
  } catch (error) {
    Logger.error(
      '[mTLS] Failed to load auth-service certificates. Run ./generate-certs.sh --service auth-service',
      error instanceof Error ? error.message : String(error),
      'Bootstrap',
    );
    process.exit(1);
  }

  const tcpPort = parseInt(process.env.AUTH_SERVICE_PORT ?? '6001', 10);
  const tcpHost = process.env.AUTH_SERVICE_HOST ?? 'localhost';

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.TCP,
      options: {
        host: tcpHost,
        port: tcpPort,
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
  const metricsPort = parseInt(process.env.AUTH_METRICS_PORT ?? '9001', 10);
  await app.listen(metricsPort, '0.0.0.0');
  Logger.log(`auth-service TCP on port ${tcpPort} with mTLS, metrics on port ${metricsPort}`);
}
bootstrap();
