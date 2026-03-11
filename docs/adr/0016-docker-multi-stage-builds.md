# ADR-0016: Docker with Multi-Stage Builds for Service Containerisation

## Status
Accepted

## Context
With 12 backend services and 3 frontend applications, each needing to be built
and deployed consistently across development, staging, and production environments,
we needed a containerisation strategy that produced small, secure images without
bundling build tools into the runtime image.

## Decision
We containerised all services using Docker with a standardised 3-stage build pattern:

```
Stage 1 (deps)    — node:22-alpine: install production dependencies only (pnpm --prod)
Stage 2 (builder) — node:22-alpine: install all deps, run `npx nx build <service>`
Stage 3 (runner)  — node:22-alpine: copy only production deps + built dist, run as
                    non-root user (uid 1001)
```

One Dockerfile per service lives in `infrastructure/docker/services/`. A
`docker-compose.infra.yml` runs the supporting infrastructure (Redis, Kafka,
Prometheus, Grafana, Jaeger) for local development, while the NestJS services
themselves are run via `nx serve` locally (not in Docker during development).

Production compose (`docker-compose.prod.yml`) adds image tagging with
`${REGISTRY}/tec-shop-*:${IMAGE_TAG}`, resource limits, `restart: always`, and
JSON file log rotation (10 MB, 3 files).

## Alternatives Considered
- **Single-stage builds** — simpler Dockerfiles but ship build tools, devDependencies,
  and source maps into the runtime image, significantly increasing image size and
  attack surface.
- **Distroless images** — minimal attack surface but no shell for debugging;
  `node:22-alpine` was chosen as a pragmatic balance of size and debuggability.
- **Buildpacks (Heroku/Paketo)** — automated build detection without Dockerfiles.
  Rejected because our Nx monorepo build commands require explicit configuration
  that buildpacks cannot infer.

## Consequences
- **Positive:** Runtime images contain only production code and dependencies; non-root
  user in production reduces privilege escalation risk; consistent environment across
  all stages.
- **Negative:** Multi-stage builds are slower than single-stage due to layer copying;
  each service requires its own Dockerfile to be maintained.

## Trade-offs
Build time overhead was accepted for the security and size benefits of excluding
build tools and devDependencies from production images.
