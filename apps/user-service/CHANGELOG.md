# 1.0.0 (2026-03-15)

### 🧱 Updated Dependencies

- Updated @tec-shop/user-client to 1.0.0
- Updated @tec-shop/logger-producer to 1.0.0
- Updated @tec-shop/interceptor to 1.0.0
- Updated @tec-shop/metrics to 1.0.0
- Updated @tec-shop/tracing to 1.0.0
- Updated @tec-shop/dto to 1.0.0

## 0.1.0 (2026-03-15)

### Features

- **observability,admin,seller,ui:** harden logging, admin order access, shop image persistence [SCRUM-33,SCRUM-34,SCRUM-27] ([532641f](https://github.com/andriel300/tec-shop/commit/532641f))
- **observability:** add health checks, distributed tracing, and Sentry to all services [SCRUM-27,SCRUM-31] ([d59eb63](https://github.com/andriel300/tec-shop/commit/d59eb63))
- **observability:** add Prometheus + Grafana metrics stack [SCRUM-27] ([9b4cfeb](https://github.com/andriel300/tec-shop/commit/9b4cfeb))
- integrate new microservices with API gateway and enhance security ([061126b](https://github.com/andriel300/tec-shop/commit/061126b))
- **security:** [SCRUM-30] implement comprehensive security hardening and testing framework ([b6e23c0](https://github.com/andriel300/tec-shop/commit/b6e23c0))
- **security:** implement comprehensive security enhancements ([d2bf719](https://github.com/andriel300/tec-shop/commit/d2bf719))
- **security:** implement mutual TLS authentication for microservices ([a004f3e](https://github.com/andriel300/tec-shop/commit/a004f3e))
- **security:** implement rate limiting and enhanced security measures ([ad331d5](https://github.com/andriel300/tec-shop/commit/ad331d5))
- implement structured logging and service separation ([ea318e6](https://github.com/andriel300/tec-shop/commit/ea318e6))
- implement mTLS security and service communication ([3052a73](https://github.com/andriel300/tec-shop/commit/3052a73))
- initial setup for flow of sign up and login registration ([f472dd0](https://github.com/andriel300/tec-shop/commit/f472dd0))

### Bug Fixes

- **sentry,admin-ui,seller-ui:** reduce noise and fix type errors [SCRUM-26] ([34d925f](https://github.com/andriel300/tec-shop/commit/34d925f))
- resolve all failing lint, typecheck, and test targets ([a2b2f26](https://github.com/andriel300/tec-shop/commit/a2b2f26))
- **user-service:** enhance user profile service with follower counts ([844e28f](https://github.com/andriel300/tec-shop/commit/844e28f))
- solve TypeScript errors and test properly handle issues ([3920d2d](https://github.com/andriel300/tec-shop/commit/3920d2d))
- **testing:** [SCRUM-29, SCRUM-30] resolve test failures and improve test configurations ([840a189](https://github.com/andriel300/tec-shop/commit/840a189))
- change relative paths to absolute paths for mTLS certs folder. ([1a337fe](https://github.com/andriel300/tec-shop/commit/1a337fe))

### Code Refactoring

- improve production readiness with graceful shutdown and config injection ([146817b](https://github.com/andriel300/tec-shop/commit/146817b))
- **services:** standardize microservice error handling and add caching ([c114ce0](https://github.com/andriel300/tec-shop/commit/c114ce0))
- enable graceful shutdown hooks and inject config service ([a155056](https://github.com/andriel300/tec-shop/commit/a155056))
- **shared:** centralize DTOs into shared library and update imports ([caca874](https://github.com/andriel300/tec-shop/commit/caca874))

### 🧱 Updated Dependencies

- Updated @tec-shop/user-client to 0.1.0
- Updated @tec-shop/logger-producer to 0.1.0
- Updated @tec-shop/interceptor to 0.1.0
- Updated @tec-shop/metrics to 0.1.0
- Updated @tec-shop/tracing to 0.1.0
- Updated @tec-shop/dto to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300