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
 *   - spike_listing_latency p95: listing endpoint under burst (highly cached)
 *   - spike_detail_latency p95:  detail endpoint under burst (cold-cache long tail)
 *   - spike_errors: combined HTTP errors + response time violations
 *   - http_req_failed: network-level failures (should stay 0%)
 *
 * PREREQUISITE — bypass the throttler before running:
 *   Set LOAD_TEST=true in root .env, restart api-gateway.
 *   Set LOAD_TEST=false and restart after testing.
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

// Mark 404 as a non-failure — product detail slugs may not exist in the dataset
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 299 }, 404));

// Separate Trends per endpoint — previously both were merged into one metric,
// which masked whether the listing (cached) or detail (cold-miss) was slower
const listingLatency = new Trend('spike_listing_latency', true);
const detailLatency  = new Trend('spike_detail_latency',  true);
const spikeErrorRate = new Rate('spike_errors');

export const options = {
  stages: [
    { duration: '30s', target: 500 }, // spike
    { duration: '1m',  target: 500 }, // hold peak
    { duration: '30s', target: 50  }, // drop to normal
    { duration: '2m',  target: 50  }, // recovery window
    { duration: '30s', target: 0   }, // cool-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    spike_errors:    ['rate<0.05'],
    // Separate SLOs per endpoint — listing should recover faster than detail
    spike_listing_latency: ['p(95)<500'],  // cached: should recover within seconds
    spike_detail_latency:  ['p(95)<1000'], // cold-miss long tail allowed during burst
  },
};

/**
 * Setup: build a diverse slug pool across 4 pages (up to 200 slugs).
 * More slugs = more unique cache keys = better stress on the cold-miss path.
 * @returns {{ slugs: string[] }}
 */
export function setup() {
  const offsets = [0, 50, 100, 150];
  const slugSet = new Set();

  for (const offset of offsets) {
    const res = http.get(
      `${BASE_URL}/api/public/products?limit=50&offset=${offset}`,
      httpParams
    );
    if (res.status === 200) {
      try {
        const products = JSON.parse(res.body).products || [];
        products.forEach((p) => p.slug && slugSet.add(p.slug));
      } catch (_) {}
    }
  }

  return { slugs: slugSet.size > 0 ? [...slugSet] : ['sample-product'] };
}

/**
 * Default VU function.
 * @param {{ slugs: string[] }} data
 */
export default function (data) {
  const slug = data.slugs[randomInt(0, data.slugs.length - 1)];

  group('spike_product_listing', () => {
    const res = http.get(
      `${BASE_URL}/api/public/products?limit=20&offset=0`,
      httpParams
    );
    listingLatency.add(res.timings.duration);
    const ok = check(res, {
      'listing 200': (r) => r.status === 200,
      'response time under 2s': (r) => r.timings.duration < 2000,
    });
    spikeErrorRate.add(!ok);
  });

  sleep(0.2);

  group('spike_product_detail', () => {
    const res = http.get(`${BASE_URL}/api/public/products/${slug}`, httpParams);
    detailLatency.add(res.timings.duration);
    const ok = check(res, {
      'detail 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    spikeErrorRate.add(!ok);
  });

  sleep(randomInt(1, 2));
}
