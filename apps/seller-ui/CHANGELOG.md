## 0.1.0 (2026-03-15)

### Features

- **frontend:** upgrade Next.js and migrate ImageKit integration across UIs ([c0d452c](https://github.com/andriel300/tec-shop/commit/c0d452c))
- **logging:** introduce shared next-logger library and replace console logging across UIs ([d181fab](https://github.com/andriel300/tec-shop/commit/d181fab))
- **observability,admin,seller,ui:** harden logging, admin order access, shop image persistence [SCRUM-33,SCRUM-34,SCRUM-27] ([532641f](https://github.com/andriel300/tec-shop/commit/532641f))
- **auth,seller-ui,user-ui:** add customer-to-seller account upgrade flow [SCRUM-32] ([99aa388](https://github.com/andriel300/tec-shop/commit/99aa388))
- **i18n:** add shared i18n library and consolidate translations ([ac5374f](https://github.com/andriel300/tec-shop/commit/ac5374f))
- **i18n:** expand internationalization across admin, seller and user apps ([9782693](https://github.com/andriel300/tec-shop/commit/9782693))
- **seller-ui:** enhance image management and authentication flow ([1cde6d4](https://github.com/andriel300/tec-shop/commit/1cde6d4))
- add React Query hooks for products, brands, and categories ([bd13db1](https://github.com/andriel300/tec-shop/commit/bd13db1))
- **stripe:** [SCRUM-30] implement Stripe Connect integration for seller payments ([ea4a6d5](https://github.com/andriel300/tec-shop/commit/ea4a6d5))
- **seller:** [SCRUM-29, SCRUM-30] implement shop creation flow with enhanced UI and validation ([eb1e339](https://github.com/andriel300/tec-shop/commit/eb1e339))
- **seller-ui:** [SCRUM-29] Initial setup for createShop feature ([f8ce2e5](https://github.com/andriel300/tec-shop/commit/f8ce2e5))
- **SCRUM-29:** initialize seller UI application with comprehensive setup ([98417e4](https://github.com/andriel300/tec-shop/commit/98417e4))
- **SCRUM-29:** implement full authentication flow for seller-ui ([aab50ea](https://github.com/andriel300/tec-shop/commit/aab50ea))
- **SCRUM-29:** add seller-ui initial pages and SellerSignupDto ([52480aa](https://github.com/andriel300/tec-shop/commit/52480aa))

### Bug Fixes

- resolve lint warnings and unused variables across services ([3dda6ff](https://github.com/andriel300/tec-shop/commit/3dda6ff))
- add redundant array check and remove unused props ([b93e75c](https://github.com/andriel300/tec-shop/commit/b93e75c))
- **security:** sanitize image URLs to prevent XSS attacks ([22d7b90](https://github.com/andriel300/tec-shop/commit/22d7b90))
- **security:** harden auth guards, file uploads, and payment price enforcement ([c6a48f5](https://github.com/andriel300/tec-shop/commit/c6a48f5))
- **sentry,admin-ui,seller-ui:** reduce noise and fix type errors [SCRUM-26] ([34d925f](https://github.com/andriel300/tec-shop/commit/34d925f))
- resolve all failing lint, typecheck, and test targets ([a2b2f26](https://github.com/andriel300/tec-shop/commit/a2b2f26))
- **logger-producer:** add missing Inject import and sync TypeScript project references ([dd7509e](https://github.com/andriel300/tec-shop/commit/dd7509e))
- **frontend:** correct import paths and next.config after i18n restructure ([a3cf242](https://github.com/andriel300/tec-shop/commit/a3cf242))
- **auth:** standardize refresh payload and enforce seller role guard ([e275975](https://github.com/andriel300/tec-shop/commit/e275975))
- **seller-ui, dashboard:** adjust event date inputs and align events route in sidebar ([cea6440](https://github.com/andriel300/tec-shop/commit/cea6440))
- **auth, ui:** annoying bug. prevent refresh recursion and guard protected seller routes ([c9836d4](https://github.com/andriel300/tec-shop/commit/c9836d4))
- solve TypeScript errors and test properly handle issues ([3920d2d](https://github.com/andriel300/tec-shop/commit/3920d2d))
- add ImageKit domain to Next.js image configuration ([d4b6539](https://github.com/andriel300/tec-shop/commit/d4b6539))
- **testing:** [SCRUM-29, SCRUM-30] resolve TypeScript and testing configuration issues ([79a9d13](https://github.com/andriel300/tec-shop/commit/79a9d13))
- **auth:** [SCRUM-29, SCRUM-30] resolve Stripe Connect integration and authentication flow issues ([5a2d401](https://github.com/andriel300/tec-shop/commit/5a2d401))

### Code Refactoring

- **logging:** replace console logs with structured next-logger across UIs and fix notification service wiring ([772a78c](https://github.com/andriel300/tec-shop/commit/772a78c))
- trying to fix all relative paths, typecheck, lint, build and see the logs of CI ([9d9f40e](https://github.com/andriel300/tec-shop/commit/9d9f40e))
- migrate Sentry configuration to latest setup ([8f4672a](https://github.com/andriel300/tec-shop/commit/8f4672a))
- migrate from Jotai to Zustand for state management ([551e3f9](https://github.com/andriel300/tec-shop/commit/551e3f9))
- migrate form components to React Query for data fetching ([850c584](https://github.com/andriel300/tec-shop/commit/850c584))
- format all files running "npx nx format" ([7dfa55c](https://github.com/andriel300/tec-shop/commit/7dfa55c))

### 🧱 Updated Dependencies

- Updated @tec-shop/next-logger to 0.1.0
- Updated @tec-shop/i18n to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300