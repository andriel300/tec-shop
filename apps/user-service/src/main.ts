import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { readFileSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 6002,
        tlsOptions: {
          key: readFileSync('./certs/server.key'),
          cert: readFileSync('./certs/server.crt'),
          ca: readFileSync('./certs/ca.crt'),
          requestCert: true,
          rejectUnauthorized: true,
        },
      },
    }
  );
  app.useGlobalPipes(new ValidationPipe());
  await app.listen();
  Logger.log('🚀 Application user-service is running on TCP port 6002');
}
bootstrap();
