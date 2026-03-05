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
    key: readFileSync(join(certsPath, 'order-service/order-service-key.pem')),
    cert: readFileSync(join(certsPath, 'order-service/order-service-cert.pem')),
    ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
    requestCert: true,
    rejectUnauthorized: true,
  };

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.TCP,
      options: {
        host: process.env.ORDER_SERVICE_HOST ?? 'localhost',
        port: parseInt(process.env.ORDER_SERVICE_PORT ?? '6005', 10),
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
  const metricsPort = parseInt(process.env.ORDER_METRICS_PORT ?? '9005', 10);
  await app.listen(metricsPort, '0.0.0.0');
  Logger.log(`order-service TCP on port ${process.env.ORDER_SERVICE_PORT ?? 6005} with mTLS, metrics on port ${metricsPort}`);
}

bootstrap();
