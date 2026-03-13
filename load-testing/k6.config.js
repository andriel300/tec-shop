/// <reference types="k6" />
/// <reference types="k6/http" />

/**
 * Shared k6 configuration for TecShop load tests.
 *
 * SLO targets (portfolio baseline):
 *   p95 < 300ms  — acceptable user-perceived latency
 *   p99 < 800ms  — worst-case tail latency
 *   error rate < 0.1%
 *
 * IMPORTANT — throttler configuration:
 *   The api-gateway "long" throttler allows 2000 req/min per IP in development.
 *   Under load testing, all VUs share one IP, so 200+ concurrent VUs will
 *   exhaust this limit quickly and return HTTP 429 responses.
 *
 *   Before running stress or spike scenarios, increase the limit in
 *   apps/api-gateway/src/app/app.module.ts:
 *
 *     name: 'long',
 *     ttl: 60000,
 *     limit: isDevelopment ? 50000 : 200,   // raised from 2000
 *
 *   Restore the original value after testing.
 */

/** @type {string} */
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

/**
 * Shared pass/fail thresholds applied to all scenarios.
 * Individual scenarios may tighten these for specific flows.
 */
export const thresholds = {
  /** 95th-percentile latency must stay under 300ms */
  http_req_duration: ['p(95)<300', 'p(99)<800'],
  /** Less than 0.1% of requests may fail (non-2xx or network error) */
  http_req_failed: ['rate<0.001'],
};

/**
 * Common HTTP parameters: JSON content-type, no redirects.
 * @type {import('k6/http').Params}
 */
export const httpParams = {
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  redirects: 0,
};

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
