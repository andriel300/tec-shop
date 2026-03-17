# TecShop

![Performance](https://img.shields.io/badge/performance-p95%20190ms-brightgreen)

A modern, secure, and scalable multi-vendor e-commerce platform built with a microservices architecture. TecShop demonstrates enterprise-grade patterns including mutual TLS authentication, real-time communication, collaborative filtering recommendations, and event-driven analytics.

## Overview & DEMO

TecShop is a production-ready microservices-based e-commerce platform showcasing modern software architecture principles. The system implements a secure, scalable foundation suitable for enterprise applications with features like JWT authentication, refresh token rotation, social login, Stripe payments, real-time chat, AI-powered product recommendations, and comprehensive admin tooling.

I will add a video demo link later.

## Technology Stack

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

### Backend

- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Prisma ORM (separate schema and client per service)
- **Caching & Sessions**: Redis (`ioredis`) via `@tec-shop/redis-client`
- **Message Broker**: Apache Kafka for async analytics and notification events
- **Authentication**: JWT with Passport (local + Google OAuth 2.0 strategies)
- **Payments**: Stripe (Checkout Sessions, Connect, webhooks)
- **Real-Time**: Socket.IO for chat and live notifications
- **File Uploads**: ImageKit CDN integration
- **Logging**: Structured logging with `nestjs-pino` + Pino across all services
- **Documentation**: Swagger / OpenAPI at `/api-docs`
- **Machine Learning TensorFlowJS**: Collaborative filtering model for product recommendations

### Frontend

- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (server state) + Zustand (client state)
- **Forms**: TanStack Form + class-validator
- **Internationalization**: `next-intl` v4 with URL-based locale routing (`/en/`, `/ar/`)
- **UI Components**: Radix UI primitives + Lucide icons
- **Notifications**: Sonner toast messages

### Infrastructure

- **Monorepo**: Nx workspace with module boundary enforcement (ESLint)
- **Testing**: Jest with per-service test suites
- **Linting**: ESLint with TypeScript and NX boundary rules
- **DevOps**: Docker multi-stage builds, Kubernetes + Helm chart
- **Monitoring**: Prometheus, Grafana.
- **Load Testing** : K6s
- **Package Management**: pnpm workspaces

### Security Features

- **Mutual TLS (mTLS)**: Certificate-based service-to-service authentication
- **JWT Authentication**: Stateless access + refresh token rotation with httpOnly cookies
- **HMAC Inter-Service Auth**: `SERVICE_MASTER_SECRET`-derived signatures for cross-service calls
- **Role-Based Access Control**: `ADMIN`, `SELLER`, `CUSTOMER` roles enforced via `RolesGuard`
- **Rate Limiting**: Three-tier throttling (short / medium / long), environment-aware limits
- **Security Headers**: Helmet (CSP, HSTS, XSS protection)
- **Input Validation**: class-validator + class-transformer DTOs
- **Password Security**: bcrypt with configurable salt rounds
- **Token Blacklisting**: Redis-backed refresh token revocation

## Kanban Project Management Methodology

The project is managed using the Kanban methodology via Jira, with tasks tracked across backlog, in-progress, review, and done columns.

### Kanban Board

![Kanban Board](GitVisuals/kanban-tecshop.png)

### Kanban Workflow

![Kanban Workflow](GitVisuals/kanbanworkflow.png)

## Architecture

### Microservices Design

| Service                    | Port | Type     | Responsibility                                              |
| -------------------------- | ---- | -------- | ----------------------------------------------------------- |
| **API Gateway**            | 8080 | REST     | Central entry point, routing, rate limiting, auth guards    |
| **Auth Service**           | 6001 | TCP      | Authentication, JWT, OAuth, OTP, password management        |
| **User Service**           | 6002 | TCP      | User profiles, followers, shipping addresses, image uploads |
| **Seller Service**         | 6003 | TCP      | Seller accounts, shops, discounts, events, Stripe Connect   |
| **Product Service**        | 6004 | TCP      | Product catalog, categories, brands, variants, ratings      |
| **Order Service**          | 6005 | TCP      | Orders, payments, Stripe Checkout, payouts                  |
| **Admin Service**          | 6006 | TCP      | Platform administration, user/seller management             |
| **Chatting Service**       | 6007 | TCP + WS | Real-time buyer-seller messaging via Socket.IO              |
| **Logger Service**         | 6008 | TCP + WS | Centralized structured logging and notifications            |
| **Recommendation Service** | 6009 | TCP      | ML-based product recommendations (collaborative filtering)  |
| **Kafka Service**          | -    | Kafka    | Analytics event consumer, user/product/shop metrics         |
| Notification Service       | 6014 | TCP + WS | Notification events producer/consumer                       |
| **User UI**                | 3000 | Next.js  | Customer-facing storefront                                  |
| **Seller UI**              | 3001 | Next.js  | Seller dashboard and shop management                        |
| **Admin UI**               | 3002 | Next.js  | Platform administration panel                               |

### Database Architecture

Most services use **MongoDB** (via Prisma). The **order-service** is the deliberate exception — it uses **PostgreSQL** (Neon).

#### Why MongoDB for most services

MongoDB's flexible document model is a natural fit for domains where the data shape varies or evolves:

| Service | Why document model fits |
|---|---|
| auth | User credentials + OTP state — flat, self-contained documents |
| user | Profiles with nested addresses, follower lists — no joins needed |
| seller | Shop config, discount codes, events — each seller's data is isolated |
| product | Variants, specs, and images differ per category — no fixed schema |
| chatting | Messages are append-only streams per conversation |
| logger | Log entries are write-once, schema-free by nature |
| notification | Event payloads vary by notification type |
| recommendation | Interaction vectors and model snapshots — document-shaped |

#### Why PostgreSQL for order-service

Orders are the one domain where relational guarantees are non-negotiable:

**1. ACID transactions across multiple tables**
A single checkout touches orders, order items, payment records, and per-seller payout rows simultaneously. PostgreSQL's multi-row transactions ensure either all of it commits or none of it does. MongoDB's multi-document transactions exist but are more limited and carry higher overhead.

**2. Financial data integrity**
Payment state transitions (pending → paid → refunded) driven by Stripe webhooks must never leave the database in a partial state. Foreign key constraints and row-level locking in PostgreSQL prevent orphaned payment records or double-applied payouts — something a document store cannot enforce at the schema level.

**3. Complex relational queries**
Order history, revenue aggregation by seller, payout calculations, and refund reconciliation all require JOINs across orders, items, and payments. These are natural SQL queries. Reproducing them in MongoDB requires `$lookup` pipelines that are harder to read, optimise, and maintain.

**4. Neon PostgreSQL for the free tier**
Neon is a serverless PostgreSQL provider with a generous free tier and built-in connection pooling. It eliminates the need to run a Postgres container locally or pay for a managed instance, while still providing a production-grade relational database. Only `ORDER_SERVICE_DB_URL` is required — `directUrl` was deprecated in Prisma 6 and is no longer used.

#### Summary

```
MongoDB  — user profiles, catalog, chat, logs, notifications
           (flexible schema, document-shaped data, no cross-document transactions)

PostgreSQL — orders, payments, payouts
             (relational integrity, ACID transactions, financial auditability)
```

### Shared Libraries

| Library                           | Path                                | Purpose                                                         |
| --------------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| `@tec-shop/dto`                   | `libs/shared/dto`                   | Shared DTOs across all services                                 |
| `@tec-shop/validation`            | `libs/shared/validation`            | Shared validation logic                                         |
| `@tec-shop/interceptor`           | `libs/shared/interceptor`           | `LoggingInterceptor`, `ErrorInterceptor`, `AllExceptionsFilter` |
| `@tec-shop/service-auth`          | `libs/shared/service-auth`          | HMAC inter-service request signing (`ServiceAuthUtil`)          |
| `@tec-shop/redis-client`          | `libs/shared/redis-client`          | Shared `RedisModule.forRoot()` and `RedisService`               |
| `@tec-shop/kafka-events`          | `libs/shared/kafka-events`          | Typed Kafka topic constants and event interfaces                |
| `@tec-shop/logger-producer`       | `libs/shared/logger-producer`       | Kafka producer for structured log events                        |
| `@tec-shop/notification-producer` | `libs/shared/notification-producer` | Kafka producer for notification events                          |
| `@tec-shop/i18n`                  | `libs/shared/i18n`                  | Shared `next-intl` v4 routing config and navigation helpers     |
| `@tec-shop/imagekit`              | `libs/shared/imagekit`              | ImageKit CDN integration                                        |
| `@tec-shop/components`            | `libs/shared/components`            | Shared UI component primitives                                  |
| `@tec-shop/tracing`               | `libs/shared/tracing`               | Shared OpenTelemetry tracing integration                        |
| `@tec-shop/metrics`               | `libs/shared/metrics`               | Shared Prometheus metrics integration                           |
| `@tec-shop/next-logger`           | `libs/shared/next-logger`           | Shared `nestjs-pino` logging integration                        |

### Inter-Service Communication

- All backend services communicate via **NestJS TCP microservices**
- Sensitive cross-service calls (profile creation) use **HMAC-signed requests** (`ServiceAuthUtil`)
- Analytics events flow through **Apache Kafka** (producer in each service, consumer in `kafka-service`)
- Real-time features use **Socket.IO** (chatting-service, logger-service, notification-service)
- **mTLS** certificates available for encrypted service-to-service transport in production

## Key Features

### Authentication & Security

- Email/password registration with OTP email verification
- Google OAuth 2.0 integration
- Remember me functionality with extended sessions
- Password reset with cryptographically secure codes
- Automatic token refresh with rotation
- Session management with httpOnly cookies
- Account ban/unban by admins

### Multi-Vendor Marketplace

- Sellers create and manage shops with branding (logo, banner)
- Admins control the category and brand taxonomy
- Sellers manage products, variants (SKU, price, stock), and images (up to 4 per product)
- Discount codes with configurable type, value, expiry, and usage limits
- Shop events with scheduled start/end dates
- Stripe Connect for seller payouts

### Orders & Payments

- Stripe Checkout Session-based payment flow
- Webhook-driven order status transitions
- Per-seller payout tracking
- Order history with item-level detail

### Real-Time Features

- Buyer-to-seller chat with Socket.IO
- Online presence tracking
- Live notification delivery
- Centralized log streaming to admin dashboard

### Recommendations

- Collaborative filtering model trained on user analytics (views, add-to-cart, purchases)
- it uses TensorFlowJS to train the model based on interaction data by users
- Fallback to popularity-based rankings for cold-start users
- Similar product discovery by shop context
- Redis-cached results with background retraining scheduler

### Internationalization

- Full URL-based locale routing (`/en/`, `/ptbr/`) via `next-intl` v4
- Shared translations in `@tec-shop/i18n`; per-app overrides merged at request time
- Language switcher across all three frontends

## Quick Start

### Prerequisites

| Requirement | Purpose |
|---|---|
| Node.js 22+ | Running services and Nx CLI |
| pnpm 10+ | Package management |
| Docker + Docker Compose | Infrastructure and full stack |
| kubectl | Kubernetes CLI (Workflow C) |
| kind | Local Kubernetes cluster (Workflow C) |
| helm | Kubernetes package manager (Workflow C) |
| SMTP server | Email OTPs — Mailtrap works for local dev |

### Initial setup (required for all workflows)

1. Clone and install

```bash
git clone <repository-url>
cd tec-shop
pnpm install
```

2. Configure environment variables

```bash
cp .env.example .env
# Required: JWT_SECRET, SERVICE_MASTER_SECRET, OTP_SALT
# Optional: SMTP credentials, Google OAuth, Stripe, ImageKit
```

3. Generate Prisma clients

```bash
pnpm prisma:generate
```

4. Generate mTLS certificates (required by all backend services)

```bash
pnpm certs:generate
# or: ./generate-certs.sh --all
```

---

### Workflow A — Host-based development (recommended)

Services run directly on your machine with hot reload. Docker only provides Redis, Kafka, and Zookeeper.

Requires: MongoDB (Atlas `mongodb+srv://` or a local instance) and PostgreSQL (Neon or local) configured in `.env`.

```bash
# Start infrastructure (Redis + Kafka + Zookeeper)
pnpm infra:up

# Push Prisma schemas to your databases (first time only)
pnpm prisma:push

# Start all services with hot reload
pnpm dev
```

Individual services:

```bash
PORT=3000 npx nx dev user-ui       # User storefront
PORT=3001 npx nx dev seller-ui     # Seller dashboard
PORT=3002 npx nx dev admin-ui      # Admin panel
npx nx serve api-gateway           # API Gateway
npx nx serve auth-service          # Any backend service
```

---

### Workflow B — Full Docker stack (container validation)

Builds all services into containers and runs them with Docker Compose. No external databases required — MongoDB and PostgreSQL run as local containers.

```bash
# First run: build all images and start (takes several minutes)
pnpm stack:up:build

# Subsequent runs: start without rebuilding
pnpm stack:up

# Logs and teardown
pnpm stack:logs
pnpm stack:down
```

The startup script handles sequencing automatically: infrastructure → Prisma migration → all services.

---

### Workflow C — Local Kubernetes with kind (pre-production validation)

Runs all backend services inside a single-node [kind](https://kind.sigs.k8s.io/) cluster on your machine with MongoDB, Redis, and Kafka deployed as Bitnami Helm subcharts. This validates Helm chart configuration, readiness probes, mTLS cert mounts, Kubernetes service discovery, and HPA definitions before any cloud spend.

**One-time cluster setup:**

```bash
# Create the kind cluster
kind create cluster --name tec-shop

# Fetch Bitnami chart dependencies (mongodb, redis, kafka)
helm dependency update infrastructure/helm/tec-shop
```

**Deploy:**

```bash
# 1. Build all 11 service images and load into kind
pnpm k8s:build

# 2. Create K8s secrets from your .env and certs/ directory
pnpm k8s:secrets

# 3. Install the Helm release (infra + all services)
pnpm k8s:deploy

# 4. Monitor pod startup
pnpm k8s:status
```

**Access the API gateway:**

```bash
kubectl port-forward svc/api-gateway 8080:8080 -n tec-shop
# API:  http://localhost:8080
# Docs: http://localhost:8080/api-docs
```

**Teardown:**

```bash
pnpm k8s:teardown                # uninstall Helm release
kind delete cluster --name tec-shop
```

**Key design decisions:**

| Decision | Reason |
|---|---|
| Bitnami in-cluster infra | kind nodes run in a separate Docker network. Pods cannot reach `localhost`, and `host.docker.internal` is not auto-available on Linux. Running MongoDB, Redis, and Kafka as Helm subcharts inside the cluster eliminates host-networking complexity entirely. |
| `imagePullPolicy: Never` | Images are loaded directly from the local Docker daemon into kind via `kind load docker-image`. Without this, Kubernetes tries to pull `tec-shop-local/...` from the internet and fails with `ErrImagePull`. |
| `KAFKA_SSL=false` | The code auto-disables SSL for brokers starting with `kafka:` or `localhost:`. The Bitnami subchart names its service `tec-shop-kafka:9092`, which does not match either prefix. Setting `KAFKA_SSL=false` explicitly disables SSL so all services connect to the PLAINTEXT listener. |
| mTLS certs as K8s Secrets | Cert files from `./certs/` are packed into a single `tec-shop-certs` Secret. The Helm deployment template mounts each service's key and cert via `subPath` into `/app/certs/<service>/`, replicating the same path structure services expect at runtime. |

---

The application will be available at:

| Service           | URL                              |
| ----------------- | -------------------------------- |
| User UI           | <http://localhost:3000>          |
| Seller UI         | <http://localhost:3001>          |
| Admin UI          | <http://localhost:3002>          |
| API Gateway       | <http://localhost:8080>          |
| API Documentation | <http://localhost:8080/api-docs> |

## Development Commands

### Workflow A — Host-based dev

```bash
pnpm infra:up                         # Start Redis + Kafka + Zookeeper
pnpm infra:down                       # Stop infrastructure
pnpm infra:restart                    # Restart infrastructure
pnpm infra:logs                       # Tail infrastructure logs
pnpm dev                              # Start all services with hot reload
npx nx serve <service-name>           # Start a single backend service
pnpm dev:ui:user                      # User storefront  (localhost:3000)
pnpm dev:ui:seller                    # Seller dashboard (localhost:3001)
pnpm dev:ui:admin                     # Admin panel      (localhost:3002)
```

### Workflow B — Full Docker stack

```bash
pnpm stack:up:build                   # Build all images and start
pnpm stack:up                         # Start without rebuilding
pnpm stack:down                       # Tear down and wipe volumes
pnpm stack:logs                       # Tail all container logs
```

### Workflow C — Local Kubernetes (kind)

```bash
pnpm k8s:build                        # Build images + load into kind cluster
pnpm k8s:secrets                      # Create K8s secrets from .env + certs/
pnpm k8s:deploy                       # Helm install/upgrade (local)
pnpm k8s:deploy:dev                   # Helm deploy to dev environment
pnpm k8s:deploy:demo                  # Helm deploy to Oracle Cloud free tier
pnpm k8s:deploy:prod                  # Helm deploy to production
pnpm k8s:status                       # List all pods in tec-shop namespace
pnpm k8s:logs                         # Follow logs for all tec-shop pods
pnpm k8s:teardown                     # Uninstall Helm release
```

### Build, lint, test

```bash
pnpm build                            # Build all projects
pnpm lint                             # Lint all projects
pnpm typecheck                        # Type-check all projects
pnpm test                             # Test all projects
pnpm ci                               # All checks on affected projects only (CI)

npx nx build <service>                # Single project
npx nx test <service>
npx nx lint <service>
npx nx typecheck <service>
```

### Database

```bash
pnpm prisma:generate                  # Regenerate all Prisma clients
pnpm prisma:push                      # Push all schemas to databases
pnpm prisma:format                    # Format all .prisma files
pnpm prisma:studio                    # Open Prisma Studio for all schemas

npx nx run @tec-shop/auth-schema:db-push     # Single schema push
npx nx run @tec-shop/order-schema:studio     # Single schema studio
```

### Seeding

```bash
pnpm seed                             # Seed brands, categories, and products
pnpm seed:admin                       # Create admin user (uses SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
pnpm seed:recommendations             # Seed recommendation training data
```

### Certificate management

```bash
pnpm certs:generate                   # Generate CA + all service certificates
pnpm certs:clean                      # Remove all certificates

./generate-certs.sh --service <name>  # Generate cert for a single service
./generate-certs.sh --clean && ./generate-certs.sh --all  # Full rotation
```

## Environment Variables

### Required Variables

```bash
# Database — one URL per service (separate MongoDB databases)
AUTH_SERVICE_DB_URL="mongodb://localhost:27017/auth"
USER_SERVICE_DB_URL="mongodb://localhost:27017/user"
SELLER_SERVICE_DB_URL="mongodb://localhost:27017/seller"
PRODUCT_SERVICE_DB_URL="mongodb://localhost:27017/product"

# The order service will use PostgreSQL, I personally use Neon PostgreSQL
ORDER_SERVICE_DB_URL="postgres://postgres:password@localhost:5432/order"

ANALYTICS_SERVICE_DB_URL="mongodb://localhost:27017/analytics"
CHATTING_SERVICE_DB_URL="mongodb://localhost:27017/chatting"
LOGGER_SERVICE_DB_URL="mongodb://localhost:27017/logger"

# Redis, I personally use upstash
REDIS_URL="redis://localhost:6379"

# Security (minimum 32 characters, no defaults allowed) use JWT generator online or run `openssl rand -base64 32`
JWT_SECRET="your-jwt-secret-minimum-32-characters"
SERVICE_MASTER_SECRET="your-service-master-secret-32-chars"

# Email SMTP
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
SMTP_FROM="noreply@yourdomain.com"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:8080/api/auth/google/callback"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ImageKit CDN
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-id"
IMAGEKIT_PUBLIC_KEY="your-imagekit-public-key"
IMAGEKIT_PRIVATE_KEY="your-imagekit-private-key"

# Kafka
KAFKA_BROKER="localhost:9092"
```

### Production Configuration

For production deployment, use the `.env.production.example` template with:

- Strong, unique secrets for JWT and `SERVICE_MASTER_SECRET`
- Production database URLs with connection pooling
- Production SMTP credentials
- Secured Redis with authentication and persistence
- HTTPS URLs for all external services and OAuth callbacks

## API Documentation

The API is fully documented with Swagger/OpenAPI. Access the interactive documentation at:

- Development: <http://localhost:8080/api-docs>
- Production: <https://your-domain.com/api-docs>

### Core Endpoint Groups

| Group           | Base Path              | Auth Required    |
| --------------- | ---------------------- | ---------------- |
| Authentication  | `/api/auth`            | Varies           |
| User Profiles   | `/api/user`            | JWT              |
| Sellers         | `/api/seller`          | JWT + SELLER     |
| Shops           | `/api/shops`           | Varies           |
| Products        | `/api/products`        | Varies           |
| Categories      | `/api/categories`      | Admin write      |
| Brands          | `/api/brands`          | Admin write      |
| Orders          | `/api/orders`          | JWT              |
| Admin           | `/api/admin`           | JWT + ADMIN      |
| Chat            | `/api/chat`            | JWT              |
| Recommendations | `/api/recommendations` | JWT              |
| Webhooks        | `/api/webhooks/stripe` | Stripe signature |

## Security Considerations

### Authentication Flow

1. User registers with email/password
2. 6-digit OTP sent via email for verification (3-attempt limit, Redis-backed)
3. Verified user receives JWT access token and refresh token in httpOnly cookies
4. Access token: 1 hour (standard) or 24 hours (remember me)
5. Refresh token: 7 days (standard) or 30 days (remember me)
6. Silent token refresh on expiry with rotation
7. Logout revokes the refresh token in the database

### Rate Limiting Tiers

| Tier   | Endpoints               | Dev Limit     | Prod Limit   |
| ------ | ----------------------- | ------------- | ------------ |
| Short  | General                 | 1000 req/min  | 100 req/min  |
| Medium | Auth operations         | 100 req/15min | 20 req/15min |
| Long   | Search / high-frequency | 2000 req/min  | 200 req/min  |

### Data Protection

- Passwords hashed with bcrypt (10 rounds)
- Refresh tokens hashed with SHA-256 before storage
- Sensitive data encrypted in transit (HTTPS/TLS)
- Input validation on all endpoints via class-validator DTOs
- No SQL injection risk — Prisma ORM with MongoDB

## Performance

Redis cache-aside + gzip compression were applied to the public product catalog endpoints.
All tests ran on a local dev machine against MongoDB Atlas (cloud) with 0% HTTP error rate throughout.

Full methodology, raw numbers, and before/after analysis: [View Full Case Study](load-testing/CASE_STUDY.md)

### Benchmark Results

#### Baseline — 50 concurrent users, 2 minutes

| Metric      | Before (no cache) | After (Redis + gzip) | Change   |
| ----------- | ----------------- | -------------------- | -------- |
| p50 latency | 770 ms            | 187 ms               | **-76%** |
| p95 latency | 1,740 ms          | 190 ms               | **-89%** |
| p99 latency | 2,160 ms          | 1,580 ms             | -27%     |
| Throughput  | 26.5 req/s        | 44.1 req/s           | **+66%** |

#### Stress test — ramp 0 to 500 concurrent users, 10 minutes

| Metric             | Without detail cache | All endpoints cached | Change     |
| ------------------ | -------------------- | -------------------- | ---------- |
| p95 latency        | 13,970 ms            | 195 ms               | **-98.6%** |
| p99 latency        | 16,950 ms            | 408 ms               | **-97.6%** |
| Throughput         | 61.7 req/s           | 135.4 req/s          | **+119%**  |
| Requests completed | 37,168               | 81,659               | **+120%**  |
| Thresholds passed  | 2 / 4                | 4 / 4                | All green  |
| HTTP error rate    | 0.00%                | 0.00%                | —          |

#### Spike test — 0 to 500 users in 30 seconds

| Metric                 | Result                                                        |
| ---------------------- | ------------------------------------------------------------- |
| p95 latency            | 211 ms                                                        |
| HTTP error rate        | 0.00%                                                         |
| Responses exceeding 2s | 0.12% (cold-cache spike)                                      |
| Recovery               | Self-healing — cache warms within 30s, no intervention needed |

### Optimizations Applied

**1. Redis cache-aside on product catalog**

All public product endpoints cache responses in Redis before proxying to the microservice.
The first request per unique query set hits MongoDB Atlas; every subsequent request returns
from Redis. TTLs are tuned per endpoint:

| Endpoint                               | Cache TTL | Rationale                                      |
| -------------------------------------- | --------- | ---------------------------------------------- |
| `GET /public/products` (listing)       | 60s       | Balances freshness with Atlas offload          |
| `GET /public/products/:slug` (detail)  | 30s       | Short so price/stock changes propagate quickly |
| `GET /public/products/filters/options` | 300s      | Color/size options change rarely               |

Trade-off: product view counters increment only on cache misses (at most once per TTL
window per slug). This is an accepted trade-off for high-traffic product pages.

**2. HTTP response compression (gzip)**

`compression` middleware applied at the Express layer before all other middleware in
`apps/api-gateway/src/main.ts`. Reduces JSON payload transfer size by 60–70% for
product listing responses.

**3. ConditionalThrottlerGuard — load-test-safe rate limiting**

The API gateway uses a custom `ConditionalThrottlerGuard` that extends NestJS
`ThrottlerGuard`. When `LOAD_TEST=true` is set in `.env`, the guard returns `true`
immediately at request time — bypassing Redis throttle counters without removing the
`@Throttle()` decorators that document production limits.

```
# .env
LOAD_TEST=true   # disables throttle during k6 runs
LOAD_TEST=false  # re-enables full throttle enforcement
```

This preserves `@Throttle({ long: { limit: 200, ttl: 60000 } })` on each endpoint
as authoritative production configuration while allowing clean load testing.

### Load Testing

Tests are in `load-testing/scenarios/` and use [k6](https://k6.io).

```bash
# Install k6 (Arch Linux)
paru -S k6

# Set bypass flag before running
# LOAD_TEST=true in .env, then restart api-gateway

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

---

## Deployment

Three deployment targets are supported. All use the same multi-stage Dockerfiles in `infrastructure/docker/services/`.

### Workflow B — Docker Compose

Full stack including local MongoDB and PostgreSQL. No external databases required. Environment variables from `.env` are loaded via `env_file`; infrastructure hostnames (DB, Redis, Kafka) are overridden per-service to Docker container names.

```bash
pnpm stack:up:build    # first run: build all images then start
pnpm stack:up          # subsequent runs: start without rebuilding
pnpm stack:down        # stop and remove all containers and volumes
pnpm stack:logs        # tail all service logs
```

> **Note on `NEXT_PUBLIC_*` variables:** Next.js bakes these into the client bundle at build time, during `docker build`. Ensure `.env` contains `NEXT_PUBLIC_API_URL=http://localhost:8080` before running `pnpm stack:up:build`.

### Workflow C — Local Kubernetes (kind)

Helm chart and values files are in `infrastructure/helm/tec-shop/`. Three values overlays are provided:

| Values file | Purpose |
|---|---|
| `values.yaml` | Base defaults shared across all environments |
| `values.local.yaml` | kind cluster — `imagePullPolicy: Never`, 1 replica, Bitnami infra |
| `values.dev.yaml` | Remote dev cluster — reduced replicas and resources |
| `values.demo.yaml` | Oracle Cloud free tier — 1 replica, HPA off, external managed services |
| `values.prod.yaml` | Production — autoscaling enabled, security hardening, TLS |

```bash
# Local kind cluster
pnpm k8s:build      # docker build + kind load docker-image for all services
pnpm k8s:secrets    # create tec-shop-secrets + tec-shop-certs in K8s
pnpm k8s:deploy     # helm upgrade --install with values.local.yaml

# Remote environments (requires correct kubectl context)
pnpm k8s:deploy:dev
pnpm k8s:deploy:demo
pnpm k8s:deploy:prod
```

### Live demo — Oracle Cloud Always Free (k3s)

The `demo` environment runs all 15 services on a single Oracle Cloud Ampere A1 ARM VM (4 cores / 24 GB RAM) using k3s. External managed free-tier services handle the databases: MongoDB Atlas M0, Upstash Redis, and Upstash Kafka. This eliminates in-cluster infrastructure pods, leaving the entire RAM budget for application workloads.

**One-time VM provisioning:**

```bash
# Upload and run the setup script on the Oracle Cloud VM
scp infrastructure/scripts/setup-k3s.sh ubuntu@<VM_IP>:~/
ssh ubuntu@<VM_IP> "chmod +x setup-k3s.sh && ./setup-k3s.sh"
```

The script installs k3s, Helm, nginx ingress controller, and cert-manager. Follow the printed next steps to copy the kubeconfig and configure DNS.

**Configure CI/CD (GitHub Actions):**

Set these in `Settings > Secrets and variables > Actions` on your GitHub repository:

| Name | Type | Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Variable | `https://api.your-domain.com` |

This value is baked into the Next.js client bundle at Docker build time — it cannot be changed at runtime.

**Deploy to Oracle Cloud:**

```bash
# Edit values.demo.yaml: set real domain and GitHub username
# Edit infrastructure/k8s/cert-manager/cluster-issuer.yaml: set real email and domain
kubectl apply -f infrastructure/k8s/cert-manager/cluster-issuer.yaml
kubectl apply -f infrastructure/k8s/namespaces/tec-shop.yaml
./infrastructure/scripts/create-k8s-secrets.sh demo
pnpm k8s:deploy:demo
```

TLS certificates are provisioned automatically by cert-manager + Let's Encrypt within 1–3 minutes of the first deployment.

**Key design decisions for demo:**

| Decision | Reason |
|---|---|
| External managed services | MongoDB Atlas M0, Upstash Redis, and Upstash Kafka all have free tiers. Running them in-cluster on a 24 GB VM would leave insufficient memory for the 15 application pods. |
| `imagePullPolicy: Always` | Images are pushed to GHCR by CI. The VM always pulls the latest image on pod restart — no image pre-loading step. |
| ARM64 multi-arch builds | Oracle Cloud free tier uses Ampere A1 (ARM64). CI builds `linux/amd64,linux/arm64` images via QEMU so the same tag works everywhere. |
| cert-manager + Let's Encrypt | Free automated TLS renewal. No manual certificate management. |
| k3s over full k3d/kind | k3s is designed for single-node production deployments. It includes a built-in ingress controller slot, ServiceLB, and runs with minimal overhead (~512 MB). |

### Production rollback

```bash
./infrastructure/scripts/rollback.sh
# or: helm rollback tec-shop -n tec-shop
```

### Production Checklist

- [ ] Set strong, unique environment variables (no defaults)
- [ ] Configure production databases with connection pooling
- [ ] Set up Redis with persistence and authentication
- [ ] Configure HTTPS with valid SSL certificates
- [ ] Generate mTLS certificates for all services
- [ ] Set up Kafka with topic replication
- [ ] Configure Stripe webhook endpoint and secret
- [ ] Set up ImageKit project and keys
- [ ] Enable Prometheus metrics scraping (`:3000/metrics`)
- [ ] Configure reverse proxy (nginx)
- [ ] Enable database backups
- [ ] Set up monitoring and alerting

## Troubleshooting

### Common Issues

**Services not starting (host-based)**

- Check that required ports are available (8080, 6001–6012)
- Verify all environment variables are set — services fail on missing secrets (`JWT_SECRET`, `SERVICE_MASTER_SECRET`, `OTP_SALT`)
- Confirm `pnpm infra:up` is running (Redis + Kafka required)

**Docker stack not starting**

- Run `pnpm stack:up:build` to force a full image rebuild after code changes
- Confirm `certs/` directory exists with all service certificates — run `pnpm certs:generate` if missing
- Check individual service logs: `docker logs tec-shop-auth-service`
- Services wait for health checks before starting dependents; allow 2–3 minutes on first boot

**Authentication issues**

- Verify `JWT_SECRET` is at least 32 characters
- Verify `SERVICE_MASTER_SECRET` is set for inter-service calls
- Check database connections
- Confirm SMTP configuration for OTP delivery

**mTLS certificate errors**

- Regenerate: `pnpm certs:clean && pnpm certs:generate`
- For the Docker stack, certs are bind-mounted from `./certs/` — ensure files exist on the host before `docker compose up`
- For Kubernetes, re-run `pnpm k8s:secrets` after regenerating certs, then restart affected deployments: `kubectl rollout restart deployment -n tec-shop`

**Kafka events not processing**

- Host-based: confirm `KAFKA_BROKER=localhost:9092` in `.env` and `pnpm infra:up` is running
- Docker stack: `KAFKA_BROKER` is overridden to `kafka:29092` automatically — no change needed
- Check that the `kafka-service` consumer is running
- Verify topic names match `KafkaTopics` constants in `@tec-shop/kafka-events`

**order-service fails to connect to PostgreSQL (Docker stack)**

- The startup script runs `prisma db-push` automatically, but if it failed, run manually:

  ```bash
  ORDER_SERVICE_DB_URL=postgresql://postgres:postgres@localhost:5432/tec-shop-orders \
    npx nx run @tec-shop/order-schema:db-push
  ```

**Kubernetes pods stuck in `ErrImagePull` or `ImagePullBackOff`**

- Images were not loaded into kind. Run `pnpm k8s:build` to build and load all images.
- Confirm `imagePullPolicy: Never` is set — check with `kubectl describe pod <pod-name> -n tec-shop`.

**Kubernetes pods crash-looping (`CrashLoopBackOff`)**

- Check pod logs: `kubectl logs <pod-name> -n tec-shop --previous`
- Most common causes: missing secret key (re-run `pnpm k8s:secrets`), missing cert file, or wrong service hostname in ConfigMap.
- Verify the ConfigMap is populated: `kubectl describe configmap tec-shop-config -n tec-shop`

**Kafka pods not ready in kind**

- Bitnami Kafka (KRaft mode) can take 60–90 seconds to elect a controller. Wait for `kafka-controller-0` to show `Running` before deploying services: `pnpm k8s:status`

## Acknowledgments

### Special Thanks

- [Sakura dev](https://www.youtube.com/@SakuraDev) - Comprehensive NestJS microservices guidance and architecture patterns
- [ByteByteGo](https://www.youtube.com/playlist?list=PLCRMIe5FDPsd0gVs500xeOewfySTsmEjf) - System Design Fundamentals
- [Renato Augusto](https://www.youtube.com/@renatoaugusto) - Microservices Architecture Guidance, System Design.

## 📚 Resources

### 🏗 Microservices Architecture

- <https://smartbear.com/learn/api-design/microservices/> - What are Microservices ?
- <https://microservices.io> — Patterns and best practices for microservices architecture.
- <https://martinfowler.com/microservices> — Foundational articles explaining microservices by Martin Fowler.

---

### ⚙️ NestJS

- <https://docs.nestjs.com> — Official NestJS documentation.
- <https://docs.nestjs.com/microservices/basics> — Official guide for building microservices with NestJS.
- <https://trilon.io/blog> — Advanced NestJS tutorials and architecture discussions.
- <https://stackoverflow.com/questions/tagged/nestjs> — NestJS questions and community support.

---

### ⚛️ Next.js

- <https://nextjs.org/docs> — Official Next.js documentation.
- <https://nextjs.org/learn> — Official interactive Next.js tutorial.
- <https://react.dev> — Official React documentation used by Next.js.
- <https://vercel.com/blog> — Architecture insights and best practices for Next.js applications.

---

### 🧠 System Design

- <https://github.com/donnemartin/system-design-primer> — One of the most famous GitHub repositories for learning system design.
- <https://bytebytego.com> — High-quality system design explanations and diagrams.
- <http://highscalability.com> — Real architecture breakdowns of large-scale systems.
- <https://github.com/binhnguyennus/awesome-scalability> — Curated resources about scalability and distributed systems.

---

### 📊 Observability & Distributed Systems

- <https://opentelemetry.io/docs> — Observability for distributed systems.
- <https://prometheus.io/docs> — Monitoring system for microservices.
- <https://grafana.com/docs> — Metrics visualization and dashboards.

---

### 💬 Communities

- <https://stackoverflow.com> — Developer Q&A community.
- <https://www.reddit.com/r/microservices> — Discussions about microservices architecture.
- <https://discord.com> — Many developer communities around NestJS and Next.js.

## License

[MIT](https://choosealicense.com/licenses/mit/)
