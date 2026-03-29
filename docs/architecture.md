# Architecture

![Architecture System Design](../GitVisuals/archtecture%20system%20design%20microservice.gif)

## Microservices Design

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
| **Notification Service**   | 6012 | TCP + WS | Notification events producer/consumer                       |
| **User UI**                | 3000 | Next.js  | Customer-facing storefront                                  |
| **Seller UI**              | 3001 | Next.js  | Seller dashboard and shop management                        |
| **Admin UI**               | 3002 | Next.js  | Platform administration panel                               |

## Request Flow

```
Browser / Mobile
  → API Gateway (NestJS REST, :8080)
      → Backend service (NestJS TCP microservice) via mTLS
          → MongoDB via Prisma (separate DB per service)
          → Redis (caching, sessions, throttle counters)
      → Kafka producer (analytics/notification events)
          → kafka-service consumer → Analytics DB (Neon PostgreSQL)
```

The API Gateway is the only internet-facing service. All other services only listen on TCP and have no HTTP surface.

## Database Architecture

Most services use **MongoDB** (via Prisma). The **order-service** is the deliberate exception — it uses **PostgreSQL** (Neon).

### Why MongoDB for most services

MongoDB's flexible document model is a natural fit for domains where the data shape varies or evolves:

| Service        | Why document model fits                                              |
| -------------- | -------------------------------------------------------------------- |
| auth           | User credentials + OTP state — flat, self-contained documents        |
| user           | Profiles with nested addresses, follower lists — no joins needed     |
| seller         | Shop config, discount codes, events — each seller's data is isolated |
| product        | Variants, specs, and images differ per category — no fixed schema    |
| chatting       | Messages are append-only streams per conversation                    |
| logger         | Log entries are write-once, schema-free by nature                    |
| notification   | Event payloads vary by notification type                             |
| recommendation | Interaction vectors and model snapshots — document-shaped            |

### Why PostgreSQL for order-service

Orders are the one domain where relational guarantees are non-negotiable:

**1. ACID transactions across multiple tables**
A single checkout touches orders, order items, payment records, and per-seller payout rows simultaneously. PostgreSQL's multi-row transactions ensure either all of it commits or none of it does.

**2. Financial data integrity**
Payment state transitions (pending → paid → refunded) driven by Stripe webhooks must never leave the database in a partial state. Foreign key constraints and row-level locking in PostgreSQL prevent orphaned payment records or double-applied payouts.

**3. Complex relational queries**
Order history, revenue aggregation by seller, payout calculations, and refund reconciliation all require JOINs across orders, items, and payments. These are natural SQL queries.

**4. Neon PostgreSQL for the free tier**
Neon is a serverless PostgreSQL provider with a generous free tier and built-in connection pooling. Only `ORDER_SERVICE_DB_URL` is required — `directUrl` was deprecated in Prisma 6.

### Summary

```
MongoDB     — user profiles, catalog, chat, logs, notifications
              (flexible schema, document-shaped data, no cross-document transactions)

PostgreSQL  — orders, payments, payouts
              (relational integrity, ACID transactions, financial auditability)
```

## Shared Libraries

All in `libs/shared/` and importable as `@tec-shop/<name>`:

| Library                           | Path                                | Purpose                                                                                                                      |
| --------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `@tec-shop/dto`                   | `libs/shared/dto`                   | Shared DTOs across all services                                                                                              |
| `@tec-shop/validation`            | `libs/shared/validation`            | Shared validation logic                                                                                                      |
| `@tec-shop/interceptor`           | `libs/shared/interceptor`           | `LoggingInterceptor`, `ErrorInterceptor`, `AllExceptionsFilter`                                                              |
| `@tec-shop/service-auth`          | `libs/shared/service-auth`          | HMAC inter-service request signing (`ServiceAuthUtil`)                                                                       |
| `@tec-shop/redis-client`          | `libs/shared/redis-client`          | Shared `RedisModule.forRoot()` and `RedisService`                                                                            |
| `@tec-shop/kafka-events`          | `libs/shared/kafka-events`          | Typed Kafka topic constants and event interfaces                                                                             |
| `@tec-shop/logger-producer`       | `libs/shared/logger-producer`       | Kafka producer for structured log events                                                                                     |
| `@tec-shop/notification-producer` | `libs/shared/notification-producer` | Kafka producer for notification events                                                                                       |
| `@tec-shop/i18n`                  | `libs/shared/i18n`                  | Shared `next-intl` v4 routing config and navigation helpers                                                                  |
| `@tec-shop/imagekit`              | `libs/shared/imagekit`              | ImageKit CDN integration                                                                                                     |
| `@tec-shop/components`            | `libs/shared/components`            | Shared UI component primitives                                                                                               |
| `@tec-shop/tracing`               | `libs/shared/tracing`               | OpenTelemetry tracing integration                                                                                            |
| `@tec-shop/metrics`               | `libs/shared/metrics`               | Prometheus metrics (`MetricsModule`, `MetricsController`, `HttpMetricsInterceptor`)                                          |
| `@tec-shop/next-logger`           | `libs/shared/next-logger`           | `nestjs-pino` logging integration (`createLogger`, pino server-side / console wrapper client-side)                          |
| `@tec-shop/sentry`                | `libs/shared/sentry`                | Sentry error tracking (`SentryModule`, `SentryFilter`, `SentryInterceptor`, `SentryMiddleware`)                              |
| `@tec-shop/ws-auth`               | `libs/shared/ws-auth`               | WebSocket JWT auth, cookie extraction, CORS factory, Socket.IO adapter (`WsJwtModule`, `extractWsToken`, `createWsGatewayCors`, `WsIoAdapter`) |

## Inter-Service Communication

- All backend services communicate via **NestJS TCP microservices**
- Sensitive cross-service calls use **HMAC-signed requests** (`ServiceAuthUtil`)
- Analytics events flow through **Apache Kafka** (producer in each service, consumer in `kafka-service`)
- Real-time features use **Socket.IO** (chatting-service, logger-service, notification-service)
- **mTLS** certificates provide encrypted service-to-service transport in production
