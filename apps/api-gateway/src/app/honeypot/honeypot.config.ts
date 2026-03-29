/**
 * Paths that look attractive to automated scanners and script kiddies.
 * Any request matching these paths is treated as a honeypot trigger:
 *  1. The source IP is added to the Redis blocklist.
 *  2. A SECURITY-level Kafka log event is emitted.
 *  3. A decoy 200 response is returned so the scanner cannot tell it was detected.
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
  '/phpmyadmin/',
  '/pma',
  '/pma/',
  '/mysql',
  '/mysqladmin',

  // Git exposure
  '/.git/config',
  '/.git/HEAD',
  '/.gitignore',

  // Spring Boot / Java Actuator
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
  '/.DS_Store',
  '/crossdomain.xml',
  '/xmlrpc.php',
]);

/** Default Redis TTL for blocked IPs (1 hour). Override with HONEYPOT_BAN_TTL_SECONDS. */
export const HONEYPOT_BAN_TTL_SECONDS_DEFAULT = 3600;
