import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { readFileSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  // Load mTLS certificates
  const certsPath = join(__dirname, '../../../../certs');
  const tlsOptions = {
    key: readFileSync(join(certsPath, 'auth-service/auth-service-key.pem')),
    cert: readFileSync(join(certsPath, 'auth-service/auth-service-cert.pem')),
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
        port: 6001,
        tlsOptions,
      },
    }
  );
  app.useLogger(app.get(PinoLogger));
  app.useGlobalPipes(new ValidationPipe());
  await app.listen();
  Logger.log('🚀 Application auth-service is running on TCP port 6001 with mTLS');
}
bootstrap();
