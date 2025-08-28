import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';

  app.enableCors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 6001;
  await app.listen(port);
  Logger.log(`🚀 Auth service is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
