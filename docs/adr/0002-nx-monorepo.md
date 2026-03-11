# ADR-0002: Nx Monorepo for Multi-Service Development

## Status
Accepted

## Context
With 12 backend services, 3 frontend applications, and 13+ shared libraries, we
needed a repository strategy that enabled code sharing without duplication, consistent
tooling, and efficient CI/CD. Separate repositories (polyrepo) would have required
publishing and versioning shared libraries for every change.

## Decision
We adopted an Nx monorepo at the workspace root, containing all apps and libs under
`apps/` and `libs/` respectively. Nx provides:

- **Affected builds/tests**: only projects impacted by a change are rebuilt or retested
- **Dependency graph enforcement**: ESLint module boundary rules prevent architectural
  violations (e.g., frontend importing backend-only libs, app importing another app)
- **Tag taxonomy**: `type:app|lib`, `scope:frontend|backend|shared`,
  `domain:auth|user|seller|product|order|...` enforced via `eslint.config.mjs`
- **Generators**: consistent scaffolding for new services and libraries
- **Shared libraries without publishing**: `tsconfig.base.json` path aliases resolve
  shared libraries directly without an npm publish step

## Alternatives Considered
- **Polyrepo** — each service in its own repository. Rejected because shared DTOs,
  Prisma clients, and utility libraries would require versioned npm packages and
  coordinated releases for every cross-service change.
- **Turborepo** — similar monorepo tooling. Nx was preferred for its richer plugin
  ecosystem (NestJS and Next.js generators) and more expressive dependency graph
  with tag-based boundary enforcement.

## Consequences
- **Positive:** Single `pnpm install`; instant shared library changes without
  publishing; consistent lint/test/build commands; affected-only CI.
- **Negative:** Repository grows large over time; all services must use compatible
  dependency versions (managed via root `package.json`).

## Trade-offs
Dependency version uniformity across all services was accepted as a constraint in
exchange for zero-overhead code sharing and consistent tooling.
