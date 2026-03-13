/// <reference types="k6" />
/// <reference types="k6/http" />

/**
 * Baseline scenario — steady 50 concurrent users for 2 minutes.
 *
 * Purpose: establish the unoptimized performance baseline before any caching
 * or compression changes are applied.  Run this first and record the numbers.
 *
 * Flow per VU (simulates a marketplace visitor):
 *   1. GET /api/categories                        (navigation menu)
 *   2. GET /api/public/products?limit=20&offset=0 (product listing page)
 *   3. GET /api/public/products?search=<term>     (search)
 *   4. GET /api/public/products/<slug>            (product detail page)
 *   5. sleep 2–4s                                 (reading time)
 *
 * Run:
 *   k6 run load-testing/scenarios/baseline.js
 *
 * With custom base URL:
 *   BASE_URL=http://staging.example.com k6 run load-testing/scenarios/baseline.js
 *
 * Export results to JSON for comparison:
 *   k6 run --out json=load-testing/results/baseline.json load-testing/scenarios/baseline.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, thresholds, httpParams, randomInt } from '../k6.config.js';

// Custom metrics — collected in addition to the built-in k6 metrics
const productListLatency = new Trend('product_list_duration', true);
const productDetailLatency = new Trend('product_detail_duration', true);
const searchLatency = new Trend('search_duration', true);
const categoryFetchErrors = new Rate('category_fetch_errors');
const totalRequests = new Counter('total_requests');

export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
    },
  },
  thresholds: {
    ...thresholds,
    // Tighter latency target specifically for the product listing critical path
    product_list_duration: ['p(95)<400'],
    product_detail_duration: ['p(95)<400'],
    search_duration: ['p(95)<500'],
  },
};

/**
 * Setup: fetch one page of products to collect real slugs for detail-page calls.
 * Runs once before VUs start.
 * @returns {{ slugs: string[], searchTerms: string[] }}
 */
export function setup() {
  const res = http.get(`${BASE_URL}/api/public/products?limit=20&offset=0`, httpParams);

  /** @type {string[]} */
  let slugs = ['sample-product'];

  if (res.status === 200) {
    try {
      const body = JSON.parse(res.body);
      const products = body.products || [];
      if (products.length > 0) {
        slugs = products.map((p) => p.slug).filter(Boolean);
      }
    } catch (_) {
      // fallback slug
    }
  }

  return {
    slugs,
    searchTerms: ['laptop', 'phone', 'shirt', 'shoe', 'headphone'],
  };
}

/**
 * Default VU function — runs once per iteration per VU.
 * @param {{ slugs: string[], searchTerms: string[] }} data
 */
export default function (data) {
  const slug = data.slugs[randomInt(0, data.slugs.length - 1)];
  const term = data.searchTerms[randomInt(0, data.searchTerms.length - 1)];

  // 1. Categories (navigation menu load)
  group('categories', () => {
    totalRequests.add(1);
    const res = http.get(`${BASE_URL}/api/categories`, httpParams);
    const ok = check(res, {
      'categories 200': (r) => r.status === 200,
    });
    categoryFetchErrors.add(!ok);
  });

  sleep(0.2);

  // 2. Product listing page
  group('product_listing', () => {
    totalRequests.add(1);
    const res = http.get(
      `${BASE_URL}/api/public/products?limit=20&offset=0&sort=newest`,
      httpParams
    );
    productListLatency.add(res.timings.duration);
    check(res, {
      'product list 200': (r) => r.status === 200,
      'has products array': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body).products);
        } catch (_) {
          return false;
        }
      },
    });
  });

  sleep(0.3);

  // 3. Search
  group('search', () => {
    totalRequests.add(1);
    const res = http.get(
      `${BASE_URL}/api/public/products?search=${term}&limit=20`,
      httpParams
    );
    searchLatency.add(res.timings.duration);
    check(res, {
      'search 200': (r) => r.status === 200,
    });
  });

  sleep(0.3);

  // 4. Product detail page
  group('product_detail', () => {
    totalRequests.add(1);
    const res = http.get(`${BASE_URL}/api/public/products/${slug}`, httpParams);
    productDetailLatency.add(res.timings.duration);
    check(res, {
      'product detail 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
  });

  // Reading time between page visits
  sleep(randomInt(2, 4));
}
