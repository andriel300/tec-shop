# 1.0.0 (2026-03-15)

### 🧱 Updated Dependencies

- Updated @tec-shop/notification-producer to 1.0.0
- Updated @tec-shop/auth-client to 1.0.0
- Updated @tec-shop/logger-producer to 1.0.0
- Updated @tec-shop/redis-client to 1.0.0
- Updated @tec-shop/service-auth to 1.0.0
- Updated @tec-shop/interceptor to 1.0.0
- Updated @tec-shop/metrics to 1.0.0
- Updated @tec-shop/tracing to 1.0.0
- Updated @tec-shop/dto to 1.0.0

## 0.1.0 (2026-03-15)

### Features

- **observability,admin,seller,ui:** harden logging, admin order access, shop image persistence [SCRUM-33,SCRUM-34,SCRUM-27] ([532641f](https://github.com/andriel300/tec-shop/commit/532641f))
- **auth,seller-ui,user-ui:** add customer-to-seller account upgrade flow [SCRUM-32] ([99aa388](https://github.com/andriel300/tec-shop/commit/99aa388))
- **observability:** add health checks, distributed tracing, and Sentry to all services [SCRUM-27,SCRUM-31] ([d59eb63](https://github.com/andriel300/tec-shop/commit/d59eb63))
- **observability:** add Prometheus + Grafana metrics stack [SCRUM-27] ([9b4cfeb](https://github.com/andriel300/tec-shop/commit/9b4cfeb))
- **security:** [SCRUM-30] implement comprehensive security hardening and testing framework ([b6e23c0](https://github.com/andriel300/tec-shop/commit/b6e23c0))
- **auth:** [SCRUM-30] implement seller authentication and profile management ([c765682](https://github.com/andriel300/tec-shop/commit/c765682))
- **auth:** implement secure password reset with token-based system ([d17a9de](https://github.com/andriel300/tec-shop/commit/d17a9de))
- **security:** implement comprehensive security enhancements ([d2bf719](https://github.com/andriel300/tec-shop/commit/d2bf719))
- **auth:** implement password reset flow and enhance authentication ([7ebfbb1](https://github.com/andriel300/tec-shop/commit/7ebfbb1))
- **security:** implement mutual TLS authentication for microservices ([a004f3e](https://github.com/andriel300/tec-shop/commit/a004f3e))
- **security:** implement rate limiting and enhanced security measures ([ad331d5](https://github.com/andriel300/tec-shop/commit/ad331d5))
- implement email verification with OTP system ([21ec349](https://github.com/andriel300/tec-shop/commit/21ec349))
- implement structured logging and service separation ([ea318e6](https://github.com/andriel300/tec-shop/commit/ea318e6))
- implement mTLS security and service communication ([3052a73](https://github.com/andriel300/tec-shop/commit/3052a73))
- initial setup for flow of sign up and login registration ([f472dd0](https://github.com/andriel300/tec-shop/commit/f472dd0))
- **api-gateway and auth-service:** refactor authentication to use NestJS patterns instead of Express middleware ([29f0126](https://github.com/andriel300/tec-shop/commit/29f0126))
- [SCRUM-24, SCRUM-25, SCRUM-53] enhance security and add token refresh functionality ([9174711](https://github.com/andriel300/tec-shop/commit/9174711))
- **auth:** [SCRUM-53] Implement TDD-based user registration ([0841ac0](https://github.com/andriel300/tec-shop/commit/0841ac0))
- **app:** configure main app module ([2dd53da](https://github.com/andriel300/tec-shop/commit/2dd53da))
- **api:** add swagger documentation for auth service (SCRUM-53) ([51a482c](https://github.com/andriel300/tec-shop/commit/51a482c))
- **webpack:** add tsconfig paths plugin ([6780e95](https://github.com/andriel300/tec-shop/commit/6780e95))
- integrate Prisma with auth service and update user schema (SCRUM-52) ([7323194](https://github.com/andriel300/tec-shop/commit/7323194))
- add Prisma ORM with PostgreSQL database configuration (SCRUM-51) ([8de8f3d](https://github.com/andriel300/tec-shop/commit/8de8f3d))
- configure shared common library and update dependencies (SCRUM-45) ([3f1a095](https://github.com/andriel300/tec-shop/commit/3f1a095))
- configure API gateway as reverse proxy and enable CORS (SCRUM-45) ([978b0df](https://github.com/andriel300/tec-shop/commit/978b0df))
- add shared common library and global NestJS utilities (SCRUM-44) ([357a33f](https://github.com/andriel300/tec-shop/commit/357a33f))

### Bug Fixes

- wrap related db operations in transactions and parallelize queries ([f7541a5](https://github.com/andriel300/tec-shop/commit/f7541a5))
- resolve lint warnings and unused variables across services ([3dda6ff](https://github.com/andriel300/tec-shop/commit/3dda6ff))
- **security:** harden authentication with unified token generation and admin support ([4a0a418](https://github.com/andriel300/tec-shop/commit/4a0a418))
- **security:** harden auth guards, file uploads, and payment price enforcement ([c6a48f5](https://github.com/andriel300/tec-shop/commit/c6a48f5))
- **sentry,admin-ui,seller-ui:** reduce noise and fix type errors [SCRUM-26] ([34d925f](https://github.com/andriel300/tec-shop/commit/34d925f))
- resolve all failing lint, typecheck, and test targets ([a2b2f26](https://github.com/andriel300/tec-shop/commit/a2b2f26))
- **logger-producer:** add missing Inject import and sync TypeScript project references ([dd7509e](https://github.com/andriel300/tec-shop/commit/dd7509e))
- solve TypeScript errors and test properly handle issues ([3920d2d](https://github.com/andriel300/tec-shop/commit/3920d2d))
- **testing:** [SCRUM-29, SCRUM-30] resolve TypeScript and testing configuration issues ([79a9d13](https://github.com/andriel300/tec-shop/commit/79a9d13))
- **auth:** [SCRUM-29, SCRUM-30] resolve Stripe Connect integration and authentication flow issues ([5a2d401](https://github.com/andriel300/tec-shop/commit/5a2d401))
- change relative paths to absolute paths for mTLS certs folder. ([1a337fe](https://github.com/andriel300/tec-shop/commit/1a337fe))
- [SCRUM-53] correct wildcard route configuration in app modules ([4465836](https://github.com/andriel300/tec-shop/commit/4465836))
- **prisma:** update prisma client import ([66e5a82](https://github.com/andriel300/tec-shop/commit/66e5a82))

### Code Refactoring

- improve production readiness with graceful shutdown and config injection ([146817b](https://github.com/andriel300/tec-shop/commit/146817b))
- **services:** standardize microservice error handling and add caching ([c114ce0](https://github.com/andriel300/tec-shop/commit/c114ce0))
- **Nestjs:** split monolithic services into domain-focused services ([fd39b07](https://github.com/andriel300/tec-shop/commit/fd39b07))
- enable graceful shutdown hooks and inject config service ([a155056](https://github.com/andriel300/tec-shop/commit/a155056))
- **security:** enforce mandatory mTLS across all services ([b6b1190](https://github.com/andriel300/tec-shop/commit/b6b1190))
- **shared:** centralize DTOs into shared library and update imports ([caca874](https://github.com/andriel300/tec-shop/commit/caca874))
- restructure auth service and API gateway ([74a62fe](https://github.com/andriel300/tec-shop/commit/74a62fe))
- [SCRUM-53] restructure shared libraries into modular packages ([e4afc84](https://github.com/andriel300/tec-shop/commit/e4afc84))
- update service ports and add development script ([be410f5](https://github.com/andriel300/tec-shop/commit/be410f5))

### Documentation Changes

- enhance error handling and logging documentation (SCRUM-50) ([dd66d68](https://github.com/andriel300/tec-shop/commit/dd66d68))
- add comprehensive inline documentation for application bootstrap (SCRUM-48) ([6cc7180](https://github.com/andriel300/tec-shop/commit/6cc7180))
- add comprehensive inline documentation for security middleware (SCRUM-48) ([7572bdc](https://github.com/andriel300/tec-shop/commit/7572bdc))

### 🧱 Updated Dependencies

- Updated @tec-shop/notification-producer to 0.1.0
- Updated @tec-shop/auth-client to 0.1.0
- Updated @tec-shop/logger-producer to 0.1.0
- Updated @tec-shop/redis-client to 0.1.0
- Updated @tec-shop/service-auth to 0.1.0
- Updated @tec-shop/interceptor to 0.1.0
- Updated @tec-shop/metrics to 0.1.0
- Updated @tec-shop/tracing to 0.1.0
- Updated @tec-shop/dto to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300