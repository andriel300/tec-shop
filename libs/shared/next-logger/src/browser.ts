export type { AppLogger, LogLevel } from './lib/logger';

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

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

export function createLogger(name: string) {
  return createBrowserLogger(name);
}
