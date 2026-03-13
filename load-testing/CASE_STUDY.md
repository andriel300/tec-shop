# TecShop Load Testing Case Study

Multi-vendor marketplace platform — performance under concurrent user load.

---

## Architecture Under Test

```
Browser / k6 VU
      |
      v
api-gateway :8080  (NestJS, HTTP, REST)
      |  TCP + mTLS
      v
product-service :6004  (NestJS, TCP microservice)
      |
      v
MongoDB Atlas  (cloud database, ~20ms network round-trip)
```

Redis is used for session storage and throttle counters but not for response
caching on the product listing endpoints in the baseline configuration.

---

## Test Environment

| Item        | Value                             |
| ----------- | --------------------------------- |
| Platform    | Local dev machine (pnpm run dev)  |
| api-gateway | <http://localhost:8080>             |
| Database    | MongoDB Atlas (shared cluster)    |
| Redis       | Docker container (localhost:6379) |
| k6 version  | >= 0.49.0                         |
| Node.js     | >= 20                             |

---

## Endpoints Tested

| Endpoint                               | Auth | Throttler |
| -------------------------------------- | ---- | --------- |
| GET /api/categories                    | none | long      |
| GET /api/public/products?limit=20      | none | long      |
| GET /api/public/products?search=laptop | none | long      |
| GET /api/public/products/:slug         | none | long      |

The `long` throttler allows **2000 req/min per IP** in development mode.
All k6 VUs share one IP, so this limit applies to the total across all VUs.

### Bypassing the throttler for load tests

The api-gateway uses `ConditionalThrottlerGuard` which reads `LOAD_TEST` from
`.env` at request time. Set it to `true` before testing and `false` after:

```bash
# In root .env
LOAD_TEST=true   # bypasses all throttle checks during the test
LOAD_TEST=false  # restore after — throttle is fully enforced again
```

Restart the api-gateway after changing the value so it picks up the new env.

---

## Prerequisites

```bash
# Install k6
# macOS
brew install k6

# Linux
## Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Arch linux
paru -S k6
yay -S k6

# Verify
k6 version
```

or go to [https://grafana.com/docs/k6/latest/set-up/install-k6/](/url)

## Running the Tests

```bash
# 1. Start infrastructure
pnpm run infra:up

# 2. Start all services
pnpm run dev

# 3. Run baseline (50 VUs, 2 min)
k6 run load-testing/scenarios/baseline.js

# 4. Run stress test (ramp to 500 VUs, 10 min)
#    Raise throttler limit first (see above)
k6 run load-testing/scenarios/stress.js

# 5. Run spike test (spike to 500 VUs, ~5 min total)
k6 run load-testing/scenarios/spike.js

# Save results for comparison
mkdir -p load-testing/results
k6 run --out json=load-testing/results/baseline.json    load-testing/scenarios/baseline.js
k6 run --out json=load-testing/results/stress.json      load-testing/scenarios/stress.js
k6 run --out json=load-testing/results/spike.json       load-testing/scenarios/spike.js

# Push live metrics to Prometheus during the test (optional)
# Requires Prometheus remote-write receiver enabled
k6 run --out experimental-prometheus-rw load-testing/scenarios/stress.js
```

---

## Methodology

1. **Baseline** — establish unoptimized numbers with the system under 50
   concurrent users for 2 minutes. This is the "before" state.

2. **Stress** — ramp traffic to 500 VUs. Identify the concurrency level
   where p95 latency exceeds 300ms or error rate rises above 0.1%.

3. **Spike** — simulate a sudden flash-sale burst. Validate that the system
   absorbs the spike without persistent errors and recovers within 2 minutes.

4. **Optimize** — apply the changes listed in the Optimization section.

5. **Re-run baseline** — confirm the improvements.

All scenarios test only public, unauthenticated endpoints to isolate database
and microservice performance from authentication overhead.

---

## Baseline Results (Before Optimization)

Measured with `baseline.js` — 50 VUs, 2 minutes, no caching, no compression.

| Metric                   | Measured Value | SLO Target |
| ------------------------ | -------------- | ---------- |
| p50 latency              | 770 ms         | —          |
| p95 latency              | 1740 ms        | < 300ms    |
| p99 latency              | 2160 ms        | < 800ms    |
| Max RPS sustained        | 26.5 req/s     | —          |
| Error rate               | 0.00%          | < 0.1%     |
| Avg product listing time | 1000 ms        | —          |
| Avg product detail time  | 1190 ms        | —          |
| Avg search time          | 1210 ms        | —          |

Root cause: every request traverses the full
api-gateway → TCP → product-service → MongoDB Atlas chain with no caching.
Under 50 VUs, connection pool saturation at Atlas drives p95 above 1.7s.

---

## Stress Test Results

Ramp profile: 0 → 50 → 200 → 500 → 500 → 0 VUs over 10 minutes.

| Metric                           | Measured Value |
| -------------------------------- | -------------- |
| Total requests                   | 37,168         |
| Error rate                       | 0.00%          |
| Throughput                       | 61.7 req/s     |
| http_req_duration p50 (overall)  | 184 ms         |
| http_req_duration p95 (overall)  | 13,970 ms      |
| http_req_duration p99 (overall)  | 16,950 ms      |
| Cached listing p95 (500 VUs)     | 472 ms         |
| Cached listing median            | 184 ms         |

**Breaking point analysis:**

The overall p95 of ~14s is misleading — it conflates two very different
endpoint classes under the stress scenario's traffic mix (60% listing,
30% detail, 10% search):

