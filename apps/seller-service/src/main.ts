// Initialize Sentry FIRST before any other imports
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
  // Load mTLS certificates
  const certsPath = join(process.cwd(), 'certs');
  const tlsOptions = {
    key: readFileSync(join(certsPath, 'seller-service/seller-service-key.pem')),
    cert: readFileSync(join(certsPath, 'seller-service/seller-service-cert.pem')),
    ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
    requestCert: true,
    rejectUnauthorized: true,
  };

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 6003,
        tlsOptions,
      },
    }
  );
  app.useLogger(app.get(PinoLogger));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Strip non-whitelisted properties
    forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
    transform: true,           // Transform payloads to DTO instances
    disableErrorMessages: process.env.NODE_ENV === 'production', // Hide validation details in production
    validationError: {
      target: false,           // Don't expose target object
      value: false,           // Don't expose submitted values
    },
  }));
  await app.listen();
  Logger.log('🚀 Seller-service is running on TCP port 6003 with mTLS');
}
bootstrap();
