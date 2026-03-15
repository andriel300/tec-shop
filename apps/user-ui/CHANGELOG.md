# 1.0.0 (2026-03-15)

### 🧱 Updated Dependencies

- Updated @tec-shop/next-logger to 1.0.0
- Updated @tec-shop/i18n to 1.0.0

## 0.1.0 (2026-03-15)

### Features

- **frontend:** upgrade Next.js and migrate ImageKit integration across UIs ([c0d452c](https://github.com/andriel300/tec-shop/commit/c0d452c))
- **logging:** introduce shared next-logger library and replace console logging across UIs ([d181fab](https://github.com/andriel300/tec-shop/commit/d181fab))
- **observability,admin,seller,ui:** harden logging, admin order access, shop image persistence [SCRUM-33,SCRUM-34,SCRUM-27] ([532641f](https://github.com/andriel300/tec-shop/commit/532641f))
- **auth,seller-ui,user-ui:** add customer-to-seller account upgrade flow [SCRUM-32] ([99aa388](https://github.com/andriel300/tec-shop/commit/99aa388))
- **i18n:** add shared i18n library and consolidate translations ([ac5374f](https://github.com/andriel300/tec-shop/commit/ac5374f))
- **i18n:** expand internationalization across admin, seller and user apps ([9782693](https://github.com/andriel300/tec-shop/commit/9782693))
- **user-ui:** enhance section title with animated SVG underline ([faf9456](https://github.com/andriel300/tec-shop/commit/faf9456))
- **user-ui:** render color attributes as selectable swatches in product details ([2838040](https://github.com/andriel300/tec-shop/commit/2838040))
- **layout:** added site layout management with admin customization and public consumption ([c81eb1c](https://github.com/andriel300/tec-shop/commit/c81eb1c))
- **user-ui:** add conditional footer import to layout.tsx ([c74da06](https://github.com/andriel300/tec-shop/commit/c74da06))
- **user-ui:** implement enhanced navigation with categories and search ([43dfcde](https://github.com/andriel300/tec-shop/commit/43dfcde))
- **product:** [SCRUM-89,SCRUM-91] implement product view details page ([fabcf46](https://github.com/andriel300/tec-shop/commit/fabcf46))
- **ui:** implement react image magnify alternative to zoom images component ([614f57c](https://github.com/andriel300/tec-shop/commit/614f57c))
- **auth:** implement secure password reset with token-based system ([d17a9de](https://github.com/andriel300/tec-shop/commit/d17a9de))
- **ui:** enhance OTP verification with improved user experience ([d3c7985](https://github.com/andriel300/tec-shop/commit/d3c7985))
- **security:** implement comprehensive security enhancements ([d2bf719](https://github.com/andriel300/tec-shop/commit/d2bf719))
- **auth:** implement password reset flow and enhance authentication ([7ebfbb1](https://github.com/andriel300/tec-shop/commit/7ebfbb1))
- [SCRUM-26, SCRUM-27, SCRUM-23] add password reset flow and auth context ([6c4f6b2](https://github.com/andriel300/tec-shop/commit/6c4f6b2))
- **user-ui:** [SCRUM-23] implement complete registration flow with OTP verification and New SignUp Form ([9de8e91](https://github.com/andriel300/tec-shop/commit/9de8e91))
- **user-ui:** [SCRUM-23] enhance authentication UX and add registration flow ([46f6329](https://github.com/andriel300/tec-shop/commit/46f6329))
- **user-ui:** enhance login experience with multiple authentication methods ([2d348cb](https://github.com/andriel300/tec-shop/commit/2d348cb))
- **user-ui:** implement login page with form validation and API integration ([6af41eb](https://github.com/andriel300/tec-shop/commit/6af41eb))
- **user-ui:** add React Query provider and integrate with layout ([d00f7f9](https://github.com/andriel300/tec-shop/commit/d00f7f9))
- [SCRUM-61] implement sticky header with navigation and user actions ([607f1f8](https://github.com/andriel300/tec-shop/commit/607f1f8))
- [SCRUM-23] add shopping cart icon to header navigation ([0059fa4](https://github.com/andriel300/tec-shop/commit/0059fa4))
- [SCRUM-23] enhance header with search functionality and user navigation ([b304b8c](https://github.com/andriel300/tec-shop/commit/b304b8c))
- [SCRUM-23] implement comprehensive design system with Tailwind CSS ([b2d2996](https://github.com/andriel300/tec-shop/commit/b2d2996))
- [SCRUM-23] implement basic header component and update user interface styling ([96bf2d6](https://github.com/andriel300/tec-shop/commit/96bf2d6))
- [SCRUM-23] create Next.js user interface application with complete setup ([e1a5109](https://github.com/andriel300/tec-shop/commit/e1a5109))

### Bug Fixes

- resolve lint warnings and unused variables across services ([3dda6ff](https://github.com/andriel300/tec-shop/commit/3dda6ff))
- **security:** harden authentication, XSS protection, and container security ([76284b4](https://github.com/andriel300/tec-shop/commit/76284b4))
- **user-ui,i18n:** correct Next.js route types and improve typed navigation helpers ([ae6cb48](https://github.com/andriel300/tec-shop/commit/ae6cb48))
- **security:** harden auth guards, file uploads, and payment price enforcement ([c6a48f5](https://github.com/andriel300/tec-shop/commit/c6a48f5))
- resolve all failing lint, typecheck, and test targets ([a2b2f26](https://github.com/andriel300/tec-shop/commit/a2b2f26))
- **logger-producer:** add missing Inject import and sync TypeScript project references ([dd7509e](https://github.com/andriel300/tec-shop/commit/dd7509e))
- **frontend:** correct import paths and next.config after i18n restructure ([a3cf242](https://github.com/andriel300/tec-shop/commit/a3cf242))
- **auth:** standardize refresh payload and enforce seller role guard ([e275975](https://github.com/andriel300/tec-shop/commit/e275975))
- **auth, ui:** annoying bug. prevent refresh recursion and guard protected seller routes ([c9836d4](https://github.com/andriel300/tec-shop/commit/c9836d4))
- **user-ui:** improve payment and profile page Suspense handling ([98f5591](https://github.com/andriel300/tec-shop/commit/98f5591))
- update seller signup link to use environment variable ([3f96e46](https://github.com/andriel300/tec-shop/commit/3f96e46))
- **ssr bug:** resolve server-side rendering issues in auth and store ([673686e](https://github.com/andriel300/tec-shop/commit/673686e))
- **store:** correct product type definition ([f1c71ac](https://github.com/andriel300/tec-shop/commit/f1c71ac))
- improve type safety and error handling across the application, please CI Works. ([e24211a](https://github.com/andriel300/tec-shop/commit/e24211a))
- [SCRUM-63] improve login error handling and OTP form UX ([fe00b72](https://github.com/andriel300/tec-shop/commit/fe00b72))

### Code Refactoring

- **logging:** replace console logs with structured next-logger across UIs and fix notification service wiring ([772a78c](https://github.com/andriel300/tec-shop/commit/772a78c))
- **user-ui:** rename Header to Navbar and enhance sticky navigation behavior ([e12cbf5](https://github.com/andriel300/tec-shop/commit/e12cbf5))
- trying to fix all relative paths, typecheck, lint, build and see the logs of CI ([9d9f40e](https://github.com/andriel300/tec-shop/commit/9d9f40e))
- migrate Sentry configuration to latest setup ([8f4672a](https://github.com/andriel300/tec-shop/commit/8f4672a))
- format all files running "npx nx format" ([7dfa55c](https://github.com/andriel300/tec-shop/commit/7dfa55c))
- improve type safety and code quality ([a615c8c](https://github.com/andriel300/tec-shop/commit/a615c8c))
- **shared:** centralize DTOs into shared library and update imports ([caca874](https://github.com/andriel300/tec-shop/commit/caca874))

### 🧱 Updated Dependencies

- Updated @tec-shop/next-logger to 0.1.0
- Updated @tec-shop/i18n to 0.1.0

### ❤️ Thank You

- andrieljose @andriel300