import * as Sentry from '@sentry/nextjs';

// Export router transition hook for navigation tracking
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN_USER_UI;

// Only initialize if DSN is provided and not a placeholder
if (dsn && !dsn.includes('your-user-ui-dsn')) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0'),

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.NODE_ENV === 'development',

    replaysOnErrorSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      Sentry.replayIntegration({
        // Additional Replay configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Add custom tags
    initialScope: {
      tags: {
        app: 'user-ui',
        frontend: 'next.js',
      },
    },

    // Filter sensitive data before sending to Sentry
    beforeSend(event) {
      // Remove auth tokens from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data?.authorization) {
            delete breadcrumb.data.authorization;
          }
          if (breadcrumb.data?.cookie) {
            delete breadcrumb.data.cookie;
          }
          return breadcrumb;
        });
      }

      // Remove sensitive data from request
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      return event;
    },
  });

  console.log('[Sentry] Initialized for User UI (Client)');
} else {
  console.log('[Sentry] Skipping client initialization - DSN not configured');
}
