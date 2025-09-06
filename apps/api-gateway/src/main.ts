import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const globalPrefix = 'api/v1';

  app.enableCors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  app.use(helmet());

  app.use(cookieParser());
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));
  app.set('trust proxy', 1);

  const config = new DocumentBuilder()
    .setTitle('Tec-Shop API')
    .setDescription('The Tec-Shop API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.use("/", createProxyMiddleware({
    target: 'http://localhost:6001',
    changeOrigin: true,
  }))

  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 8080;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
