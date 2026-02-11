import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger as PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  // Load mTLS certificates
  const certsPath = join(process.cwd(), 'certs');
  const tlsOptions = {
    key: readFileSync(
      join(certsPath, 'recommendation-service/recommendation-service-key.pem')
    ),
    cert: readFileSync(
      join(certsPath, 'recommendation-service/recommendation-service-cert.pem')
    ),
    ca: readFileSync(join(certsPath, 'ca/ca-cert.pem')),
    requestCert: true,
    rejectUnauthorized: true,
  };

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.RECOMMENDATION_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.RECOMMENDATION_SERVICE_PORT || '6009', 10),
        tlsOptions,
      },
    }
  );

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

  await app.listen();
  Logger.log(
    `Recommendation Service is running on TCP port ${
      process.env.RECOMMENDATION_SERVICE_PORT || 6009
    } with mTLS`
  );
}

bootstrap();
