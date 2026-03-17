import { initializeTracing } from '@tec-shop/tracing';
initializeTracing('admin-service');

import { initializeSentryForService } from './instrumentation';
initializeSentryForService('admin-service', process.env['ADMIN_SERVICE_PORT'] ?? '6006');

import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger as PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  // Load mTLS certificates
  const certsPath = join(process.cwd(), 'certs');
  const tlsOptions = {
    key: readFileSync(join(certsPath, 'admin-service/admin-service-key.pem')),
    cert: readFileSync(join(certsPath, 'admin-service/admin-service-cert.pem')),
    ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
    requestCert: true,
    rejectUnauthorized: true,
  };

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.TCP,
      options: {
        host: process.env.ADMIN_SERVICE_HOST ?? 'localhost',
        port: parseInt(process.env.ADMIN_SERVICE_PORT ?? '6006', 10),
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

  const gracefulShutdown = async (signal: string) => {
    Logger.log(`Received ${signal}, starting graceful shutdown`, 'Bootstrap');
    const forceExit = setTimeout(() => {
      Logger.error('Forced exit after 30s timeout', undefined, 'Bootstrap');
      process.exit(1);
    }, 30_000);
    forceExit.unref();
    await app.close();
    clearTimeout(forceExit);
  };
  process.once('SIGTERM', () => { void gracefulShutdown('SIGTERM'); });
  process.once('SIGINT', () => { void gracefulShutdown('SIGINT'); });

  await app.startAllMicroservices();
  const metricsPort = parseInt(process.env.ADMIN_METRICS_PORT ?? '9006', 10);
  await app.listen(metricsPort, '0.0.0.0');
  Logger.log(`admin-service TCP on port ${process.env.ADMIN_SERVICE_PORT ?? 6006} with mTLS, metrics on port ${metricsPort}`);
}

process.on('unhandledRejection', (reason, promise) => {
  Logger.error(`Unhandled Rejection at: ${String(promise)}, reason: ${String(reason)}`, undefined, 'Bootstrap');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception', error instanceof Error ? error.stack : String(error), 'Bootstrap');
  process.exit(1);
});

bootstrap();
