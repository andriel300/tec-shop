## 0.1.0 (2026-03-15)

### Features

- **stripe:** [SCRUM-30] implement Stripe Connect integration for seller payments ([ea4a6d5](https://github.com/andriel300/tec-shop/commit/ea4a6d5))

### Bug Fixes

- **nx:** add outputs configuration for prisma generate targets ([f217945](https://github.com/andriel300/tec-shop/commit/f217945))
- ⚠️  **auth:** update user schema and admin seeding ([3aed9f7](https://github.com/andriel300/tec-shop/commit/3aed9f7))
- solve the ImageKitService dependency injection error ([2ecef63](https://github.com/andriel300/tec-shop/commit/2ecef63))
- **testing:** [SCRUM-29, SCRUM-30] resolve TypeScript and testing configuration issues ([79a9d13](https://github.com/andriel300/tec-shop/commit/79a9d13))

### Code Refactoring

- **prisma:** [SCRUM-30] move all prisma from Microservices to libs folder to respect Nx archtecture ([796dd0b](https://github.com/andriel300/tec-shop/commit/796dd0b))

### ⚠️  Breaking Changes

- **auth:** update user schema and admin seeding  ([3aed9f7](https://github.com/andriel300/tec-shop/commit/3aed9f7))
  User model schema changes require database migration
  - googleId field is no longer unique (allows multiple OAuth providers)
  - isBanned field added for user moderation
  - Admin seeding no longer includes name field

### ❤️ Thank You

- andrieljose @andriel300