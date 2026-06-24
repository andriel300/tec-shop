# TecShop

![Performance](https://img.shields.io/badge/performance-p95%20190ms-brightgreen)
![NestJS](https://img.shields.io/badge/NestJS-e0234e?style=flat-square&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-231F20?style=flat-square&logo=apachekafka&logoColor=white)

A modern, secure, and scalable multi-vendor e-commerce platform built with a microservices architecture. Demonstrates enterprise-grade patterns including mutual TLS, real-time communication, collaborative filtering recommendations, and event-driven analytics.

## Architecture

This repository contains two architectural approaches:

### Main Branch — Microservices

Production-grade microservices architecture designed for scalability, resilience,
and observability in cloud-native environments:

- **API Gateway** — Central entry point routing requests to downstream services
- **10+ backend services** — Auth, User, Seller, Product, Order, Admin, Chatting,
  Logger, Recommendation, Kafka, Notification
- **Event-driven communication** — Apache Kafka for async workflows and analytics
- **Real-time capabilities** — WebSocket-based chat and logging
- **Service mesh ready** — Mutual TLS (mTLS) between all services
- **Recommendation engine** — Collaborative filtering with TensorFlow
- **Observability stack** — Prometheus, Grafana, Tempo, OpenTelemetry tracing
- **Kubernetes-native** — Helm charts for deployment to any K8s cluster (kind, k3s,
  Oracle Cloud)
- **Database per service** — MongoDB (via MongoDB Atlas) and PostgreSQL (via Neon)
  with per-service Prisma schemas

### Mono-API Branch — Simplified Deployment

A consolidated deployment-oriented version created to reduce infrastructure costs
while preserving the core business functionality of the marketplace:

- **Single NestJS application** — All REST endpoints consolidated into one process
- **Single PostgreSQL database** — Unified Prisma schema across all domains
- **Redis caching** — Shared Redis instance for cache-aside and rate limiting
- **Reduced resource footprint** — One backend container instead of ten
- **Lower operational complexity** — No Kafka, no mTLS, no service orchestration

**Core capabilities preserved:**

- Authentication (JWT, TOTP, session management)
- Product catalog with search and categorization
- Seller management and multi-vendor workflows
- Order processing and history
- Admin dashboard and user management
- Brand and category management
- Rate limiting and security controls

#### Getting Started with Mono-API

The mono-api runs as a standalone Docker Compose stack with infrastructure
(Redis, Kafka) and all three frontends (User UI, Seller UI, Admin UI):

```bash
# Prerequisites
cp .env.example .env            # Configure DATABASE_URL, JWT_SECRET
pnpm install                    # Install dependencies
pnpm prisma:generate            # Generate Prisma client
./generate-certs.sh --all       # Generate mTLS certificates

# Start everything
pnpm mono:up:build              # Build and start (first run)
pnpm mono:up                    # Start without rebuild (subsequent runs)
pnpm mono:logs                  # Tail logs
pnpm mono:down                  # Stop and clean up
```

For host-based development with hot reload:

```bash
pnpm infra:up                   # Start Redis + Kafka + Zookeeper
npx nx build mono-api           # Build the application
npx nx serve mono-api           # Start with hot reload (port 8080)
```

> **Choosing an approach:** Use the main branch microservices for production
> deployments requiring scalability, real-time features, or the full observability
> stack. Use the mono-api for cost-conscious deployments, demo environments,
> or simplified local development where the full microservice surface is not needed.

---

## Documentation

| Topic                                                  | Description                                                     |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| [Technology Stack](docs/tech-stack.md)                 | Badges, backend, frontend, infrastructure, and security choices |
| [Architecture](docs/architecture.md)                   | Services, request flow, database decisions, shared libraries    |
| [Features](docs/features.md)                           | Auth, marketplace, orders, real-time, recommendations, i18n     |
| [Getting Started](docs/getting-started.md)             | Prerequisites, initial setup, Workflows A / B / C / D           |
| [Commands](docs/commands.md)                           | All pnpm, Nx, Docker, Prisma, and cert commands                 |
| [Environment Variables](docs/environment-variables.md) | Required and optional variables, production config              |
| [API](docs/api.md)                                     | Swagger/OpenAPI, endpoint groups, WebSocket endpoints           |
| [Security](docs/security.md)                           | Auth flow, cookies, rate limiting, data protection, mTLS        |
| [Performance](docs/performance.md)                     | Benchmarks, Redis cache-aside, gzip, load testing               |
| [Deployment](docs/deployment.md)                       | Docker Compose, kind, Oracle Cloud (k3s), rollback, checklist   |
| [Troubleshooting](docs/troubleshooting.md)             | Common issues across all three workflows                        |
| [Resources](docs/resources.md)                         | Acknowledgments and learning resources                          |

---

## License

[MIT](https://choosealicense.com/licenses/mit/)
