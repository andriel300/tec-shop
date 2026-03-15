## 0.1.0 (2026-03-15)

### Features

- **health:** add Prisma/Redis health indicators and simplify query parsing ([b6198e0](https://github.com/andriel300/tec-shop/commit/b6198e0))
- **observability,admin,seller,ui:** harden logging, admin order access, shop image persistence [SCRUM-33,SCRUM-34,SCRUM-27] ([532641f](https://github.com/andriel300/tec-shop/commit/532641f))
- **observability:** add health checks, distributed tracing, and Sentry to all services [SCRUM-27,SCRUM-31] ([d59eb63](https://github.com/andriel300/tec-shop/commit/d59eb63))
- **observability:** add Prometheus + Grafana metrics stack [SCRUM-27] ([9b4cfeb](https://github.com/andriel300/tec-shop/commit/9b4cfeb))
- integrate new microservices with API gateway and enhance security ([061126b](https://github.com/andriel300/tec-shop/commit/061126b))
- **stripe:** [SCRUM-30] implement Stripe Connect integration for seller payments ([ea4a6d5](https://github.com/andriel300/tec-shop/commit/ea4a6d5))
- **seller:** [SCRUM-29, SCRUM-30] implement shop creation flow with enhanced UI and validation ([eb1e339](https://github.com/andriel300/tec-shop/commit/eb1e339))
- **security:** [SCRUM-30] implement comprehensive security hardening and testing framework ([b6e23c0](https://github.com/andriel300/tec-shop/commit/b6e23c0))
- **auth:** [SCRUM-30] implement seller authentication and profile management ([c765682](https://github.com/andriel300/tec-shop/commit/c765682))
- **seller-service:** [SCRUM-30] initialize seller service with database schema and microservice setup ([6a762b6](https://github.com/andriel300/tec-shop/commit/6a762b6))

### Bug Fixes

- resolve lint warnings and unused variables across services ([3dda6ff](https://github.com/andriel300/tec-shop/commit/3dda6ff))
- **security:** enforce FRONTEND_URL validation and improve error handling ([e05b924](https://github.com/andriel300/tec-shop/commit/e05b924))
- **security:** harden authentication, XSS protection, and container security ([76284b4](https://github.com/andriel300/tec-shop/commit/76284b4))
- **sentry,admin-ui,seller-ui:** reduce noise and fix type errors [SCRUM-26] ([34d925f](https://github.com/andriel300/tec-shop/commit/34d925f))
- resolve all failing lint, typecheck, and test targets ([a2b2f26](https://github.com/andriel300/tec-shop/commit/a2b2f26))
- **logger-producer:** add missing Inject import and sync TypeScript project references ([dd7509e](https://github.com/andriel300/tec-shop/commit/dd7509e))
- solve TypeScript errors and test properly handle issues ([3920d2d](https://github.com/andriel300/tec-shop/commit/3920d2d))
- **testing:** [SCRUM-29, SCRUM-30] resolve TypeScript and testing configuration issues ([79a9d13](https://github.com/andriel300/tec-shop/commit/79a9d13))
- **auth:** [SCRUM-29, SCRUM-30] resolve Stripe Connect integration and authentication flow issues ([5a2d401](https://github.com/andriel300/tec-shop/commit/5a2d401))

### Code Refactoring

- improve production readiness with graceful shutdown and config injection ([146817b](https://github.com/andriel300/tec-shop/commit/146817b))
- **services:** standardize microservice error handling and add caching ([c114ce0](https://github.com/andriel300/tec-shop/commit/c114ce0))
- **services:** apply single responsibility principle across product and seller services ([4f966b6](https://github.com/andriel300/tec-shop/commit/4f966b6))
- enable graceful shutdown hooks and inject config service ([a155056](https://github.com/andriel300/tec-shop/commit/a155056))
- **seller-service:** remove unused default app controller and service ([90d687c](https://github.com/andriel300/tec-shop/commit/90d687c))
- trying to fix all relative paths, typecheck, lint, build and see the logs of CI ([9d9f40e](https://github.com/andriel300/tec-shop/commit/9d9f40e))
- format all files running "npx nx format" ([7dfa55c](https://github.com/andriel300/tec-shop/commit/7dfa55c))

### 🧱 Updated Dependencies

- Updated @tec-shop/seller-client to 0.1.0
- Updated @tec-shop/logger-producer to 0.1.0
- Updated @tec-shop/service-auth to 0.1.0
- Updated @tec-shop/interceptor to 0.1.0
- Updated @tec-shop/metrics to 0.1.0
- Updated @tec-shop/tracing to 0.1.0
- Updated @tec-shop/dto to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300