# TecShop

![Performance](https://img.shields.io/badge/performance-p95%20190ms-brightgreen)
![NestJS](https://img.shields.io/badge/NestJS-e0234e?style=flat-square&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-231F20?style=flat-square&logo=apachekafka&logoColor=white)

A modern, secure, and scalable multi-vendor e-commerce platform built with a microservices architecture. Demonstrates enterprise-grade patterns including mutual TLS, real-time communication, collaborative filtering recommendations, and event-driven analytics.

![TecShop Demo](GitVisuals/tecshop.gif)

## System Architecture Diagram

![Architecture Design](GitVisuals/archtecture%20system%20design%20microservice.gif)

## Kanban Board

The project is managed using the Kanban methodology via Jira, with tasks tracked across backlog, in-progress, review, and done columns.

![Kanban Board](GitVisuals/kanban-tecshop.png)

![Kanban Workflow](GitVisuals/kanbanworkflow.png)

# Technology Stack

![NestJS](https://img.shields.io/badge/NestJS-e0234e?style=for-the-badge&logo=nestjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Nx](https://img.shields.io/badge/Nx-143055?style=for-the-badge&logo=nx&logoColor=white)

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)

![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![k6](https://img.shields.io/badge/k6-7D64FF?style=for-the-badge&logo=k6&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white)

## Backend

- **Framework**: NestJS 11 with TypeScript — API gateway (HTTP, port 8080) is the only public-facing service; all others communicate over TCP with mutual TLS
- **Databases**: MongoDB via Prisma (auth, user, seller, product, notification, logger, chatting, analytics — separate schema + generated client per service); PostgreSQL via Prisma + Neon (order schema only, for financial integrity)
- **Caching & Sessions**: Redis (`ioredis`) via shared `@tec-shop/redis-client`
- **Message Broker**: Apache Kafka for async analytics and notification events; `kafka-service` is the sole consumer
- **Authentication**: JWT with Passport (`passport-jwt`) — access tokens (15 min) + refresh tokens (7–30 days) as httpOnly cookies; Google OAuth 2.0 via custom TCP RPC (`auth-google-login` message pattern)
- **Background Jobs**: BullMQ (backed by Redis) — recommendation model training, async dispatch
- **Payments**: Stripe (Checkout Sessions, Connect onboarding, webhooks)
- **Real-Time**: Socket.IO for chat (`chatting-service`, port 6007 WS) and live notifications
- **File Uploads**: ImageKit CDN via shared `@tec-shop/imagekit`
- **Logging**: Structured JSON logging with `nestjs-pino` + Pino across all services
- **Observability**: OpenTelemetry distributed tracing + Prometheus metrics (per-service HTTP at ports 9001–9010) + Sentry error monitoring
- **Resilience**: Circuit breaker (Opossum) wrapping all gateway→service TCP calls + 3-tier rate limiting (`ConditionalThrottlerGuard`)
- **Documentation**: Swagger / OpenAPI at `/api-docs`
- **Machine Learning**: TensorFlow.js collaborative filtering model for product recommendations, trained asynchronously via BullMQ

## Frontend

- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS with custom design tokens per app + `class-variance-authority` for variant management
- **State Management**: TanStack Query (server state) + Zustand with persist middleware (client state, cart/wishlist)
- **Forms**: TanStack Form + Zod validation
- **Internationalization**: `next-intl` v4 with URL-based locale routing (`/en/`, `/ptbr/`)
- **UI Components**: Custom-built with Tailwind — one Radix primitive (`@radix-ui/react-checkbox`) + Lucide icons; everything else (Button, Input, Select, Modal, Alert) hand-rolled from native HTML elements
- **Animations**: Framer Motion (checkbox, section transitions)
- **Charts**: Recharts (seller dashboard) + React-ApexCharts (admin dashboard)
- **Carousel**: Embla Carousel (hero section)
- **Rich Text Editing**: TipTap (seller/admin product descriptions)
- **File Uploads**: ImageKit CDN integration
- **Notifications**: Sonner toast messages

## Infrastructure

- **Monorepo**: Nx workspace with module boundary enforcement (ESLint)
- **Testing**: Jest with per-service test suites
- **Linting**: ESLint with TypeScript and Nx boundary rules
- **DevOps**: Docker multi-stage builds, Kubernetes + Helm chart
- **Observability**: Prometheus + Grafana (metrics), OpenTelemetry (tracing), Sentry (error tracking)
- **Load Testing**: k6 with baseline / stress / soak scenarios
- **Package Management**: pnpm workspaces

## Security

- **Mutual TLS (mTLS)**: Certificate-based service-to-service authentication over TCP
- **JWT Authentication**: Stateless access + refresh token rotation with httpOnly cookies
- **HMAC Inter-Service Auth**: `SERVICE_MASTER_SECRET`-derived signatures with constant-time comparison (`timingSafeEqual`)
- **Role-Based Access Control**: `ADMIN`, `SELLER`, `CUSTOMER` roles enforced via `RolesGuard`
- **Rate Limiting**: Three-tier throttling (short / medium / long), environment-aware limits, bypass with `LOAD_TEST=true`
- **Security Headers**: Helmet (CSP, HSTS, XSS protection)
- **Input Validation**: class-validator + class-transformer DTOs
- **Password Security**: argon2id hashing
- **Token Blacklisting**: Redis-backed refresh token revocation

---

## Documentation

| Topic                                                  | Description                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| [Architecture](docs/architecture.md)                   | Services, request flow, database decisions, shared libraries  |
| [Features](docs/features.md)                           | Auth, marketplace, orders, real-time, recommendations, i18n   |
| [Getting Started](docs/getting-started.md)             | Prerequisites, initial setup, Workflows A / B / C             |
| [Commands](docs/commands.md)                           | All pnpm, Nx, Docker, Prisma, and cert commands               |
| [Environment Variables](docs/environment-variables.md) | Required and optional variables, production config            |
| [API](docs/api.md)                                     | Swagger/OpenAPI, endpoint groups, WebSocket endpoints         |
| [Security](docs/security.md)                           | Auth flow, cookies, rate limiting, data protection, mTLS      |
| [Performance](docs/performance.md)                     | Benchmarks, Redis cache-aside, gzip, load testing             |
| [Deployment](docs/deployment.md)                       | Docker Compose, kind, Oracle Cloud (k3s), rollback, checklist |
| [Troubleshooting](docs/troubleshooting.md)             | Common issues across all three workflows                      |
| [Resources](docs/resources.md)                         | Acknowledgments and learning resources                        |

---

## License

[MIT](https://choosealicense.com/licenses/mit/)
