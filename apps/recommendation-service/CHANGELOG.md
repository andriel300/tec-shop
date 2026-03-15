# 1.0.0 (2026-03-15)

### 🧱 Updated Dependencies

- Updated @tec-shop/analytics-client to 1.0.0
- Updated @tec-shop/product-client to 1.0.0
- Updated @tec-shop/auth-client to 1.0.0
- Updated @tec-shop/redis-client to 1.0.0
- Updated @tec-shop/interceptor to 1.0.0
- Updated @tec-shop/metrics to 1.0.0
- Updated @tec-shop/tracing to 1.0.0

## 0.1.0 (2026-03-15)

### Features

- **health:** add Prisma/Redis health indicators and simplify query parsing ([b6198e0](https://github.com/andriel300/tec-shop/commit/b6198e0))
- **recommendation-service:** move model training to BullMQ background worker ([3881631](https://github.com/andriel300/tec-shop/commit/3881631))
- **observability,admin,seller,ui:** harden logging, admin order access, shop image persistence [SCRUM-33,SCRUM-34,SCRUM-27] ([532641f](https://github.com/andriel300/tec-shop/commit/532641f))
- **observability:** add health checks, distributed tracing, and Sentry to all services [SCRUM-27,SCRUM-31] ([d59eb63](https://github.com/andriel300/tec-shop/commit/d59eb63))
- **observability:** add Prometheus + Grafana metrics stack [SCRUM-27] ([9b4cfeb](https://github.com/andriel300/tec-shop/commit/9b4cfeb))
- **recommendation-service:** add full recommendation data seeder and extend Prisma references ([0658585](https://github.com/andriel300/tec-shop/commit/0658585))
- integrate new microservices with API gateway and enhance security ([061126b](https://github.com/andriel300/tec-shop/commit/061126b))

### Bug Fixes

- resolve all failing lint, typecheck, and test targets ([a2b2f26](https://github.com/andriel300/tec-shop/commit/a2b2f26))
- **logger-producer:** add missing Inject import and sync TypeScript project references ([dd7509e](https://github.com/andriel300/tec-shop/commit/dd7509e))

### Code Refactoring

- improve production readiness with graceful shutdown and config injection ([146817b](https://github.com/andriel300/tec-shop/commit/146817b))
- **services:** standardize microservice error handling and add caching ([c114ce0](https://github.com/andriel300/tec-shop/commit/c114ce0))
- enable graceful shutdown hooks and inject config service ([a155056](https://github.com/andriel300/tec-shop/commit/a155056))

### 🧱 Updated Dependencies

- Updated @tec-shop/analytics-client to 0.1.0
- Updated @tec-shop/product-client to 0.1.0
- Updated @tec-shop/auth-client to 0.1.0
- Updated @tec-shop/redis-client to 0.1.0
- Updated @tec-shop/interceptor to 0.1.0
- Updated @tec-shop/metrics to 0.1.0
- Updated @tec-shop/tracing to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300