| Endpoint class     | Caching | p95 at 500 VUs | Notes                         |
| ------------------ | ------- | -------------- | ----------------------------- |
| Product listing    | Redis   | 472 ms         | Stays within 1s SLO even at 500 VUs |
| Product detail     | None    | ~14 s+         | Every request hits Atlas      |
| Search             | None    | ~14 s+         | Every request hits Atlas      |

The cached listing endpoint degrades gracefully. The breaking point for
uncached endpoints is between 50 VUs (190ms, within SLO) and 200 VUs —
Atlas connection pool saturation under 200+ concurrent uncached requests.

**Key resilience finding:** The system completed 37,168 requests at up to
500 VUs with **zero errors**. It degrades gracefully under extreme load
rather than crashing or returning 5xx responses.

---

## Stress Test After Results

Fill in after re-running `stress.js` with product detail caching added.

| Metric                        | Before (detail uncached) | After (all endpoints cached) | Improvement |
| ----------------------------- | ------------------------ | ---------------------------- | ----------- |
| http_req_duration p95         | 13,970 ms                | 195 ms                       | **-98.6%**  |
| http_req_duration p99         | 16,950 ms                | 408 ms                       | **-97.6%**  |
| Product listing p95 (500 VUs) | 472 ms                   | 195 ms                       | **-58.7%**  |
| Throughput (req/s)            | 61.7                     | 135.4                        | **+119.5%** |
| Total requests completed      | 37,168                   | 81,659                       | **+119.7%** |
| Error rate                    | 0.00%                    | 0.00%                        | —           |
| Thresholds passed             | 2 / 4                    | 4 / 4                        | All green   |

**Trade-off:** Product detail view counter increments only on cache misses (at most
once per 30s per slug). Accepted trade-off — accuracy of view analytics is lower
priority than response time under load.

---

## Spike Test Results

Profile: 0 → 500 VUs in 30s, hold 1m, drop to 50 VUs, hold 2m recovery, cool-down.

| Phase                         | Value          |
| ----------------------------- | -------------- |
| spike_latency p95             | 211 ms ✓       |
| spike_latency median          | 188 ms         |
| spike_latency max             | 15,600 ms      |
| http_req_failed               | 0.00%          |
| spike_errors (response > 2s)  | 0.12% (48/38854) |
| Throughput during spike       | 142.8 req/s    |
| Total requests                | 38,855         |

**What the 48 errors represent:** During the first 30 seconds as 500 VUs simultaneously
hit cold-cache paths, some requests landed on Atlas before the cache warmed. These
48 responses exceeded 2s — 0.12% of total checks. All were HTTP 200 (data received,
just slow). No 4xx or 5xx errors occurred.

**Recovery:** Once the initial spike wave populated the cache (within ~30s of first
hit per slug/query), the median dropped back to 188ms and stayed there for the
remainder of the test. The cache-aside pattern self-heals — no manual intervention
or warm-up job required.

---

## Identified Bottlenecks

Based on the baseline and stress results, the primary bottlenecks are:

1. **No response caching** — every product listing request traverses the full
   api-gateway → TCP → product-service → MongoDB Atlas chain. A 20ms Atlas
   round-trip at 200 concurrent connections saturates the connection pool.

2. **No response compression** — JSON payloads from the product listing
   endpoint are large (20 products × full product objects). Compressing
   responses reduces bytes transferred and client-side parse time.

