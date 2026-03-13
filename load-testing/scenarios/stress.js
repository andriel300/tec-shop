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
 * Per-stage breakdown:
 *   Every request is tagged with the current stage name (e.g. "peak_500").
 *   When using --out json or --out experimental-prometheus-rw, filter by the
 *   `stage` tag to isolate latency per concurrency level and pinpoint the
 *   exact breaking point without post-processing the raw numbers manually.
 *
 * PREREQUISITE — bypass the throttler before running:
 *   Set LOAD_TEST=true in root .env, restart api-gateway.
 *   Set LOAD_TEST=false and restart after testing.
 *
 * Run:
 *   k6 run load-testing/scenarios/stress.js
 *
 * Export to JSON for per-stage analysis:
 *   k6 run --out json=load-testing/results/stress.json load-testing/scenarios/stress.js
 *
 * Push metrics to Prometheus (requires remote-write enabled on port 9090):
 *   k6 run --out experimental-prometheus-rw load-testing/scenarios/stress.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, thresholds, httpParams, randomInt } from '../k6.config.js';

// Mark 404 as a non-failure — product detail slugs may not exist in the dataset
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 299 }, 404));

const listingLatency = new Trend('stress_listing_duration', true);
const detailLatency  = new Trend('stress_detail_duration',  true);
const searchLatency  = new Trend('stress_search_duration',  true);
const errorRate      = new Rate('stress_errors');

/**
 * Stage boundaries in seconds from test start, matching the stages array below.
 * Used to tag each request so per-stage latency is visible in Prometheus/JSON output.
 */
const STAGES = [
  { end:  60, name: 'warmup_50'    },
  { end: 180, name: 'moderate_200' },
  { end: 300, name: 'peak_500'     },
  { end: 480, name: 'sustained_500'},
  { end: 600, name: 'cooldown'     },
];

/** @param {number} startTime */
function stageAt(startTime) {
  const elapsed = (Date.now() - startTime) / 1000;
  for (const s of STAGES) {
    if (elapsed < s.end) return s.name;
  }
  return 'cooldown';
}

export const options = {
  stages: [
    { duration: '1m', target: 50  },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 500 },
    { duration: '3m', target: 500 },
    { duration: '2m', target: 0   },
  ],
  thresholds: {
    ...thresholds,
    stress_errors: ['rate<0.05'],           // allow up to 5% errors under peak stress
    stress_listing_duration: ['p(95)<1000'], // relaxed SLO for listing under stress
    stress_detail_duration:  ['p(95)<1000'], // relaxed SLO for detail under stress
  },
};

/**
 * Setup: fetch 4 pages to build a diverse slug pool (up to 200 unique slugs).
 * A larger pool prevents all VUs from cycling through the same few slugs,
 * which would make cache hit rates unrealistically high.
 *
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
    searchTerms: ['laptop', 'phone', 'tablet', 'watch', 'camera', 'headphone', 'shirt', 'shoe'],
    startTime: Date.now(),
  };
}

/**
 * Default VU function.
 * @param {{ slugs: string[], searchTerms: string[], startTime: number }} data
 */
export default function (data) {
  const slug  = data.slugs[randomInt(0, data.slugs.length - 1)];
  const term  = data.searchTerms[randomInt(0, data.searchTerms.length - 1)];
  const stage = stageAt(data.startTime);

  // Attach stage tag so per-stage latency is filterable in Prometheus/JSON output
  const taggedParams = { ...httpParams, tags: { stage } };

  // Weighted flow: 60% product listing, 30% product detail, 10% search
  const roll = Math.random();

  if (roll < 0.6) {
    group('product_listing', () => {
      const offset = randomInt(0, 9) * 20; // 10 pages — wider pagination diversity
      const res = http.get(
        `${BASE_URL}/api/public/products?limit=20&offset=${offset}&sort=newest`,
        taggedParams
      );
      listingLatency.add(res.timings.duration, { stage });
      const ok = check(res, { 'listing 200': (r) => r.status === 200 });
      errorRate.add(!ok);
    });
  } else if (roll < 0.9) {
    group('product_detail', () => {
      const res = http.get(`${BASE_URL}/api/public/products/${slug}`, taggedParams);
      detailLatency.add(res.timings.duration, { stage });
      const ok = check(res, {
        'detail 200 or 404': (r) => r.status === 200 || r.status === 404,
      });
      errorRate.add(!ok);
    });
  } else {
    group('search', () => {
      const res = http.get(
        `${BASE_URL}/api/public/products?search=${term}&limit=20`,
        taggedParams
      );
      searchLatency.add(res.timings.duration, { stage });
      const ok = check(res, { 'search 200': (r) => r.status === 200 });
      errorRate.add(!ok);
    });
  }

  // Short sleep — stress test intentionally keeps pressure high
  sleep(randomInt(1, 3));
}
