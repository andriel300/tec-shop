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
- **Machine Learning**: TensorFlow.js collaborative filtering model for product recommendations

## Frontend

- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (server state) + Zustand (client state)
- **Forms**: TanStack Form + class-validator
- **Internationalization**: `next-intl` v4 with URL-based locale routing (`/en/`, `/ar/`)
- **UI Components**: Radix UI primitives + Lucide icons
- **Notifications**: Sonner toast messages

## Infrastructure

- **Monorepo**: Nx workspace with module boundary enforcement (ESLint)
- **Testing**: Jest with per-service test suites
- **Linting**: ESLint with TypeScript and NX boundary rules
- **DevOps**: Docker multi-stage builds, Kubernetes + Helm chart
- **Monitoring**: Prometheus, Grafana
- **Load Testing**: k6
- **Package Management**: pnpm workspaces

## Security

- **Mutual TLS (mTLS)**: Certificate-based service-to-service authentication
- **JWT Authentication**: Stateless access + refresh token rotation with httpOnly cookies
- **HMAC Inter-Service Auth**: `SERVICE_MASTER_SECRET`-derived signatures for cross-service calls
- **Role-Based Access Control**: `ADMIN`, `SELLER`, `CUSTOMER` roles enforced via `RolesGuard`
- **Rate Limiting**: Three-tier throttling (short / medium / long), environment-aware limits
- **Security Headers**: Helmet (CSP, HSTS, XSS protection)
- **Input Validation**: class-validator + class-transformer DTOs
- **Password Security**: bcrypt with configurable salt rounds
- **Token Blacklisting**: Redis-backed refresh token revocation
