# Performance

Redis cache-aside + gzip compression were applied to the public product catalog endpoints. All tests ran on a local dev machine against MongoDB Atlas (cloud) with 0% HTTP error rate throughout.

Full methodology, raw numbers, and before/after analysis: [View Full Case Study](../load-testing/CASE_STUDY.md)

## Benchmark Results

### Baseline — 50 concurrent users, 2 minutes

| Metric      | Before (no cache) | After (Redis + gzip) | Change   |
| ----------- | ----------------- | -------------------- | -------- |
| p50 latency | 770 ms            | 187 ms               | **-76%** |
| p95 latency | 1,740 ms          | 190 ms               | **-89%** |
| p99 latency | 2,160 ms          | 1,580 ms             | -27%     |
| Throughput  | 26.5 req/s        | 44.1 req/s           | **+66%** |

### Stress test — ramp 0 to 500 concurrent users, 10 minutes

| Metric             | Without detail cache | All endpoints cached | Change     |
| ------------------ | -------------------- | -------------------- | ---------- |
| p95 latency        | 13,970 ms            | 195 ms               | **-98.6%** |
| p99 latency        | 16,950 ms            | 408 ms               | **-97.6%** |
| Throughput         | 61.7 req/s           | 135.4 req/s          | **+119%**  |
| Requests completed | 37,168               | 81,659               | **+120%**  |
| Thresholds passed  | 2 / 4                | 4 / 4                | All green  |
| HTTP error rate    | 0.00%                | 0.00%                | —          |

### Spike test — 0 to 500 users in 30 seconds

| Metric                 | Result                                                        |
| ---------------------- | ------------------------------------------------------------- |
| p95 latency            | 211 ms                                                        |
| HTTP error rate        | 0.00%                                                         |
| Responses exceeding 2s | 0.12% (cold-cache spike)                                      |
| Recovery               | Self-healing — cache warms within 30s, no intervention needed |

## Optimizations Applied

### 1. Redis cache-aside on product catalog

All public product endpoints cache responses in Redis before proxying to the microservice. The first request per unique query set hits MongoDB Atlas; every subsequent request returns from Redis.

| Endpoint                               | Cache TTL | Rationale                                      |
| -------------------------------------- | --------- | ---------------------------------------------- |
| `GET /public/products` (listing)       | 60s       | Balances freshness with Atlas offload          |
| `GET /public/products/:slug` (detail)  | 30s       | Short so price/stock changes propagate quickly |
| `GET /public/products/filters/options` | 300s      | Color/size options change rarely               |

Trade-off: product view counters increment only on cache misses (at most once per TTL window per slug).

### 2. HTTP response compression (gzip)

`compression` middleware applied at the Express layer before all other middleware in `apps/api-gateway/src/main.ts`. Reduces JSON payload transfer size by 60–70% for product listing responses.

### 3. ConditionalThrottlerGuard — load-test-safe rate limiting

The API gateway uses a custom `ConditionalThrottlerGuard` that extends NestJS `ThrottlerGuard`. When `LOAD_TEST=true` is set in `.env`, the guard returns `true` immediately — bypassing Redis throttle counters without removing the `@Throttle()` decorators that document production limits.

```bash
LOAD_TEST=true   # disables throttle during k6 runs
LOAD_TEST=false  # re-enables full throttle enforcement
```

## Load Testing

Tests are in `load-testing/scenarios/` and use [k6](https://k6.io).

```bash
# Install k6 (Arch Linux)
paru -S k6

# Set LOAD_TEST=true in .env, then restart api-gateway

# Baseline — 50 VUs, 2 minutes
k6 run load-testing/scenarios/baseline.js

# Stress — ramp to 500 VUs, 10 minutes
k6 run load-testing/scenarios/stress.js

# Spike — 0 to 500 VUs in 30 seconds
k6 run load-testing/scenarios/spike.js

# Soak — 30 VUs sustained for 30 minutes (detects memory leaks, TTL cycling)
k6 run load-testing/scenarios/soak.js

# Set LOAD_TEST=false and restart api-gateway when done
```
