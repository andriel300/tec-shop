import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Logger as PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const certsPath = join(process.cwd(), 'certs');
  const certPath = join(certsPath, 'logger-service/logger-service-cert.pem');
  const keyPath = join(certsPath, 'logger-service/logger-service-key.pem');
  const caPath = join(certsPath, 'ca/ca-cert.pem');

  const useTls =
    existsSync(certPath) && existsSync(keyPath) && existsSync(caPath);

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
      validationError: {
        target: false,
        value: false,
      },
    })
  );

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4200',
    ],
    credentials: true,
  });

  const tcpOptions: {
    host: string;
    port: number;
    tlsOptions?: {
      key: Buffer;
      cert: Buffer;
      ca: Buffer;
      requestCert: boolean;
      rejectUnauthorized: boolean;
    };
  } = {
    host: process.env.LOGGER_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.LOGGER_SERVICE_TCP_PORT || '6011', 10),
  };

  if (useTls) {
    tcpOptions.tlsOptions = {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
      ca: readFileSync(caPath),
      requestCert: true,
      rejectUnauthorized: true,
    };
  }

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: tcpOptions,
  });

  await app.startAllMicroservices();

  const httpPort = parseInt(process.env.LOGGER_SERVICE_PORT || '6008', 10);
  await app.listen(httpPort);

  Logger.log(
    `Logger Service HTTP/WebSocket server running on port ${httpPort}`
  );
  Logger.log(
    `Logger Service TCP microservice running on port ${tcpOptions.port}${
      useTls ? ' with mTLS' : ''
    }`
  );
}

bootstrap();
