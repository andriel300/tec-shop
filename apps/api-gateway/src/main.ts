/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  // Configure cookie parser for secure authentication
  app.use(cookieParser());

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: [
      'http://localhost:3000', // user-ui
      'http://localhost:3001', // seller-ui
    ],
    credentials: true // Allow cookies to be sent with cross-origin requests
  });

  // Enhanced security headers with Content Security Policy
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Needed for Tailwind CSS and styled-components
          "https:", // Allow HTTPS stylesheets
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Minimal for Next.js hydration
          "https:", // Allow HTTPS scripts
        ],
        imgSrc: [
          "'self'",
          "data:", // Allow data URLs for images
          "https:", // Allow HTTPS images
        ],
        fontSrc: [
          "'self'",
          "https:", // Allow web fonts
          "data:", // Allow data URLs for fonts
        ],
        connectSrc: [
          "'self'",
          "https:", // Allow HTTPS API calls
          ...(process.env.NODE_ENV === 'development' ? ['ws:'] : []), // WebSocket for dev
        ],
        frameSrc: ["'none'"], // Prevent iframe embedding
        objectSrc: ["'none'"], // Prevent Flash/Java applets
        manifestSrc: ["'self'"], // Allow web app manifest
        workerSrc: ["'self'"], // Allow service workers
        ...(process.env.NODE_ENV === 'production' && { upgradeInsecureRequests: [] }), // Force HTTPS in production
      },
    },
    crossOriginEmbedderPolicy: { policy: "require-corp" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "no-referrer" },
    xssFilter: true,
  }));

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
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

  const config = new DocumentBuilder()
    .setTitle('Tec-Shop API')
    .setDescription('API documentation for the Tec-Shop microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 8080;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📚 API documentation is available at: http://localhost:${port}/api-docs`
  );
}

bootstrap();
