// Sentry is only initialized in production.
// Using conditional require() (not a static import) lets Turbopack/webpack dead-code-eliminate
// the entire @sentry/nextjs package — including the heavy rrweb Session Replay library —
// from the dev build. A static `import * as Sentry` would force compilation of the full SDK
// regardless of the runtime guard, causing 1-3 GB of extra compilation memory in dev.

/* eslint-disable @typescript-eslint/no-require-imports */
if (process.env.NODE_ENV !== 'development') {
  const Sentry = require('@sentry/nextjs');
  Sentry.init({
    dsn: 'https://99e1224b664861f967453ad564705d0f@o4510359317774336.ingest.us.sentry.io/4510359354408960',
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