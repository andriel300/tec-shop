import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api/v1';

  app.enableCors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Tec-Shop Auth Service')
    .setDescription('API for authentication and user management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 6001;

  await app.listen(port);

  Logger.log(
    `🚀 Auth service is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
