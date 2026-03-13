/// <reference types="k6" />
/// <reference types="k6/http" />

/**
 * Soak scenario — sustained moderate load for 30 minutes.
 *
 * Purpose: detect issues that only emerge over time and are invisible in
 * short stress tests:
 *
 *   - Memory leaks: latency drifts upward as heap pressure builds in Node.js
 *   - Connection pool exhaustion: unclosed MongoDB/Redis/TCP connections
 *   - Redis TTL cycling spikes: every 30–300s a cache entry expires and one
 *     request takes a full Atlas round-trip — should be transparent at p95
 *   - NestJS resource accumulation: event listener leaks, interceptor state
 *
 * How to read the results:
 *   Each request is tagged 'early' (first 5 min), 'mid', or 'late' (last 5 min).
 *   Compare soak_latency p95 between early and late windows using --out json:
 *
 *     k6 run --out json=load-testing/results/soak.json load-testing/scenarios/soak.js
 *
 *   Then filter the JSON for data_point entries where metric=soak_latency and
 *   tag window=early vs window=late.  Drift > 50% indicates a resource leak.
 *
 * Stage plan:
 *   0  → 30 VUs  over  1 min   (ramp)
 *  30  → 30 VUs  for  28 min   (sustained soak)
 *  30  →  0 VUs  over  1 min   (cool-down)
 *
 * PREREQUISITE — bypass the throttler before running:
 *   Set LOAD_TEST=true in root .env, restart api-gateway.
 *   Set LOAD_TEST=false and restart after testing.
 *
 * Run:
 *   k6 run load-testing/scenarios/soak.js
 *
 * Export to JSON for window comparison:
 *   k6 run --out json=load-testing/results/soak.json load-testing/scenarios/soak.js
 *
 * Push live metrics to Prometheus:
 *   k6 run --out experimental-prometheus-rw load-testing/scenarios/soak.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, thresholds, httpParams, randomInt } from '../k6.config.js';

// Mark 404 as a non-failure for product detail slugs
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 299 }, 404));

// Per-endpoint latency Trends
const soakLatency        = new Trend('soak_latency',         true); // all endpoints combined
const soakListingLatency = new Trend('soak_listing_latency', true);
const soakDetailLatency  = new Trend('soak_detail_latency',  true);
const soakErrors         = new Rate('soak_errors');

// Time-window boundaries (seconds from test start)
// Used to tag metrics for early vs late drift comparison
const EARLY_WINDOW_END_S   = 5 * 60;   // first 5 minutes
const LATE_WINDOW_START_S  = 25 * 60;  // last 5 minutes

/** @param {number} startTime */
function timeWindow(startTime) {
  const elapsed = (Date.now() - startTime) / 1000;
  if (elapsed < EARLY_WINDOW_END_S)  return 'early';
  if (elapsed > LATE_WINDOW_START_S) return 'late';
  return 'mid';
}

export const options = {
  stages: [
    { duration: '1m',  target: 30 }, // ramp
    { duration: '28m', target: 30 }, // soak
    { duration: '1m',  target: 0  }, // cool-down
  ],
  thresholds: {
    ...thresholds,
    soak_errors:          ['rate<0.01'],   // stricter than stress — low load, no excuses
    soak_latency:         ['p(95)<300', 'p(99)<800'],
    soak_listing_latency: ['p(95)<400'],
    soak_detail_latency:  ['p(95)<400'],
  },
};

/**
 * Setup: build a diverse slug pool (up to 200 slugs across 4 pages).
 * @returns {{ slugs: string[], searchTerms: string[], startTime: number }}
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

  return {
    slugs: slugSet.size > 0 ? [...slugSet] : ['sample-product'],
    searchTerms: ['laptop', 'phone', 'shirt', 'tablet', 'watch', 'headphone'],
    startTime: Date.now(),
  };
}

/**
 * Default VU function — realistic browsing flow, longer think time than stress test.
 * @param {{ slugs: string[], searchTerms: string[], startTime: number }} data
 */
export default function (data) {
  const slug   = data.slugs[randomInt(0, data.slugs.length - 1)];
  const term   = data.searchTerms[randomInt(0, data.searchTerms.length - 1)];
  const window = timeWindow(data.startTime);
  const taggedParams = { ...httpParams, tags: { window } };

  // 1. Categories
  group('categories', () => {
    const res = http.get(`${BASE_URL}/api/categories`, taggedParams);
    soakLatency.add(res.timings.duration, { window });
    const ok = check(res, { 'categories 200': (r) => r.status === 200 });
    soakErrors.add(!ok);
  });

  sleep(0.3);

  // 2. Product listing (wider pagination — tests more cache keys over time)
  group('product_listing', () => {
    const offset = randomInt(0, 9) * 20;
    const res = http.get(
      `${BASE_URL}/api/public/products?limit=20&offset=${offset}&sort=newest`,
      taggedParams
    );
    soakLatency.add(res.timings.duration, { window });
    soakListingLatency.add(res.timings.duration, { window });
    const ok = check(res, { 'listing 200': (r) => r.status === 200 });
    soakErrors.add(!ok);
  });

  sleep(0.3);

  // 3. Search — 20% probability, exercises a distinct cache key namespace
  if (Math.random() < 0.2) {
    group('search', () => {
      const res = http.get(
        `${BASE_URL}/api/public/products?search=${term}&limit=20`,
        taggedParams
      );
      soakLatency.add(res.timings.duration, { window });
      const ok = check(res, { 'search 200': (r) => r.status === 200 });
      soakErrors.add(!ok);
    });
    sleep(0.3);
  }

  // 4. Product detail
  group('product_detail', () => {
    const res = http.get(`${BASE_URL}/api/public/products/${slug}`, taggedParams);
    soakLatency.add(res.timings.duration, { window });
    soakDetailLatency.add(res.timings.duration, { window });
    const ok = check(res, {
      'detail 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    soakErrors.add(!ok);
  });

  // Longer think time than stress — 30 VUs at realistic browsing pace
  sleep(randomInt(3, 7));
}
