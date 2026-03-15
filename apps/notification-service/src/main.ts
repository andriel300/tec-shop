import { initializeTracing } from '@tec-shop/tracing';
initializeTracing('notification-service');

import { initializeSentry } from './instrumentation';
initializeSentry(
  'notification-service',
  process.env.NOTIFICATION_SERVICE_PORT ?? '6012'
);

import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger as PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const certsPath = join(process.cwd(), 'certs');
  const certPath = join(
    certsPath,
    'notification-service/notification-service-cert.pem'
  );
  const keyPath = join(
    certsPath,
    'notification-service/notification-service-key.pem'
  );
  const caPath = join(certsPath, 'ca/ca-cert.pem');

  let tlsCerts: { key: Buffer; cert: Buffer; ca: Buffer };
  try {
    tlsCerts = {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
      ca: readFileSync(caPath),
    };
  } catch (error) {
    Logger.error(
      '[mTLS] Failed to load notification-service certificates. Run ./generate-certs.sh --service notification-service',
      error instanceof Error ? error.message : String(error),
      'Bootstrap',
    );
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  app.useLogger(app.get(PinoLogger));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
      validationError: { target: false, value: false },
    })
  );

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:4200',
    ],
    credentials: true,
  });

  const tcpPort = parseInt(process.env.NOTIFICATION_SERVICE_TCP_PORT || '6014', 10);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.NOTIFICATION_SERVICE_HOST || 'localhost',
      port: tcpPort,
      tlsOptions: {
        ...tlsCerts,
        requestCert: true,
        rejectUnauthorized: true,
      },
    },
  });

  app.enableShutdownHooks();
  await app.startAllMicroservices();

  const httpPort = parseInt(
    process.env.NOTIFICATION_SERVICE_PORT || '6012',
    10
  );
  await app.listen(httpPort);

  Logger.log(`Notification Service HTTP/WebSocket running on port ${httpPort}`);
  Logger.log(`Notification Service TCP running on port ${tcpPort} with mTLS`);
}

bootstrap();
