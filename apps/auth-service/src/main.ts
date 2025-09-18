import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 6001,
      },
    }
  );
  app.useLogger(app.get(PinoLogger));
  app.useGlobalPipes(new ValidationPipe());
  await app.listen();
  Logger.log('🚀 Application auth-service is running on TCP port 6001');
}
bootstrap();