3. **TCP connection overhead** — each API Gateway request opens a TCP
   connection to the product microservice. Under burst load, connection
   establishment adds latency.

---

## Optimizations Applied

### 1. Redis caching on product listing (60s TTL)

Cache the product listing response in Redis keyed by the full query string.
On a cache hit, the api-gateway returns the response without calling the
product-service or MongoDB.

Expected improvement: p95 drops from ~400ms to ~5–20ms (Redis lookup) on
cached routes. Cache hit rate for the default `?limit=20&sort=newest` query
will be high under realistic traffic patterns.

Implementation location:
`apps/api-gateway/src/app/public/public-products.controller.ts`

Add `RedisService` injection, generate a cache key from query params, check
before proxying, and set with `redis.set(key, json, 'EX', 60)`.

### 2. HTTP response compression (gzip)

Add the `compression` middleware to `apps/api-gateway/src/main.ts` before
other middleware.

```bash
pnpm add compression
pnpm add -D @types/compression
```

```typescript
// main.ts — add before app.enableCors(...)
import compression from 'compression';
app.use(compression());
```

Expected improvement: 60–70% reduction in response body size for JSON
endpoints. Visible as reduced transfer time, especially on slow connections.

---

## After Optimization Results

Measured with same `baseline.js` — 50 VUs, 2 minutes, Redis caching + gzip compression active.

| Metric             | Before   | After    | Improvement |
| ------------------ | -------- | -------- | ----------- |
| p50 latency        | 770 ms   | 187 ms   | -76%        |
| p95 latency        | 1740 ms  | 190 ms   | -89%        |
| p99 latency        | 2160 ms  | 1580 ms  | -27%        |
| Max sustained RPS  | 26.5     | 44.1     | +66%        |
| Completed iterations | 844    | 1386     | +64%        |

p99 remains at 1580ms — this represents cold cache misses (first request per unique
query set hits MongoDB Atlas). All subsequent requests for the same params return
from Redis in ~1-5ms, which drives p95 down to 190ms.

Note: `p(99)<800` threshold still fails due to the cold-start tail. This is expected
behavior for a cache-aside pattern. For a production workload, a cache warm-up job
or longer TTL would smooth the p99 further.

---

## Viewing Results in Grafana

1. Open Grafana: <http://localhost:3030> (admin / admin)
2. Open dashboard: **TecShop Platform Overview**
3. Scroll to the **Load Test Results** row at the bottom
4. Set the time range to the window when the test ran (top-right time picker)

Panels in the Load Test Results row:

- **p95 / p99 Latency** — histogram quantiles from `http_request_duration_seconds`
- **Requests Per Second** — total RPS and per-route breakdown
- **HTTP 5xx Error Rate** — fraction of requests returning server errors
- **Latency by Route (p95)** — p95 broken out per route to identify hot paths

During the stress test you should see a clear inflection point where latency
rises sharply as concurrency passes the breaking point.

---

## Key Findings Summary

Fill in after all tests are complete.

**Optimization impact:**
- Without caching, p95 was 1740ms at 50 VUs — 5.8x above the 300ms SLO
- Redis caching + gzip compression reduced p95 from 1740ms to 190ms (-89%)
- Throughput increased from 26.5 req/s to 44.1 req/s (+66%) with the same 50 VUs

**Resilience:**
- Error rate: 0% across all tests — zero 4xx/5xx responses
- System handled 500 VUs (37,168 requests) without crashing or returning errors
- Degrades gracefully: slow responses under extreme load, never failures

**Breaking point:**
- With full caching: no breaking point found up to 500 VUs — p95=195ms, all SLOs met
- Without detail caching: system breaks between 50–200 VUs (uncached Atlas queries saturate connection pool)
- The cache layer absorbs the load entirely; Atlas is only hit on cold misses

**Stress test summary (500 VUs, 10 minutes):**
- p95=195ms at 500 VUs — same as baseline p95 after optimization at 50 VUs
- The cache layer is so effective that concurrency has almost no effect on latency
- Throughput more than doubled: 61.7 → 135.4 req/s (+119%)

**Spike test (0→500 VUs in 30s):**
- p95=211ms throughout the spike — SLO maintained even during the burst
- 48 responses exceeded 2s during the cold-cache ramp (0.12% of requests) — all HTTP 200
- Self-healing: cache warms within 30s of first hit, median returns to 188ms with no intervention
- Zero HTTP errors across the entire spike scenario
