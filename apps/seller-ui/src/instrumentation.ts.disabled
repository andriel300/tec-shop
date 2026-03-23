// Same rationale as instrumentation-client.ts: avoid static import of @sentry/nextjs
// so the server-side Sentry SDK is excluded from the dev compilation entirely.

/* eslint-disable @typescript-eslint/no-require-imports */
export async function register() {
  if (process.env.NODE_ENV === 'development') return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError =
  process.env.NODE_ENV !== 'development'
    ? require('@sentry/nextjs').captureRequestError
    : undefined;
