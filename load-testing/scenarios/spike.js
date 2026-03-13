/// <reference types="k6" />
/// <reference types="k6/http" />

/**
 * Spike scenario — sudden burst to 500 concurrent users in 30 seconds.
 *
 * Purpose: simulate a flash sale, viral moment, or traffic spike.  Tests
 * whether the system recovers after the spike without persistent errors.
 *
 * Stage plan:
 *   0 → 500 VUs  over 30s    (the spike itself)
 * 500 → 500 VUs  for  1m     (hold — measure peak behavior)
 * 500 →  50 VUs  over 30s    (sudden drop to normal traffic)
 *  50 →  50 VUs  for  2m     (recovery window — latency should normalize)
 *  50 →   0 VUs  over 30s    (cool-down)
 *
 * Key metrics to watch:
 *   - Error rate during spike (target < 1%)
 *   - Time to recovery (p95 returning to baseline levels after the spike drops)
 *   - Whether the system returns to normal without a restart
 *
 * PREREQUISITE — raise the throttler limit before running:
 *   apps/api-gateway/src/app/app.module.ts
 *   long.limit: isDevelopment ? 50000 : 200
 *
 * Run:
 *   k6 run load-testing/scenarios/spike.js
 *
 * Export to JSON:
 *   k6 run --out json=load-testing/results/spike.json load-testing/scenarios/spike.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, httpParams, randomInt } from '../k6.config.js';

const spikeErrorRate = new Rate('spike_errors');
const spikeLatency = new Trend('spike_latency', true);

export const options = {
  stages: [
    { duration: '30s', target: 500 },  // spike
    { duration: '1m',  target: 500 },  // hold peak
    { duration: '30s', target: 50 },   // drop to normal
    { duration: '2m',  target: 50 },   // recovery window
    { duration: '30s', target: 0 },    // cool-down
  ],
  thresholds: {
    // During spike, allow degraded latency but not a total failure
    http_req_failed: ['rate<0.05'],
    spike_errors: ['rate<0.05'],
    // Recovery window check: after spike drops, latency should recover
    spike_latency: ['p(95)<800'],
  },
};

/**
 * Setup: collect slugs once.
 * @returns {{ slugs: string[] }}
 */
export function setup() {
  const res = http.get(`${BASE_URL}/api/public/products?limit=50&offset=0`, httpParams);
  let slugs = ['sample-product'];

  if (res.status === 200) {
    try {
      const products = JSON.parse(res.body).products || [];
      if (products.length > 0) {
        slugs = products.map((p) => p.slug).filter(Boolean);
      }
    } catch (_) {
      // fallback
    }
  }

  return { slugs };
}

/**
 * Default VU function — simplified to product listing only (highest traffic endpoint).
 * @param {{ slugs: string[] }} data
 */
export default function (data) {
  const slug = data.slugs[randomInt(0, data.slugs.length - 1)];

  group('spike_product_listing', () => {
    const res = http.get(
      `${BASE_URL}/api/public/products?limit=20&offset=0`,
      httpParams
    );
    spikeLatency.add(res.timings.duration);
    const ok = check(res, {
      'listing 200': (r) => r.status === 200,
      'response time under 2s': (r) => r.timings.duration < 2000,
    });
    spikeErrorRate.add(!ok);
  });

  sleep(0.2);

  group('spike_product_detail', () => {
    const res = http.get(`${BASE_URL}/api/public/products/${slug}`, httpParams);
    spikeLatency.add(res.timings.duration);
    const ok = check(res, {
      'detail 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    spikeErrorRate.add(!ok);
  });

  sleep(randomInt(1, 2));
}
