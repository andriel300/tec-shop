## 0.1.0 (2026-03-15)

### Features

- **health:** add Prisma/Redis health indicators and simplify query parsing ([b6198e0](https://github.com/andriel300/tec-shop/commit/b6198e0))
- **api-gateway:** switch Stripe webhook handling to async event emission ([5d51726](https://github.com/andriel300/tec-shop/commit/5d51726))
- **observability,admin,seller,ui:** harden logging, admin order access, shop image persistence [SCRUM-33,SCRUM-34,SCRUM-27] ([532641f](https://github.com/andriel300/tec-shop/commit/532641f))
- **auth,seller-ui,user-ui:** add customer-to-seller account upgrade flow [SCRUM-32] ([99aa388](https://github.com/andriel300/tec-shop/commit/99aa388))
- **observability:** add health checks, distributed tracing, and Sentry to all services [SCRUM-27,SCRUM-31] ([d59eb63](https://github.com/andriel300/tec-shop/commit/d59eb63))
- **observability:** add Prometheus + Grafana metrics stack [SCRUM-27] ([9b4cfeb](https://github.com/andriel300/tec-shop/commit/9b4cfeb))
- **api-gateway:** add circuit breakers for all downstream service calls [SCRUM-30] ([59675e2](https://github.com/andriel300/tec-shop/commit/59675e2))
- **layout:** added site layout management with admin customization and public consumption ([c81eb1c](https://github.com/andriel300/tec-shop/commit/c81eb1c))
- **notification:** expose user notification API via gateway ([b2a9a02](https://github.com/andriel300/tec-shop/commit/b2a9a02))
- **api-gateway:** enhance Kafka configuration with flexible authentication ([b887eba](https://github.com/andriel300/tec-shop/commit/b887eba))
- integrate new microservices with API gateway and enhance security ([061126b](https://github.com/andriel300/tec-shop/commit/061126b))
- **auth:** improve error handling and add public shops endpoint ([e164474](https://github.com/andriel300/tec-shop/commit/e164474))
- **api:** enhance Swagger documentation and API metadata ([b2e9be2](https://github.com/andriel300/tec-shop/commit/b2e9be2))
- implement environment-aware rate limiting configuration ([6b6e895](https://github.com/andriel300/tec-shop/commit/6b6e895))
- **stripe:** [SCRUM-30] implement Stripe Connect integration for seller payments ([ea4a6d5](https://github.com/andriel300/tec-shop/commit/ea4a6d5))
- **seller:** [SCRUM-29, SCRUM-30] implement shop creation flow with enhanced UI and validation ([eb1e339](https://github.com/andriel300/tec-shop/commit/eb1e339))
- **security:** [SCRUM-30] implement comprehensive security hardening and testing framework ([b6e23c0](https://github.com/andriel300/tec-shop/commit/b6e23c0))
- **auth:** [SCRUM-30] implement seller authentication and profile management ([c765682](https://github.com/andriel300/tec-shop/commit/c765682))
- **auth:** implement secure password reset with token-based system ([d17a9de](https://github.com/andriel300/tec-shop/commit/d17a9de))
- **security:** implement comprehensive security enhancements ([d2bf719](https://github.com/andriel300/tec-shop/commit/d2bf719))
- **auth:** implement password reset flow and enhance authentication ([7ebfbb1](https://github.com/andriel300/tec-shop/commit/7ebfbb1))
- **security:** implement mutual TLS authentication for microservices ([a004f3e](https://github.com/andriel300/tec-shop/commit/a004f3e))
- implement email verification with OTP system ([21ec349](https://github.com/andriel300/tec-shop/commit/21ec349))
- implement structured logging and service separation ([ea318e6](https://github.com/andriel300/tec-shop/commit/ea318e6))
- implement mTLS security and service communication ([3052a73](https://github.com/andriel300/tec-shop/commit/3052a73))
- Add guards and jwt strategies ([75a8b7c](https://github.com/andriel300/tec-shop/commit/75a8b7c))
- initial setup for flow of sign up and login registration ([f472dd0](https://github.com/andriel300/tec-shop/commit/f472dd0))
- **api-gateway and auth-service:** refactor authentication to use NestJS patterns instead of Express middleware ([29f0126](https://github.com/andriel300/tec-shop/commit/29f0126))
- **user-ui:** enhance login experience with multiple authentication methods ([2d348cb](https://github.com/andriel300/tec-shop/commit/2d348cb))
- [SCRUM-59] implement comprehensive security enhancements with CSRF protection and cookie-based authentication ([8b38a1f](https://github.com/andriel300/tec-shop/commit/8b38a1f))
- [SCRUM-24, SCRUM-25, SCRUM-53] enhance security and add token refresh functionality ([9174711](https://github.com/andriel300/tec-shop/commit/9174711))
- add proxy documentation controller for auth endpoints (SCRUM-50) ([e81a4c6](https://github.com/andriel300/tec-shop/commit/e81a4c6))
- add Swagger API documentation for API gateway (SCRUM-50) ([cf16c44](https://github.com/andriel300/tec-shop/commit/cf16c44))
- configure shared common library and update dependencies (SCRUM-45) ([3f1a095](https://github.com/andriel300/tec-shop/commit/3f1a095))
- configure API gateway as reverse proxy and enable CORS (SCRUM-45) ([978b0df](https://github.com/andriel300/tec-shop/commit/978b0df))
- add shared common library and global NestJS utilities (SCRUM-44) ([357a33f](https://github.com/andriel300/tec-shop/commit/357a33f))
- add NestJS and install NestJS API gateway with end-to-end testing infrastructure ([0a2bf75](https://github.com/andriel300/tec-shop/commit/0a2bf75))

### Bug Fixes

- resolve lint warnings and unused variables across services ([3dda6ff](https://github.com/andriel300/tec-shop/commit/3dda6ff))
- **security:** enforce FRONTEND_URL validation and improve error handling ([e05b924](https://github.com/andriel300/tec-shop/commit/e05b924))
- **security:** harden authentication with unified token generation and admin support ([4a0a418](https://github.com/andriel300/tec-shop/commit/4a0a418))
- add redundant array check and remove unused props ([b93e75c](https://github.com/andriel300/tec-shop/commit/b93e75c))
- **security:** add type confusion protection for file uploads and batch endpoints ([1eac850](https://github.com/andriel300/tec-shop/commit/1eac850))
- **security:** harden authentication, XSS protection, and container security ([76284b4](https://github.com/andriel300/tec-shop/commit/76284b4))
- **api-gateway:** replace deprecated nestjs-throttler-storage-redis ([b007979](https://github.com/andriel300/tec-shop/commit/b007979))
- **security:** harden auth guards, file uploads, and payment price enforcement ([c6a48f5](https://github.com/andriel300/tec-shop/commit/c6a48f5))
- **sentry,admin-ui,seller-ui:** reduce noise and fix type errors [SCRUM-26] ([34d925f](https://github.com/andriel300/tec-shop/commit/34d925f))
- resolve all failing lint, typecheck, and test targets ([a2b2f26](https://github.com/andriel300/tec-shop/commit/a2b2f26))
- **auth:** standardize refresh payload and enforce seller role guard ([e275975](https://github.com/andriel300/tec-shop/commit/e275975))
- **api-gateway:** update cookie paths and improve auth response ([c97a7a7](https://github.com/andriel300/tec-shop/commit/c97a7a7))
- solve TypeScript errors and test properly handle issues ([3920d2d](https://github.com/andriel300/tec-shop/commit/3920d2d))
- resolve TypeScript and configuration issues ([8232981](https://github.com/andriel300/tec-shop/commit/8232981))
- **auth:** [SCRUM-29, SCRUM-30] resolve Stripe Connect integration and authentication flow issues ([5a2d401](https://github.com/andriel300/tec-shop/commit/5a2d401))
- improve type safety and error handling across the application, please CI Works. ([e24211a](https://github.com/andriel300/tec-shop/commit/e24211a))
- change relative paths to absolute paths for mTLS certs folder. ([1a337fe](https://github.com/andriel300/tec-shop/commit/1a337fe))
- [SCRUM-59] resolve CSRF token generation and middleware configuration issues ([58501c8](https://github.com/andriel300/tec-shop/commit/58501c8))
- [SCRUM-53] correct wildcard route configuration in app modules ([4465836](https://github.com/andriel300/tec-shop/commit/4465836))

### Code Refactoring

- improve production readiness with graceful shutdown and config injection ([146817b](https://github.com/andriel300/tec-shop/commit/146817b))
- **services:** standardize microservice error handling and add caching ([c114ce0](https://github.com/andriel300/tec-shop/commit/c114ce0))
- enable graceful shutdown hooks and inject config service ([a155056](https://github.com/andriel300/tec-shop/commit/a155056))
- **security:** enforce mandatory mTLS across all services ([b6b1190](https://github.com/andriel300/tec-shop/commit/b6b1190))
- **logging:** replace console logs with structured next-logger across UIs and fix notification service wiring ([772a78c](https://github.com/andriel300/tec-shop/commit/772a78c))
- trying to fix all relative paths, typecheck, lint, build and see the logs of CI ([9d9f40e](https://github.com/andriel300/tec-shop/commit/9d9f40e))
- format all files running "npx nx format" ([7dfa55c](https://github.com/andriel300/tec-shop/commit/7dfa55c))
- improve type safety and code quality ([a615c8c](https://github.com/andriel300/tec-shop/commit/a615c8c))
- **shared:** centralize DTOs into shared library and update imports ([caca874](https://github.com/andriel300/tec-shop/commit/caca874))
- restructure auth service and API gateway ([74a62fe](https://github.com/andriel300/tec-shop/commit/74a62fe))
- [SCRUM-53] clean up code and remove unused util library ([e9d4fbe](https://github.com/andriel300/tec-shop/commit/e9d4fbe))
- [SCRUM-53] restructure shared libraries into modular packages ([e4afc84](https://github.com/andriel300/tec-shop/commit/e4afc84))
- update service ports and add development script ([be410f5](https://github.com/andriel300/tec-shop/commit/be410f5))

### Documentation Changes

- enhance error handling and logging documentation (SCRUM-50) ([dd66d68](https://github.com/andriel300/tec-shop/commit/dd66d68))
- add comprehensive inline documentation for application bootstrap (SCRUM-48) ([6cc7180](https://github.com/andriel300/tec-shop/commit/6cc7180))
- add comprehensive inline documentation for security middleware (SCRUM-48) ([7572bdc](https://github.com/andriel300/tec-shop/commit/7572bdc))

### 🧱 Updated Dependencies

- Updated @tec-shop/logger-producer to 0.1.0
- Updated @tec-shop/redis-client to 0.1.0
- Updated @tec-shop/shared/imagekit to 0.1.0
- Updated @tec-shop/metrics to 0.1.0
- Updated @tec-shop/tracing to 0.1.0
- Updated @tec-shop/dto to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300