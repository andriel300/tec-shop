import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export type SentryTransport = 'HTTP' | 'TCP' | 'HTTP+WebSocket' | 'Kafka';

export interface SentryInitOptions {
  serviceName: string;
  port?: string | number;
  transport?: SentryTransport;
}

const SCRUBBED_HEADERS = ['authorization', 'cookie', 'x-api-key'];

const SCRUBBED_ENV_KEYS = [
  'JWT_SECRET',
  'SERVICE_MASTER_SECRET',
  'STRIPE_SECRET_KEY',
  'SMTP_PASS',
  'AUTH_SERVICE_DB_URL',
  'USER_SERVICE_DB_URL',
  'SELLER_SERVICE_DB_URL',
  'PRODUCT_SERVICE_DB_URL',
  'ORDER_SERVICE_DB_URL',
  'ANALYTICS_SERVICE_DB_URL',
  'REDPANDA_PASSWORD',
  'KAFKA_PASSWORD',
];

/**
 * Must be called at the very top of main.ts — before any NestJS or library
 * imports — so that Sentry's OpenTelemetry instrumentation can patch modules.
 */
export function initializeSentry(options: SentryInitOptions): void {
  const dsn = process.env['SENTRY_DSN_BACKEND'];

  if (!dsn || dsn.includes('your-backend-dsn')) {
    console.log(`[Sentry] Skipping for ${options.serviceName} — DSN not configured`);
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env['SENTRY_ENVIRONMENT'] ?? 'development',
    tracesSampleRate: parseFloat(process.env['SENTRY_TRACES_SAMPLE_RATE'] ?? '0.1'),
    profilesSampleRate: 0.1,
    integrations: [nodeProfilingIntegration()],
    release: process.env['SENTRY_RELEASE'],
    debug: process.env['SENTRY_DEBUG'] === 'true',
    initialScope: {
      tags: {
        service: options.serviceName,
        ...(options.port != null && { port: String(options.port) }),
        ...(options.transport && { transport: options.transport }),
      },
    },
    beforeSend(event) {
      if (event.request?.headers) {
        for (const header of SCRUBBED_HEADERS) {
          delete (event.request.headers as Record<string, unknown>)[header];
        }
      }
      if (event.contexts?.runtime?.env) {
        const env = event.contexts.runtime.env as Record<string, unknown>;
        for (const key of SCRUBBED_ENV_KEYS) delete env[key];
      }
      return event;
    },
  });

  console.log(`[Sentry] Initialized for ${options.serviceName}`);
}
