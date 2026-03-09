// Type-only import — erased at runtime; prevents pino from being bundled in client builds
import type pinoDefault from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Guard against edge runtime or restricted prerender contexts where process may be unavailable
const isDev = (() => {
  try {
    if (typeof process === 'undefined') return false;
    // Disable pino-pretty during Next.js static generation (avoids worker_thread spawning)
    if (process.env?.NEXT_PHASE === 'phase-production-build') return false;
    return process.env?.NODE_ENV !== 'production';
  } catch {
    return false;
  }
})();

/**
 * Server-side logger using pino with pretty printing in development.
 * Uses require() so pino is never included in client-side bundles via webpack
 * dead-code elimination on the typeof window === 'undefined' guard in createLogger.
 */
function createServerLogger(name: string): AppLogger {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pino = require('pino') as typeof pinoDefault;
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
    }) as unknown as AppLogger;
  } catch {
    // Fallback if pino is unavailable (edge runtime, restricted prerender)
    return createBrowserLogger(name);
  }
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
  // Inline typeof check gives webpack better dead code elimination:
  // in client bundles, this branch is statically false so createServerLogger
  // (and its require('pino')) is dropped entirely from the bundle.
  if (typeof window === 'undefined') {
    return createServerLogger(name);
  }
  return createBrowserLogger(name);
}
