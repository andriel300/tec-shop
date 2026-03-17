# Development Commands

## Workflow A — Host-based dev

```bash
pnpm infra:up                         # Start Redis + Kafka + Zookeeper
pnpm infra:down                       # Stop infrastructure
pnpm infra:restart                    # Restart infrastructure
pnpm infra:logs                       # Tail infrastructure logs
pnpm dev                              # Start all services with hot reload
npx nx serve <service-name>           # Start a single backend service
pnpm dev:ui:user                      # User storefront  (localhost:3000)
pnpm dev:ui:seller                    # Seller dashboard (localhost:3001)
pnpm dev:ui:admin                     # Admin panel      (localhost:3002)
```

## Workflow B — Full Docker stack

```bash
pnpm stack:up:build                   # Build all images and start
pnpm stack:up                         # Start without rebuilding
pnpm stack:down                       # Tear down and wipe volumes
pnpm stack:logs                       # Tail all container logs
```

## Workflow C — Local Kubernetes (kind)

```bash
pnpm k8s:build                        # Build images + load into kind cluster
pnpm k8s:secrets                      # Create K8s secrets from .env + certs/
pnpm k8s:deploy                       # Helm install/upgrade (local)
pnpm k8s:deploy:dev                   # Helm deploy to dev environment
pnpm k8s:deploy:demo                  # Helm deploy to Oracle Cloud free tier
pnpm k8s:deploy:prod                  # Helm deploy to production
pnpm k8s:status                       # List all pods in tec-shop namespace
pnpm k8s:logs                         # Follow logs for all tec-shop pods
pnpm k8s:teardown                     # Uninstall Helm release
```

## Build, lint, test

```bash
pnpm build                            # Build all projects
pnpm lint                             # Lint all projects
pnpm typecheck                        # Type-check all projects
pnpm test                             # Test all projects
pnpm ci                               # All checks on affected projects only (CI)

npx nx build <service>                # Single project
npx nx test <service>
npx nx lint <service>
npx nx typecheck <service>
```

## Database

```bash
pnpm prisma:generate                  # Regenerate all Prisma clients
pnpm prisma:push                      # Push all schemas to databases
pnpm prisma:format                    # Format all .prisma files
pnpm prisma:studio                    # Open Prisma Studio for all schemas

npx nx run @tec-shop/auth-schema:db-push     # Single schema push
npx nx run @tec-shop/order-schema:studio     # Single schema studio
```

## Seeding

```bash
pnpm seed                             # Seed brands, categories, and products
pnpm seed:admin                       # Create admin user (uses SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
pnpm seed:recommendations             # Seed recommendation training data
```

## Certificate management

```bash
pnpm certs:generate                   # Generate CA + all service certificates
pnpm certs:clean                      # Remove all certificates

./generate-certs.sh --service <name>  # Generate cert for a single service
./generate-certs.sh --clean && ./generate-certs.sh --all  # Full rotation
```
