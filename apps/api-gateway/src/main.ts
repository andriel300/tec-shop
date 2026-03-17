import { initializeTracing } from '@tec-shop/tracing';
initializeTracing('api-gateway');

import { initializeSentryForService } from './instrumentation';
initializeSentryForService();

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { setupSwagger } from './swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { raw } from 'express';
import { RpcExceptionFilter } from './filters/rpc-exception.filter';

async function bootstrap() {
  if (process.env['LOAD_TEST'] === 'true' && process.env['NODE_ENV'] === 'production') {
    throw new Error('LOAD_TEST=true is not allowed in production. Refusing to start.');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true, // Enable raw body parsing globally
  });
  app.useLogger(app.get(PinoLogger));

  const isProduction = process.env.NODE_ENV === 'production';

  // Compress all responses (gzip/deflate) — reduces JSON payload size 60-70%
  app.use(compression());

  // Configure cookie parser for secure authentication
  app.use(cookieParser());

  // Raw body parser for Stripe webhooks (MUST run before global JSON parser)
  // Stripe signature verification requires the raw unparsed body
  app.use('/api/webhooks/stripe', raw({ type: 'application/json' }));

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
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
  app.useGlobalFilters(new RpcExceptionFilter());
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

  if (!isProduction) {
    setupSwagger(app);
  }

  const port = process.env.PORT || 8080;
  const gracefulShutdown = async (signal: string) => {
    Logger.log(`Received ${signal}, starting graceful shutdown`, 'Bootstrap');
    const forceExit = setTimeout(() => {
      Logger.error('Forced exit after 30s timeout', undefined, 'Bootstrap');
      process.exit(1);
    }, 30_000);
    forceExit.unref();
    await app.close();
    clearTimeout(forceExit);
  };
  process.once('SIGTERM', () => { void gracefulShutdown('SIGTERM'); });
  process.once('SIGINT', () => { void gracefulShutdown('SIGINT'); });
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📚 API documentation is available at: http://localhost:${port}/api-docs`
  );
}

process.on('unhandledRejection', (reason, promise) => {
  Logger.error(`Unhandled Rejection at: ${String(promise)}, reason: ${String(reason)}`, undefined, 'Bootstrap');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception', error instanceof Error ? error.stack : String(error), 'Bootstrap');
  process.exit(1);
});

bootstrap();
