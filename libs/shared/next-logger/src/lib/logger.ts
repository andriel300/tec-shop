import pino from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const isServer = typeof window === 'undefined';
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Server-side logger using pino with pretty printing in development.
 * Never instantiated in the browser — guarded by isServer checks.
 */
function createServerLogger(name: string) {
  return pino({
    name,
    level: isDev ? 'debug' : 'info',
    ...(isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              levelFirst: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
        }
      : {}),
  });
}

/**
 * Client-side logger — thin console wrapper.
 * In production only errors are emitted; debug/info are silenced.
 * Errors are already captured by Sentry, so this is for local dev insight only.
 */
function createBrowserLogger(name: string) {
  const prefix = `[${name}]`;
  const noop = () => undefined;

  return {
    trace: noop,
    debug: isDev ? console.debug.bind(console, prefix) : noop,
    info: isDev ? console.info.bind(console, prefix) : noop,
    warn: console.warn.bind(console, prefix),
    error: console.error.bind(console, prefix),
    fatal: console.error.bind(console, prefix),
    child: (_bindings: Record<string, unknown>) => createBrowserLogger(name),
  };
}

export type AppLogger = ReturnType<typeof createBrowserLogger>;

/**
 * Creates a named logger for a Next.js app.
 *
 * - Server (server components, server actions, middleware, route handlers):
 *   uses pino with JSON output (pretty in dev).
 * - Client (browser / 'use client' components):
 *   uses a console wrapper — silenced in production except warn/error.
 *
 * Usage:
 *   // In a server component or server action:
 *   const logger = createLogger('user-ui:checkout');
 *   logger.info({ userId }, 'Checkout initiated');
 *
 *   // In a client component:
 *   const logger = createLogger('user-ui:cart');
 *   logger.warn('Item out of stock');
 */
export function createLogger(name: string): AppLogger {
  if (isServer) {
    return createServerLogger(name) as unknown as AppLogger;
  }
  return createBrowserLogger(name);
}
