# ADR-0019: OpenTelemetry and Jaeger for Distributed Tracing

## Status
Accepted

## Context
A single user request in a microservices platform may traverse the api-gateway,
auth-service, product-service, and order-service before returning a response.
When a request is slow or fails, logs alone cannot show which service introduced
the latency or where the error originated. Distributed tracing correlates spans
across service boundaries into a single request timeline.

## Decision
We adopted OpenTelemetry as the instrumentation standard and Jaeger as the trace
backend. Jaeger is deployed as `jaeger-all-in-one` (in-memory storage) for
development and staging.

**Infrastructure:**
- Jaeger all-in-one K8s manifest at `infrastructure/tracing/jaeger-all-in-one.yaml`
- Ports: 16686 (UI), 4317 (OTLP gRPC), 4318 (OTLP HTTP), 6831 (Jaeger Thrift UDP)
- In-memory storage, max 10,000 traces (not for production — requires Elasticsearch
  or Cassandra backend for persistent storage)
- Jaeger UI accessible at `jaeger.tec-shop.internal` (internal ingress)
- Jaeger itself exposes Prometheus metrics at port 14269/metrics

**Service instrumentation:**
- `@opentelemetry/auto-instrumentations-node` instruments HTTP, TCP, and database calls automatically
- `@opentelemetry/exporter-trace-otlp-http` exports spans to Jaeger via OTLP HTTP
- A shared `@tec-shop/tracing` library (`libs/shared/tracing`) exposes `initializeTracing(serviceName)`
- Every backend service calls `initializeTracing()` as the very first statement in `main.ts`,
  before any other imports, ensuring all auto-instrumentation patches are applied at startup
- Tracing is opt-in via `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable; if unset,
  `initializeTracing()` returns early with no overhead

## Alternatives Considered
- **Zipkin** — simpler than Jaeger but less feature-rich UI and no native
  OpenTelemetry OTLP receiver; requires a bridge.
- **Datadog APM / New Relic** — SaaS tracing with minimal setup. Rejected for
  development due to cost; the OpenTelemetry instrumentation layer is vendor-neutral,
  so switching to Datadog in production is possible without re-instrumenting services.
- **AWS X-Ray** — tightly coupled to AWS infrastructure. Rejected to avoid cloud
  vendor lock-in; OpenTelemetry + Jaeger runs anywhere.

## Consequences
- **Positive:** OpenTelemetry is a vendor-neutral standard — traces can be exported
  to Jaeger, Datadog, Honeycomb, or any OTLP-compatible backend without changing
  application code.
- **Negative:** In-memory Jaeger storage is not suitable for production; a persistent
  backend (Elasticsearch or Cassandra) must be configured before enabling in production;
  auto-instrumentation adds startup overhead.

## Trade-offs
In-memory storage was accepted for development/staging to keep the infrastructure
simple. The OpenTelemetry vendor-neutral standard was chosen over a vendor-specific
SDK to preserve the ability to switch trace backends independently of application
instrumentation.
