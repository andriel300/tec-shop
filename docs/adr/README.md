# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for TecShop.

ADRs document significant architectural decisions: the context that led to them,
the decision made, alternatives considered, and the consequences. They are written
retrospectively in past tense where the decision has already been implemented.

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [0001](./0001-microservices-architecture-with-nestjs.md) | Microservices Architecture with NestJS | Accepted |
| [0002](./0002-nx-monorepo.md) | Nx Monorepo for Multi-Service Development | Accepted |
| [0003](./0003-tcp-transport-for-inter-service-communication.md) | TCP Transport for Inter-Service Communication | Accepted |
| [0004](./0004-mongodb-per-service-datastore.md) | MongoDB as Per-Service Datastore | Accepted |
| [0005](./0005-postgresql-for-order-service.md) | PostgreSQL (Neon) for Order Service | Accepted |
| [0006](./0006-mtls-for-service-to-service-security.md) | mTLS for Service-to-Service Security | Accepted |
| [0007](./0007-hmac-inter-service-authentication.md) | HMAC-Based Inter-Service Authentication | Accepted |
| [0008](./0008-jwt-with-httponly-cookies.md) | JWT Authentication with httpOnly Cookies | Accepted |
| [0009](./0009-redis-for-caching-sessions-blacklist.md) | Redis for Caching, Sessions, and Token Blacklisting | Accepted |
| [0010](./0010-kafka-for-event-streaming.md) | Kafka for Asynchronous Event Streaming | Accepted |
| [0011](./0011-react-query-and-zustand-for-frontend-state.md) | React Query and Zustand for Frontend State Management | Accepted |
| [0012](./0012-imagekit-for-media-storage.md) | ImageKit for Media Storage and Transformation | Accepted |
| [0013](./0013-prometheus-grafana-observability.md) | Prometheus and Grafana for Observability | Accepted |
| [0014](./0014-next-intl-for-i18n.md) | next-intl for Internationalisation | Accepted |
| [0015](./0015-stripe-for-payments.md) | Stripe for Payment Processing and Seller Payouts | Accepted |
| [0016](./0016-docker-multi-stage-builds.md) | Docker with Multi-Stage Builds | Accepted |
| [0017](./0017-kubernetes-for-container-orchestration.md) | Kubernetes for Container Orchestration | Accepted |
| [0018](./0018-helm-for-kubernetes-packaging.md) | Helm for Kubernetes Package Management | Accepted |
| [0019](./0019-opentelemetry-and-jaeger-for-distributed-tracing.md) | OpenTelemetry and Jaeger for Distributed Tracing | Accepted |
| [0020](./0020-nginx-ingress-controller.md) | Nginx Ingress Controller as Kubernetes Edge Router | Accepted |

## ADR Format

Each ADR follows this structure:

- **Status**: Accepted / Deprecated / Superseded by ADR-XXXX
- **Context**: The problem or situation that required a decision
- **Decision**: What was decided and how it was implemented
- **Alternatives Considered**: Other options evaluated and why they were rejected
- **Consequences**: Positive and negative outcomes
- **Trade-offs**: The explicit trade-off accepted in making this decision

## Adding a New ADR

1. Copy an existing ADR as a template
2. Number it sequentially (next: 0021)
3. Use a descriptive kebab-case filename
4. Add a row to the index table above
