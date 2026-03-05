import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initializeSentry(serviceName: string, port: string | number) {
  const dsn = process.env.SENTRY_DSN_BACKEND;

  if (!dsn || dsn.includes('your-backend-dsn')) {
    console.log(`[Sentry] Skipping initialization for ${serviceName} - DSN not configured`);
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate: 0.1,
    integrations: [nodeProfilingIntegration()],
    release: process.env.SENTRY_RELEASE || undefined,
    debug: process.env.SENTRY_DEBUG === 'true',
    initialScope: {
      tags: {
        service: serviceName,
        port: port.toString(),
        transport: 'TCP',
      },
    },
    beforeSend(event) {
      if (event.contexts?.runtime?.env) {
        const env = event.contexts.runtime.env as Record<string, unknown>;
        delete env['JWT_SECRET'];
        delete env['SERVICE_MASTER_SECRET'];
      }
      return event;
    },
  });

  console.log(`[Sentry] Initialized for ${serviceName}`);
}
