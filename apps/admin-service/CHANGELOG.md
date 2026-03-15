## 0.1.0 (2026-03-15)

### Features

- **health:** add Prisma/Redis health indicators and simplify query parsing ([b6198e0](https://github.com/andriel300/tec-shop/commit/b6198e0))
- **observability,admin,seller,ui:** harden logging, admin order access, shop image persistence [SCRUM-33,SCRUM-34,SCRUM-27] ([532641f](https://github.com/andriel300/tec-shop/commit/532641f))
- **observability:** add health checks, distributed tracing, and Sentry to all services [SCRUM-27,SCRUM-31] ([d59eb63](https://github.com/andriel300/tec-shop/commit/d59eb63))
- **observability:** add Prometheus + Grafana metrics stack [SCRUM-27] ([9b4cfeb](https://github.com/andriel300/tec-shop/commit/9b4cfeb))
- **layout:** added site layout management with admin customization and public consumption ([c81eb1c](https://github.com/andriel300/tec-shop/commit/c81eb1c))

### Bug Fixes

- **security:** harden authentication, XSS protection, and container security ([76284b4](https://github.com/andriel300/tec-shop/commit/76284b4))
- **security:** harden auth guards, file uploads, and payment price enforcement ([c6a48f5](https://github.com/andriel300/tec-shop/commit/c6a48f5))
- ⚠️  **auth:** update user schema and admin seeding ([3aed9f7](https://github.com/andriel300/tec-shop/commit/3aed9f7))

### Code Refactoring

- improve production readiness with graceful shutdown and config injection ([146817b](https://github.com/andriel300/tec-shop/commit/146817b))
- **services:** standardize microservice error handling and add caching ([c114ce0](https://github.com/andriel300/tec-shop/commit/c114ce0))
- **admin-service:** split AdminService into domain-focused services ([d0f21d9](https://github.com/andriel300/tec-shop/commit/d0f21d9))

### ⚠️  Breaking Changes

- **auth:** update user schema and admin seeding  ([3aed9f7](https://github.com/andriel300/tec-shop/commit/3aed9f7))
  User model schema changes require database migration
  - googleId field is no longer unique (allows multiple OAuth providers)
  - isBanned field added for user moderation
  - Admin seeding no longer includes name field

### 🧱 Updated Dependencies

- Updated @tec-shop/notification-producer to 0.1.0
- Updated @tec-shop/seller-client to 0.1.0
- Updated @tec-shop/order-client to 0.1.0
- Updated @tec-shop/auth-client to 0.1.0
- Updated @tec-shop/user-client to 0.1.0
- Updated @tec-shop/interceptor to 0.1.0
- Updated @tec-shop/metrics to 0.1.0
- Updated @tec-shop/tracing to 0.1.0
- Updated @tec-shop/dto to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300