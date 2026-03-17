# Getting Started

## Prerequisites

| Requirement             | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| Node.js 22+             | Running services and Nx CLI               |
| pnpm 10+                | Package management                        |
| Docker + Docker Compose | Infrastructure and full stack             |
| kubectl                 | Kubernetes CLI (Workflow C)               |
| kind                    | Local Kubernetes cluster (Workflow C)     |
| helm                    | Kubernetes package manager (Workflow C)   |
| SMTP server             | Email OTPs — Mailtrap works for local dev |

## Initial Setup (required for all workflows)

1. Clone and install

```bash
git clone <repository-url>
cd tec-shop
pnpm install
```

2. Configure environment variables

```bash
cp .env.example .env
# Required: JWT_SECRET, SERVICE_MASTER_SECRET, OTP_SALT
# Optional: SMTP credentials, Google OAuth, Stripe, ImageKit
```

3. Generate Prisma clients

```bash
pnpm prisma:generate
```

4. Generate mTLS certificates (required by all backend services)

```bash
pnpm certs:generate
# or: ./generate-certs.sh --all
```

---

## Workflow A — Host-based Development (recommended)

Services run directly on your machine with hot reload. Docker only provides Redis, Kafka, and Zookeeper.

Requires: MongoDB (Atlas `mongodb+srv://` or a local instance) and PostgreSQL (Neon or local) configured in `.env`.

```bash
# Start infrastructure (Redis + Kafka + Zookeeper)
pnpm infra:up

# Push Prisma schemas to your databases (first time only)
pnpm prisma:push

# Start all services with hot reload
pnpm dev
```

Individual services:

```bash
PORT=3000 npx nx dev user-ui       # User storefront
PORT=3001 npx nx dev seller-ui     # Seller dashboard
PORT=3002 npx nx dev admin-ui      # Admin panel
npx nx serve api-gateway           # API Gateway
npx nx serve auth-service          # Any backend service
```

---

## Workflow B — Full Docker Stack (container validation)

Builds all services into containers and runs them with Docker Compose. Uses cloud databases (MongoDB Atlas, Neon, Upstash Redis) from `.env` — no local DB containers.

```bash
# First run: build all images and start (takes several minutes)
pnpm stack:up:build

# Subsequent runs: start without rebuilding
pnpm stack:up

# Logs and teardown
pnpm stack:logs
pnpm stack:down
```

> **Note on `NEXT_PUBLIC_*` variables:** Next.js bakes these into the client bundle at build time during `docker build`. Ensure `.env` contains `NEXT_PUBLIC_API_URL=http://localhost:8080` before running `pnpm stack:up:build`.

The startup script handles sequencing automatically: infrastructure → Prisma migration → all services.

---

## Workflow C — Local Kubernetes with kind (pre-production validation)

Runs all backend services inside a single-node [kind](https://kind.sigs.k8s.io/) cluster on your machine with MongoDB, Redis, and Kafka deployed as Bitnami Helm subcharts. Validates Helm chart configuration, readiness probes, mTLS cert mounts, Kubernetes service discovery, and HPA definitions before any cloud spend.

### One-time cluster setup

```bash
# Create the kind cluster
kind create cluster --name tec-shop

# Fetch Bitnami chart dependencies (mongodb, redis, kafka)
helm dependency update infrastructure/helm/tec-shop
```

### Deploy

```bash
# 1. Build all 11 service images and load into kind
pnpm k8s:build

# 2. Create K8s secrets from your .env and certs/ directory
pnpm k8s:secrets

# 3. Install the Helm release (infra + all services)
pnpm k8s:deploy

# 4. Monitor pod startup
pnpm k8s:status
```

### Access the API gateway

```bash
kubectl port-forward svc/api-gateway 8080:8080 -n tec-shop
# API:  http://localhost:8080
# Docs: http://localhost:8080/api-docs
```

### Teardown

```bash
pnpm k8s:teardown                # uninstall Helm release
kind delete cluster --name tec-shop
```

### Key design decisions

| Decision                  | Reason                                                                                                                                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bitnami in-cluster infra  | kind nodes run in a separate Docker network. Pods cannot reach `localhost`, and `host.docker.internal` is not auto-available on Linux. Running MongoDB, Redis, and Kafka as Helm subcharts inside the cluster eliminates host-networking complexity entirely.                         |
| `imagePullPolicy: Never`  | Images are loaded directly from the local Docker daemon into kind via `kind load docker-image`. Without this, Kubernetes tries to pull from the internet and fails with `ErrImagePull`.                                                                                               |
| `KAFKA_SSL=false`         | The code auto-disables SSL for brokers starting with `kafka:` or `localhost:`. The Bitnami subchart names its service `tec-shop-kafka:9092`, which does not match either prefix. Setting `KAFKA_SSL=false` explicitly disables SSL so all services connect to the PLAINTEXT listener. |
| mTLS certs as K8s Secrets | Cert files from `./certs/` are packed into a single `tec-shop-certs` Secret. The Helm template mounts each service's key and cert via `subPath` into `/app/certs/<service>/`, replicating the same path structure services expect at runtime.                                        |

---

## Service URLs

| Service           | URL                              |
| ----------------- | -------------------------------- |
| User UI           | http://localhost:3000            |
| Seller UI         | http://localhost:3001            |
| Admin UI          | http://localhost:3002            |
| API Gateway       | http://localhost:8080            |
| API Documentation | http://localhost:8080/api-docs   |
