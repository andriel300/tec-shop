# ADR-0013: Prometheus and Grafana for Observability

## Status
Accepted

## Context
With 12 backend services, understanding system health, request latency, error rates,
and resource utilisation requires a standardised observability stack. Ad-hoc logging
alone is insufficient for diagnosing performance regressions or capacity planning.

## Decision
We adopted Prometheus for metrics collection and Grafana for visualisation, integrated
via the `@tec-shop/metrics` shared library. The observability stack also includes
Jaeger for distributed tracing via OpenTelemetry.

**Architecture:**
- Each NestJS service is a hybrid application exposing `/metrics` on a dedicated port
  (metrics port = service port + 3000, e.g., auth: 9001, user: 9002, ...)
- `MetricsModule` calls `collectDefaultMetrics()` on init (Node.js process metrics)
- `HttpMetricsInterceptor` records `http_request_duration_seconds` histogram on
  the API Gateway (entry point for all external traffic)
- `MetricsController` exposes `GET /metrics` in Prometheus text format
- Prometheus scrapes all services via `prometheus.dev.yml` using
  `host.docker.internal` targets when running in Docker

**Infrastructure (docker-compose.infra.yml):**
- Prometheus at `http://localhost:9090`
- Grafana at `http://localhost:3030` (admin/admin)
- Jaeger at `http://localhost:16686`
- Kafka UI at `http://localhost:8090`

## Alternatives Considered
- **Datadog / New Relic** — comprehensive SaaS observability. Rejected for
  development due to cost; can be added for production without changing the
  instrumentation layer (OpenTelemetry-compatible).
- **Application-level logging only** — insufficient for identifying latency
  trends, error rate spikes, or memory leaks without metric aggregation.

## Consequences
- **Positive:** Standardised metrics across all services; Grafana dashboards
  provide at-a-glance system health; OpenTelemetry allows future export to any
  compatible backend (Datadog, Honeycomb, etc.).
- **Negative:** Each service must be a hybrid NestJS app (TCP + HTTP) to expose
  the `/metrics` endpoint; adds a metrics port per service.

## Trade-offs
The hybrid app pattern (additional HTTP listener per service) was accepted as
a reasonable cost for standardised, pull-based metrics collection that is
compatible with any Prometheus-compatible backend.
