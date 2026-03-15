# 1.0.0 (2026-03-15)

### 🧱 Updated Dependencies

- Updated @tec-shop/analytics-client to 1.0.0
- Updated @tec-shop/metrics to 1.0.0
- Updated @tec-shop/tracing to 1.0.0

## 0.1.0 (2026-03-15)

### Features

- **kafka,logging:** add retry strategy and DLQ support for event processing ([7846895](https://github.com/andriel300/tec-shop/commit/7846895))
- **observability,admin,seller,ui:** harden logging, admin order access, shop image persistence [SCRUM-33,SCRUM-34,SCRUM-27] ([532641f](https://github.com/andriel300/tec-shop/commit/532641f))
- **observability:** add health checks, distributed tracing, and Sentry to all services [SCRUM-27,SCRUM-31] ([d59eb63](https://github.com/andriel300/tec-shop/commit/d59eb63))
- **observability:** add Prometheus + Grafana metrics stack [SCRUM-27] ([9b4cfeb](https://github.com/andriel300/tec-shop/commit/9b4cfeb))
- **kafka:** enhance Kafka configuration with flexible authentication ([48f6e0f](https://github.com/andriel300/tec-shop/commit/48f6e0f))

### Bug Fixes

- **security:** enforce FRONTEND_URL validation and improve error handling ([e05b924](https://github.com/andriel300/tec-shop/commit/e05b924))
- **security:** harden authentication, XSS protection, and container security ([76284b4](https://github.com/andriel300/tec-shop/commit/76284b4))
- resolve all failing lint, typecheck, and test targets ([a2b2f26](https://github.com/andriel300/tec-shop/commit/a2b2f26))

### Code Refactoring

- improve production readiness with graceful shutdown and config injection ([146817b](https://github.com/andriel300/tec-shop/commit/146817b))
- **services:** standardize microservice error handling and add caching ([c114ce0](https://github.com/andriel300/tec-shop/commit/c114ce0))
- enable graceful shutdown hooks and inject config service ([a155056](https://github.com/andriel300/tec-shop/commit/a155056))

### 🧱 Updated Dependencies

- Updated @tec-shop/analytics-client to 0.1.0
- Updated @tec-shop/metrics to 0.1.0
- Updated @tec-shop/tracing to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300