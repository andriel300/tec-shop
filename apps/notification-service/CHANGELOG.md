## 0.1.0 (2026-03-15)

### Features

- **notification-service:** extract notification system into dedicated microservice ([c415b13](https://github.com/andriel300/tec-shop/commit/c415b13))

### Bug Fixes

- **redis:** export SharedRedisModule instead of REDIS_CLIENT token ([d53e6e5](https://github.com/andriel300/tec-shop/commit/d53e6e5))

### Code Refactoring

- improve production readiness with graceful shutdown and config injection ([146817b](https://github.com/andriel300/tec-shop/commit/146817b))
- **services:** standardize microservice error handling and add caching ([c114ce0](https://github.com/andriel300/tec-shop/commit/c114ce0))
- enable graceful shutdown hooks and inject config service ([a155056](https://github.com/andriel300/tec-shop/commit/a155056))
- **security:** enforce mandatory mTLS across all services ([b6b1190](https://github.com/andriel300/tec-shop/commit/b6b1190))

### 🧱 Updated Dependencies

- Updated @tec-shop/notification-client to 0.1.0
- Updated @tec-shop/redis-client to 0.1.0
- Updated @tec-shop/metrics to 0.1.0
- Updated @tec-shop/tracing to 0.1.0
- Updated @tec-shop/dto to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300