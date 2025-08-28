import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app/app.module';

async function bootstrap() {
  // Creates the core NestJS application and explicitly types it to use
  // Express under the hood, giving us access to the raw Express instance.
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const globalPrefix = 'api';

  // Defines which front-end origins are allowed to talk to this API.
  // This is our first line of defense against cross-site request forgery (CSRF).
  // The 'credentials' true setting is crucial for allowing cookies to be sent.
  app.enableCors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  // Middleware stack: These are like security guards and bouncers for incoming requests.
  // They process every single request before it even reaches our controllers.
  app.use(cookieParser()); // Parses incoming cookies from the browser into a nice object
  app.use(json({ limit: '100mb' })); // Parses JSON payloads, allowing large file uploads
  app.use(urlencoded({ extended: true, limit: '100mb' })); // Parses URL-encoded form data
  app.set('trust proxy', 1); // Crucial for deployments: tells Express to trust headers from proxies (like NGINX, Heroku) to get the real client IP

  // API Documentation setup using Swagger/OpenAPI.
  // This automatically generates a live, interactive API explorer.
  const config = new DocumentBuilder()
    .setTitle('Tec-Shop API')
    .setDescription('The Tec-Shop API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Makes the interactive docs available at the '/api/docs' endpoint
  SwaggerModule.setup('api/docs', app, document);

  // Sets up a proxy to forward any unmatched requests to another service.
  // This is a common pattern for microservices or when serving a separate frontend.
  app.use("/", createProxyMiddleware({
    target: 'http://localhost:6001',
    changeOrigin: true, // Changes the 'Origin' header to the target's URL for CORS purposes
  }))

  // Prepends '/api' to all our routes. This is great for versioning
  // and separating API routes from other potential frontend routes.
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 8080;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
