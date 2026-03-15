## 0.1.0 (2026-03-15)

### Features

- **health:** add Prisma/Redis health indicators and simplify query parsing ([b6198e0](https://github.com/andriel300/tec-shop/commit/b6198e0))
- **order-service:** implement transactional order creation with outbox pattern and payout retries ([096c752](https://github.com/andriel300/tec-shop/commit/096c752))
- **observability,admin,seller,ui:** harden logging, admin order access, shop image persistence [SCRUM-33,SCRUM-34,SCRUM-27] ([532641f](https://github.com/andriel300/tec-shop/commit/532641f))
- **observability:** add health checks, distributed tracing, and Sentry to all services [SCRUM-27,SCRUM-31] ([d59eb63](https://github.com/andriel300/tec-shop/commit/d59eb63))
- **observability:** add Prometheus + Grafana metrics stack [SCRUM-27] ([9b4cfeb](https://github.com/andriel300/tec-shop/commit/9b4cfeb))
- **kafka:** enhance Kafka configuration with flexible authentication ([48f6e0f](https://github.com/andriel300/tec-shop/commit/48f6e0f))

### Bug Fixes

- wrap related db operations in transactions and parallelize queries ([f7541a5](https://github.com/andriel300/tec-shop/commit/f7541a5))
- **security:** enforce FRONTEND_URL validation and improve error handling ([e05b924](https://github.com/andriel300/tec-shop/commit/e05b924))
- **security:** harden auth guards, file uploads, and payment price enforcement ([c6a48f5](https://github.com/andriel300/tec-shop/commit/c6a48f5))
- resolve all failing lint, typecheck, and test targets ([a2b2f26](https://github.com/andriel300/tec-shop/commit/a2b2f26))
- **logger-producer:** add missing Inject import and sync TypeScript project references ([dd7509e](https://github.com/andriel300/tec-shop/commit/dd7509e))

### Code Refactoring

- improve production readiness with graceful shutdown and config injection ([146817b](https://github.com/andriel300/tec-shop/commit/146817b))
- **services:** standardize microservice error handling and add caching ([c114ce0](https://github.com/andriel300/tec-shop/commit/c114ce0))
- **Nestjs:** split monolithic services into domain-focused services ([fd39b07](https://github.com/andriel300/tec-shop/commit/fd39b07))
- enable graceful shutdown hooks and inject config service ([a155056](https://github.com/andriel300/tec-shop/commit/a155056))
- trying to fix all relative paths, typecheck, lint, build and see the logs of CI ([9d9f40e](https://github.com/andriel300/tec-shop/commit/9d9f40e))

### 🧱 Updated Dependencies

- Updated @tec-shop/notification-producer to 0.1.0
- Updated @tec-shop/order-client to 0.1.0
- Updated @tec-shop/redis-client to 0.1.0
- Updated @tec-shop/interceptor to 0.1.0
- Updated @tec-shop/metrics to 0.1.0
- Updated @tec-shop/tracing to 0.1.0
- Updated @tec-shop/dto to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300