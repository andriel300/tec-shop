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
 * Client-side logger — thin console wrapper.
 * In production only errors are emitted; debug/info are silenced.
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
 * Server-side logger using pino with pretty printing in development.
 * Uses indirect eval so neither webpack nor Turbopack statically traces
 * into pino and its Node.js-only dependencies (thread-stream, etc.).
 */
function createServerLogger(name: string): AppLogger {
  try {
    // (0, eval)('require') is the standard "indirect eval" pattern.
    // It returns the Node.js require function without exposing a static
    // string literal to bundler module-graph analysis.
    // eslint-disable-next-line no-eval
    const nodeRequire = (0, eval)('require') as NodeRequire;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pino = nodeRequire('pino') as (opts: Record<string, unknown>) => any;
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
    }) as AppLogger;
  } catch {
    return createBrowserLogger(name);
  }
}

/**
 * Creates a named logger for a Next.js app.
 *
 * - Server (server components, server actions, middleware, route handlers):
 *   uses pino with JSON output (pretty in dev).
 * - Client (browser / 'use client' components):
 *   uses a console wrapper — silenced in production except warn/error.
 */
export function createLogger(name: string): AppLogger {
  if (typeof window === 'undefined') {
    return createServerLogger(name);
  }
  return createBrowserLogger(name);
}
