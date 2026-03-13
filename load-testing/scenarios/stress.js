/// <reference types="k6" />
/// <reference types="k6/http" />

/**
 * Stress scenario — ramp from 0 to 500 concurrent users over 10 minutes.
 *
 * Purpose: find the breaking point and observe how the system behaves under
 * sustained high load.  Answers: at what concurrency do p95 latencies exceed
 * SLO, and does the error rate stay below 0.1%?
 *
 * Stage plan:
 *   0 →  50 VUs  over 1 min   (warm-up)
 *  50 → 200 VUs  over 2 min   (moderate load)
 * 200 → 500 VUs  over 2 min   (peak load)
 * 500 → 500 VUs  for 3 min    (sustained peak — look for degradation)
 * 500 →   0 VUs  over 2 min   (cool-down)
 *
 * PREREQUISITE — raise the throttler limit before running:
 *   apps/api-gateway/src/app/app.module.ts
 *   long.limit: isDevelopment ? 50000 : 200
 *
 * Run:
 *   k6 run load-testing/scenarios/stress.js
 *
 * Export to JSON:
 *   k6 run --out json=load-testing/results/stress.json load-testing/scenarios/stress.js
 *
 * Push metrics to Prometheus (requires remote-write enabled on port 9090):
 *   k6 run --out experimental-prometheus-rw \
 *     load-testing/scenarios/stress.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, thresholds, httpParams, randomInt } from '../k6.config.js';

const productListLatency = new Trend('stress_product_list_duration', true);
const errorRate = new Rate('stress_errors');

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 500 },
    { duration: '3m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    ...thresholds,
    stress_errors: ['rate<0.05'], // allow up to 5% errors under peak stress
    stress_product_list_duration: ['p(95)<1000'], // relaxed SLO under stress
  },
};

/**
 * Setup: collect product slugs once before the test starts.
 * @returns {{ slugs: string[], searchTerms: string[] }}
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

  return {
    slugs,
    searchTerms: ['laptop', 'phone', 'tablet', 'watch', 'camera', 'headphone', 'shirt', 'shoe'],
  };
}

/**
 * Default VU function.
 * @param {{ slugs: string[], searchTerms: string[] }} data
 */
export default function (data) {
  const slug = data.slugs[randomInt(0, data.slugs.length - 1)];
  const term = data.searchTerms[randomInt(0, data.searchTerms.length - 1)];

  // Weighted flow: 60% product listing, 30% product detail, 10% search
  const roll = Math.random();

  if (roll < 0.6) {
    group('product_listing', () => {
      const offset = randomInt(0, 5) * 20;
      const res = http.get(
        `${BASE_URL}/api/public/products?limit=20&offset=${offset}&sort=newest`,
        httpParams
      );
      productListLatency.add(res.timings.duration);
      const ok = check(res, { 'listing 200': (r) => r.status === 200 });
      errorRate.add(!ok);
    });
  } else if (roll < 0.9) {
    group('product_detail', () => {
      const res = http.get(`${BASE_URL}/api/public/products/${slug}`, httpParams);
      const ok = check(res, {
        'detail 200 or 404': (r) => r.status === 200 || r.status === 404,
      });
      errorRate.add(!ok);
    });
  } else {
    group('search', () => {
      const res = http.get(
        `${BASE_URL}/api/public/products?search=${term}&limit=20`,
        httpParams
      );
      const ok = check(res, { 'search 200': (r) => r.status === 200 });
      errorRate.add(!ok);
    });
  }

  // Short sleep — stress test intentionally keeps pressure high
  sleep(randomInt(1, 3));
}
