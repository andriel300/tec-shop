/**
 * Paths that look attractive to automated scanners and script kiddies.
 * Any request matching these paths is treated as a honeypot trigger:
 *  1. The source IP is added to the Redis blocklist.
 *  2. A SECURITY-level Kafka log event is emitted.
 *  3. A decoy 200 response is returned so the scanner cannot tell it was detected.
 *
 * All values are lowercase with trailing slashes stripped for case-insensitive,
 * trailing-slash-agnostic matching. Use normalizePath() before checking.
 */
export const HONEYPOT_LURE_PATHS: ReadonlySet<string> = new Set([
  // Environment / config file leaks
  '/.env',
  '/.env.local',
  '/.env.production',
  '/.env.development',
  '/.env.backup',
  '/.env.staging',
  '/config.json',
  '/configuration.yml',
  '/app.config.js',

  // WordPress probing
  '/wp-admin',
  '/wp-login.php',
  '/wp-config.php',
  '/wordpress/wp-admin',
  '/wordpress/wp-login.php',

  // PHP admin panels
  '/admin.php',
  '/phpmyadmin',
  '/pma',
  '/mysql',
  '/mysqladmin',

  // Git exposure
  '/.git/config',
  '/.git/head',
  '/.gitignore',

  // Spring Boot / Java Actuator (exact paths — subtree handled by HONEYPOT_LURE_PREFIXES)
  '/actuator',
  '/actuator/env',
  '/actuator/mappings',
  '/actuator/beans',
  '/actuator/health/liveness',

  // Java admin consoles
  '/console',
  '/h2-console',
  '/jmx-console',
  '/manager/html',

  // Shell / CGI exploitation
  '/shell',
  '/cgi-bin/luci',
  '/cgi-bin/.env',

  // Miscellaneous attack surface probes
  '/server-status',
  '/telescope/requests',
  '/.ds_store',
  '/crossdomain.xml',
  '/xmlrpc.php',
]);

/**
 * Path prefixes: any request whose normalized path starts with one of these
 * strings is also treated as a honeypot trigger (subtree matching).
 * All values must be lowercase and NOT end with a slash.
 */
export const HONEYPOT_LURE_PREFIXES: ReadonlyArray<string> = [
  '/.git/',
  '/wp-content/',
  '/wp-includes/',
  '/actuator/',
  '/phpmyadmin/',
  '/pma/',
  '/cgi-bin/',
];

/**
 * Normalizes a request path for honeypot matching:
 *  - lowercases the path (case-insensitive scanner probes)
 *  - strips a single trailing slash (avoids /wp-admin vs /wp-admin/ bypass)
 */
export function normalizePath(path: string): string {
  const lower = path.toLowerCase();
  return lower.length > 1 && lower.endsWith('/') ? lower.slice(0, -1) : lower;
}

/** Default Redis TTL for blocked IPs (1 hour). Override with HONEYPOT_BAN_TTL_SECONDS. */
export const HONEYPOT_BAN_TTL_SECONDS_DEFAULT = 3600;
