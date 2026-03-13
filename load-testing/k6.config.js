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
 * IMPORTANT — throttler bypass:
 *   The api-gateway uses ConditionalThrottlerGuard. Set LOAD_TEST=true in the
 *   root .env before running any scenario, then restart the api-gateway.
 *   The guard reads this value at request time and bypasses all throttle checks.
 *   Set LOAD_TEST=false and restart after testing to re-enable throttling.
 *
 *     # root .env
 *     LOAD_TEST=true    # before test
 *     LOAD_TEST=false   # after test
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
 * Common HTTP parameters: JSON content-type, gzip compression, no redirects.
 * Accept-Encoding ensures the server sends compressed responses, matching
 * real browser behavior and correctly benchmarking the compression middleware.
 * @type {import('k6/http').Params}
 */
export const httpParams = {
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
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
