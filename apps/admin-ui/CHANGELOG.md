# 1.0.0 (2026-03-15)

### 🧱 Updated Dependencies

- Updated @tec-shop/input to 1.0.0
- Updated @tec-shop/next-logger to 1.0.0
- Updated @tec-shop/i18n to 1.0.0

## 0.1.0 (2026-03-15)

### Features

- **frontend:** upgrade Next.js and migrate ImageKit integration across UIs ([c0d452c](https://github.com/andriel300/tec-shop/commit/c0d452c))
- **logging:** introduce shared next-logger library and replace console logging across UIs ([d181fab](https://github.com/andriel300/tec-shop/commit/d181fab))
- **observability,admin,seller,ui:** harden logging, admin order access, shop image persistence [SCRUM-33,SCRUM-34,SCRUM-27] ([532641f](https://github.com/andriel300/tec-shop/commit/532641f))
- **i18n:** add shared i18n library and consolidate translations ([ac5374f](https://github.com/andriel300/tec-shop/commit/ac5374f))
- **i18n:** expand internationalization across admin, seller and user apps ([9782693](https://github.com/andriel300/tec-shop/commit/9782693))
- **layout:** added site layout management with admin customization and public consumption ([c81eb1c](https://github.com/andriel300/tec-shop/commit/c81eb1c))
- **admin-ui:** enhance geographical map with summary stats and improved UX ([fe3e384](https://github.com/andriel300/tec-shop/commit/fe3e384))
- **admin:** unify admin orders endpoint, improve auth flow and add CSV export ([2a64780](https://github.com/andriel300/tec-shop/commit/2a64780))
- **admin-ui/brands,categories:** implement full CRUD hooks with API client and cache management ([d714760](https://github.com/andriel300/tec-shop/commit/d714760))
- **admin:** enhance dashboard with dynamic geographic analytics ([15e2c46](https://github.com/andriel300/tec-shop/commit/15e2c46))

### Bug Fixes

- resolve lint warnings and unused variables across services ([3dda6ff](https://github.com/andriel300/tec-shop/commit/3dda6ff))
- **security:** harden auth guards, file uploads, and payment price enforcement ([c6a48f5](https://github.com/andriel300/tec-shop/commit/c6a48f5))
- **sentry,admin-ui,seller-ui:** reduce noise and fix type errors [SCRUM-26] ([34d925f](https://github.com/andriel300/tec-shop/commit/34d925f))
- resolve all failing lint, typecheck, and test targets ([a2b2f26](https://github.com/andriel300/tec-shop/commit/a2b2f26))
- **logger-producer:** add missing Inject import and sync TypeScript project references ([dd7509e](https://github.com/andriel300/tec-shop/commit/dd7509e))
- **frontend:** correct import paths and next.config after i18n restructure ([a3cf242](https://github.com/andriel300/tec-shop/commit/a3cf242))
- **auth:** standardize refresh payload and enforce seller role guard ([e275975](https://github.com/andriel300/tec-shop/commit/e275975))
- **auth, ui:** annoying bug. prevent refresh recursion and guard protected seller routes ([c9836d4](https://github.com/andriel300/tec-shop/commit/c9836d4))

### Code Refactoring

- **admin-ui:** split customization page into modular tab components ([861ef3d](https://github.com/andriel300/tec-shop/commit/861ef3d))
- **logging:** replace console logs with structured next-logger across UIs and fix notification service wiring ([772a78c](https://github.com/andriel300/tec-shop/commit/772a78c))
- trying to fix all relative paths, typecheck, lint, build and see the logs of CI ([9d9f40e](https://github.com/andriel300/tec-shop/commit/9d9f40e))

### 🧱 Updated Dependencies

- Updated @tec-shop/input to 0.1.0
- Updated @tec-shop/next-logger to 0.1.0
- Updated @tec-shop/i18n to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300