## 0.1.0 (2026-03-15)

### Features

- **chatting-service:** add Redis adapter for scalable WebSocket connections ([f61cc98](https://github.com/andriel300/tec-shop/commit/f61cc98))
- **observability,admin,seller,ui:** harden logging, admin order access, shop image persistence [SCRUM-33,SCRUM-34,SCRUM-27] ([532641f](https://github.com/andriel300/tec-shop/commit/532641f))
- **observability:** add health checks, distributed tracing, and Sentry to all services [SCRUM-27,SCRUM-31] ([d59eb63](https://github.com/andriel300/tec-shop/commit/d59eb63))
- **observability:** add Prometheus + Grafana metrics stack [SCRUM-27] ([9b4cfeb](https://github.com/andriel300/tec-shop/commit/9b4cfeb))
- integrate new microservices with API gateway and enhance security ([061126b](https://github.com/andriel300/tec-shop/commit/061126b))

### Bug Fixes

- wrap related db operations in transactions and parallelize queries ([f7541a5](https://github.com/andriel300/tec-shop/commit/f7541a5))
- **redis:** export SharedRedisModule instead of REDIS_CLIENT token ([d53e6e5](https://github.com/andriel300/tec-shop/commit/d53e6e5))
- resolve all failing lint, typecheck, and test targets ([a2b2f26](https://github.com/andriel300/tec-shop/commit/a2b2f26))
- **logger-producer:** add missing Inject import and sync TypeScript project references ([dd7509e](https://github.com/andriel300/tec-shop/commit/dd7509e))

### Code Refactoring

- improve production readiness with graceful shutdown and config injection ([146817b](https://github.com/andriel300/tec-shop/commit/146817b))
- **services:** standardize microservice error handling and add caching ([c114ce0](https://github.com/andriel300/tec-shop/commit/c114ce0))
- enable graceful shutdown hooks and inject config service ([a155056](https://github.com/andriel300/tec-shop/commit/a155056))
- **security:** enforce mandatory mTLS across all services ([b6b1190](https://github.com/andriel300/tec-shop/commit/b6b1190))

### 🧱 Updated Dependencies

- Updated @tec-shop/chatting-client to 0.1.0
- Updated @tec-shop/redis-client to 0.1.0
- Updated @tec-shop/metrics to 0.1.0
- Updated @tec-shop/tracing to 0.1.0
- Updated @tec-shop/dto to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300