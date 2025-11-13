import * as Sentry from '@sentry/nextjs';

// This file is used to initialize Sentry on the server side
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN_SELLER_UI;

    // Only initialize if DSN is provided and not a placeholder
    if (dsn && !dsn.includes('your-seller-ui-dsn')) {
      Sentry.init({
        dsn,
        environment: process.env.SENTRY_ENVIRONMENT || 'development',

        // Adjust this value in production, or use tracesSampler for greater control
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0'),

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: process.env.NODE_ENV === 'development',

        // Add custom tags
        initialScope: {
          tags: {
            app: 'seller-ui',
            frontend: 'next.js',
            runtime: 'server',
          },
        },

        // Filter sensitive data before sending to Sentry
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
            delete env['IMAGEKIT_PRIVATE_KEY'];
          }

          return event;
        },
      });

      console.log('[Sentry] Initialized for Seller UI (Server)');
    } else {
      console.log('[Sentry] Skipping server initialization - DSN not configured');
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN_SELLER_UI;

    // Only initialize if DSN is provided and not a placeholder
    if (dsn && !dsn.includes('your-seller-ui-dsn')) {
      Sentry.init({
        dsn,
        environment: process.env.SENTRY_ENVIRONMENT || 'development',

        // Adjust this value in production, or use tracesSampler for greater control
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0'),

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: process.env.NODE_ENV === 'development',

        // Add custom tags
        initialScope: {
          tags: {
            app: 'seller-ui',
            frontend: 'next.js',
            runtime: 'edge',
          },
        },

        // Filter sensitive data before sending to Sentry
        beforeSend(event) {
          // Remove sensitive headers
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
            delete event.request.headers['x-api-key'];
          }

          return event;
        },
      });

      console.log('[Sentry] Initialized for Seller UI (Edge)');
    } else {
      console.log('[Sentry] Skipping edge initialization - DSN not configured');
    }
  }
}

// Export error handler for React Server Components
export const onRequestError = Sentry.captureRequestError;
