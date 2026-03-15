## 0.1.0 (2026-03-15)

### Features

- **health:** add Prisma/Redis health indicators and simplify query parsing ([b6198e0](https://github.com/andriel300/tec-shop/commit/b6198e0))
- **observability,admin,seller,ui:** harden logging, admin order access, shop image persistence [SCRUM-33,SCRUM-34,SCRUM-27] ([532641f](https://github.com/andriel300/tec-shop/commit/532641f))
- **observability:** add health checks, distributed tracing, and Sentry to all services [SCRUM-27,SCRUM-31] ([d59eb63](https://github.com/andriel300/tec-shop/commit/d59eb63))
- **observability:** add Prometheus + Grafana metrics stack [SCRUM-27] ([9b4cfeb](https://github.com/andriel300/tec-shop/commit/9b4cfeb))
- **api-gateway:** add circuit breakers for all downstream service calls [SCRUM-30] ([59675e2](https://github.com/andriel300/tec-shop/commit/59675e2))
- **products:** add comprehensive product management scripts and improve error handling ([d45dbd1](https://github.com/andriel300/tec-shop/commit/d45dbd1))

### Bug Fixes

- **security:** harden auth guards, file uploads, and payment price enforcement ([c6a48f5](https://github.com/andriel300/tec-shop/commit/c6a48f5))
- **sentry,admin-ui,seller-ui:** reduce noise and fix type errors [SCRUM-26] ([34d925f](https://github.com/andriel300/tec-shop/commit/34d925f))
- resolve all failing lint, typecheck, and test targets ([a2b2f26](https://github.com/andriel300/tec-shop/commit/a2b2f26))
- **logger-producer:** add missing Inject import and sync TypeScript project references ([dd7509e](https://github.com/andriel300/tec-shop/commit/dd7509e))
- solve TypeScript errors and test properly handle issues ([3920d2d](https://github.com/andriel300/tec-shop/commit/3920d2d))
- resolve TypeScript and configuration issues ([8232981](https://github.com/andriel300/tec-shop/commit/8232981))

### Performance Improvements

- **product:** optimize variant filtering with Prisma JSON path queries ([4b4b44d](https://github.com/andriel300/tec-shop/commit/4b4b44d))

### Code Refactoring

- improve production readiness with graceful shutdown and config injection ([146817b](https://github.com/andriel300/tec-shop/commit/146817b))
- **services:** standardize microservice error handling and add caching ([c114ce0](https://github.com/andriel300/tec-shop/commit/c114ce0))
- **services:** apply single responsibility principle across product and seller services ([4f966b6](https://github.com/andriel300/tec-shop/commit/4f966b6))
- **Nestjs:** split monolithic services into domain-focused services ([fd39b07](https://github.com/andriel300/tec-shop/commit/fd39b07))
- enable graceful shutdown hooks and inject config service ([a155056](https://github.com/andriel300/tec-shop/commit/a155056))
- **security:** enforce mandatory mTLS across all services ([b6b1190](https://github.com/andriel300/tec-shop/commit/b6b1190))
- trying to fix all relative paths, typecheck, lint, build and see the logs of CI ([9d9f40e](https://github.com/andriel300/tec-shop/commit/9d9f40e))
- **products:** enhance product seeding with Faker.js for realistic data ([054659d](https://github.com/andriel300/tec-shop/commit/054659d))
- format all files running "npx nx format" ([7dfa55c](https://github.com/andriel300/tec-shop/commit/7dfa55c))

### 🧱 Updated Dependencies

- Updated @tec-shop/product-client to 0.1.0
- Updated @tec-shop/notification-producer to 0.1.0
- Updated @tec-shop/seller-client to 0.1.0
- Updated @tec-shop/logger-producer to 0.1.0
- Updated @tec-shop/interceptor to 0.1.0
- Updated @tec-shop/metrics to 0.1.0
- Updated @tec-shop/tracing to 0.1.0
- Updated @tec-shop/dto to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300