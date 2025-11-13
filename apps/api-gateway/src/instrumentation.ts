import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry before any other imports
export function initializeSentry() {
  const dsn = process.env.SENTRY_DSN_BACKEND;

  // Only initialize if DSN is provided and not a placeholder
  if (!dsn || dsn.includes('your-backend-dsn')) {
    console.log('[Sentry] Skipping initialization - DSN not configured');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',

    // Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0'),

    // Profiling sample rate - set to 1.0 for development
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    integrations: [
      // Enable profiling
      nodeProfilingIntegration(),
    ],

    // Set release version (optional - can be set from CI/CD)
    release: process.env.SENTRY_RELEASE || undefined,

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',

    // Add custom tags
    initialScope: {
      tags: {
        service: 'api-gateway',
        port: process.env.PORT || '8080',
      },
    },

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Remove sensitive environment variables
      if (event.contexts?.runtime?.env) {
        const env = event.contexts.runtime.env as Record<string, unknown>;
        delete env['JWT_SECRET'];
        delete env['SERVICE_MASTER_SECRET'];
        delete env['STRIPE_SECRET_KEY'];
        delete env['SMTP_PASS'];
      }

      return event;
    },
  });

  console.log('[Sentry] Initialized for API Gateway');
}
