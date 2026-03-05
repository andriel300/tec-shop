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
  const tlsOptions = {
    key: readFileSync(join(certsPath, 'auth-service/auth-service-key.pem')),
    cert: readFileSync(join(certsPath, 'auth-service/auth-service-cert.pem')),
    ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
    requestCert: true,
    rejectUnauthorized: true,
  };

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 6001,
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

  await app.startAllMicroservices();
  const metricsPort = parseInt(process.env.AUTH_METRICS_PORT ?? '9001', 10);
  await app.listen(metricsPort, '0.0.0.0');
  Logger.log(`auth-service TCP on port 6001 with mTLS, metrics on port ${metricsPort}`);
}
bootstrap();
