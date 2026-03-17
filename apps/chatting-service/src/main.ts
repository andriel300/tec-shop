import { initializeTracing } from '@tec-shop/tracing';
initializeTracing('chatting-service');

import { initializeSentryForService } from './instrumentation';
initializeSentryForService('chatting-service', process.env['CHATTING_SERVICE_PORT'] ?? '6007');

import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger as PinoLogger } from 'nestjs-pino';
import { WsIoAdapter } from '@tec-shop/ws-auth';

async function bootstrap() {
  const certsPath = join(process.cwd(), 'certs');
  const certPath = join(certsPath, 'chatting-service/chatting-service-cert.pem');
  const keyPath = join(certsPath, 'chatting-service/chatting-service-key.pem');
  const caPath = join(certsPath, 'ca/ca-cert.pem');

  let tlsCerts: { key: Buffer; cert: Buffer; ca: Buffer };
  try {
    tlsCerts = {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
      ca: readFileSync(caPath),
    };
  } catch (error) {
    Logger.error(
      '[mTLS] Failed to load chatting-service certificates. Run ./generate-certs.sh --service chatting-service',
      error instanceof Error ? error.message : String(error),
      'Bootstrap',
    );
    process.exit(1);
  }

  // Create HTTP app for WebSocket support (Socket.io)
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

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

  // WebSocket adapter — centralises Socket.IO CORS via WsIoAdapter
  app.useWebSocketAdapter(new WsIoAdapter(app));

  // Connect TCP microservice for inter-service communication
  const tcpPort = parseInt(process.env.CHATTING_SERVICE_TCP_PORT || '6010', 10);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.CHATTING_SERVICE_HOST || 'localhost',
      port: tcpPort,
      tlsOptions: {
        ...tlsCerts,
        requestCert: true,
        rejectUnauthorized: true,
      },
    },
  });

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

  // Start all microservices (TCP)
  await app.startAllMicroservices();

  // Start HTTP server for WebSocket (Socket.io)
  const httpPort = parseInt(process.env.CHATTING_SERVICE_PORT || '6007', 10);
  await app.listen(httpPort);

  Logger.log(`Chatting Service HTTP/WebSocket server running on port ${httpPort}`);
  Logger.log(`Chatting Service TCP microservice running on port ${tcpPort} with mTLS`);
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
