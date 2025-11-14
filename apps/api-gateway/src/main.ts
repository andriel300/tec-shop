/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

// Initialize Sentry FIRST before any other imports
import { initializeSentry } from './instrumentation';
initializeSentry();

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true, // Enable raw body parsing globally
  });
  app.useLogger(app.get(PinoLogger));

  // Configure cookie parser for secure authentication
  app.use(cookieParser());

  // Raw body parser for Stripe webhooks (MUST run before global JSON parser)
  // Stripe signature verification requires the raw unparsed body
  app.use('/api/webhooks/stripe', raw({ type: 'application/json' }));

  app.enableCors({
    origin: [
      'http://localhost:3000', // user-ui
      'http://localhost:3001', // seller-ui
    ],
    credentials: true, // Allow cookies to be sent with cross-origin requests
  });

  // Enhanced security headers with Content Security Policy
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Needed for Tailwind CSS and styled-components
            'https:', // Allow HTTPS stylesheets
          ],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Minimal for Next.js hydration
            'https:', // Allow HTTPS scripts
          ],
          imgSrc: [
            "'self'",
            'data:', // Allow data URLs for images
            'https:', // Allow HTTPS images
          ],
          fontSrc: [
            "'self'",
            'https:', // Allow web fonts
            'data:', // Allow data URLs for fonts
          ],
          connectSrc: [
            "'self'",
            'https:', // Allow HTTPS API calls
            ...(process.env.NODE_ENV === 'development' ? ['ws:'] : []), // WebSocket for dev
          ],
          frameSrc: ["'none'"], // Prevent iframe embedding
          objectSrc: ["'none'"], // Prevent Flash/Java applets
          manifestSrc: ["'self'"], // Allow web app manifest
          workerSrc: ["'self'"], // Allow service workers
          ...(process.env.NODE_ENV === 'production' && {
            upgradeInsecureRequests: [],
          }), // Force HTTPS in production
        },
      },
      crossOriginEmbedderPolicy: { policy: 'require-corp' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: 'no-referrer' },
      xssFilter: true,
    })
  );

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
      transform: true, // Transform payloads to DTO instances
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide validation details in production
      validationError: {
        target: false, // Don't expose target object
        value: false, // Don't expose submitted values
      },
    })
  );

  const config = new DocumentBuilder()
    .setTitle('TecShop API Gateway')
    .setDescription(
      `
# TecShop E-Commerce Platform API

Welcome to the TecShop API documentation. This RESTful API provides comprehensive access to our multi-vendor e-commerce platform.

## Architecture

TecShop is built on a microservices architecture with the following services:
- **Auth Service**: Authentication and authorization
- **User Service**: Customer profile management
- **Seller Service**: Seller accounts and shop management
- **Product Service**: Product catalog, categories, and brands

## Authentication

Most endpoints require JWT authentication via Bearer token. You can authenticate using:
1. Email/Password login
2. Google OAuth 2.0

After successful authentication, include the JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your-token-here>
\`\`\`

Tokens are also provided as httpOnly cookies for browser-based applications.

## Rate Limiting

API requests are rate-limited to ensure service stability:
- General operations: 100 requests per minute (production)
- Authentication operations: 20 requests per 15 minutes
- Search operations: 200 requests per minute

## Response Format

All API responses follow a consistent JSON structure:
\`\`\`json
{
  "statusCode": 200,
  "message": "Success message",
  "data": { ... }
}
\`\`\`

Error responses include detailed error messages and appropriate HTTP status codes.

## Support

For issues or questions, please contact our development team.
      `
    )
    .setVersion('1.0.0')
    .setContact(
      'TecShop Development Team',
      'https://github.com/andriel300/tec-shop',
      'support@tecshop.com'
    )
    .setLicense(
      'MIT',
      'https://github.com/andriel300/tec-shop/blob/main/LICENSE'
    )
    .addServer('http://localhost:8080', 'Development Server')
    .addServer('https://api.tecshop.com', 'Production Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('User', 'Customer profile management')
    .addTag('Seller', 'Seller account and shop operations')
    .addTag('Products', 'Product catalog management')
    .addTag('Categories', 'Product category hierarchy')
    .addTag('Brands', 'Brand directory management')
    .addTag('Discounts', 'Discount and promotion management')
    .addTag('Stripe Connect', 'Stripe payment integration for sellers')
    .addTag('Webhooks', 'External service webhooks')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'TecShop API Documentation',
    customfavIcon: 'https://tecshop.com/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0 }
      .swagger-ui .info .title { font-size: 36px }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  });

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
