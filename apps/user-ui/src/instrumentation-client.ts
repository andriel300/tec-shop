// Sentry is only initialized in production.
// Using conditional require() (not a static import) lets Turbopack/webpack dead-code-eliminate
// the entire @sentry/nextjs package — including the heavy rrweb Session Replay library —
// from the dev build. A static `import * as Sentry` would force compilation of the full SDK
// regardless of the runtime guard, causing 1-3 GB of extra compilation memory in dev.

/* eslint-disable @typescript-eslint/no-require-imports */
if (process.env.NODE_ENV !== 'development') {
  const Sentry = require('@sentry/nextjs');
  Sentry.init({
    dsn: 'https://9dbfa38f0eef8b1d2ab55acd1fe6eda9@o4510359317774336.ingest.us.sentry.io/4510359478599680',
    integrations: [Sentry.replayIntegration()],
    tracesSampleRate: 1,
    enableLogs: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: true,
  });
}

export const onRouterTransitionStart =
  process.env.NODE_ENV !== 'development'
    ? require('@sentry/nextjs').captureRouterTransitionStart
    : undefined;
