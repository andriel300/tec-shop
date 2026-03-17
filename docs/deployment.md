# Deployment

Three deployment targets are supported. All use the same multi-stage Dockerfiles in `infrastructure/docker/services/`.

## Workflow B — Docker Compose

Full stack using cloud databases from `.env` (MongoDB Atlas, Neon, Upstash Redis). No local DB containers required.

```bash
pnpm stack:up:build    # first run: build all images then start
pnpm stack:up          # subsequent runs: start without rebuilding
pnpm stack:down        # stop and remove all containers and volumes
pnpm stack:logs        # tail all service logs
```

## Workflow C — Local Kubernetes (kind)

Helm chart and values files are in `infrastructure/helm/tec-shop/`. Values overlays:

| Values file          | Purpose                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `values.yaml`        | Base defaults shared across all environments                           |
| `values.local.yaml`  | kind cluster — `imagePullPolicy: Never`, 1 replica, Bitnami infra      |
| `values.dev.yaml`    | Remote dev cluster — reduced replicas and resources                    |
| `values.demo.yaml`   | Oracle Cloud free tier — 1 replica, HPA off, external managed services |
| `values.prod.yaml`   | Production — autoscaling enabled, security hardening, TLS              |

```bash
# Local kind cluster
pnpm k8s:build      # docker build + kind load docker-image for all services
pnpm k8s:secrets    # create tec-shop-secrets + tec-shop-certs in K8s
pnpm k8s:deploy     # helm upgrade --install with values.local.yaml

# Remote environments (requires correct kubectl context)
pnpm k8s:deploy:dev
pnpm k8s:deploy:demo
pnpm k8s:deploy:prod
```

## Live Demo — Oracle Cloud Always Free (k3s)

The `demo` environment runs all 15 services on a single Oracle Cloud Ampere A1 ARM VM (4 cores / 24 GB RAM) using k3s. External managed free-tier services handle the databases: MongoDB Atlas M0, Upstash Redis, and Upstash Kafka.

### One-time VM provisioning

```bash
# Upload and run the setup script on the Oracle Cloud VM
scp infrastructure/scripts/setup-k3s.sh ubuntu@<VM_IP>:~/
ssh ubuntu@<VM_IP> "chmod +x setup-k3s.sh && ./setup-k3s.sh"
```

The script installs k3s, Helm, nginx ingress controller, and cert-manager. Follow the printed next steps to copy the kubeconfig and configure DNS.

### Configure CI/CD (GitHub Actions)

Set these in `Settings > Secrets and variables > Actions`:

| Name                  | Type     | Value                         |
| --------------------- | -------- | ----------------------------- |
| `NEXT_PUBLIC_API_URL` | Variable | `https://api.your-domain.com` |

> This value is baked into the Next.js client bundle at Docker build time — it cannot be changed at runtime.

### Deploy to Oracle Cloud

```bash
# Edit values.demo.yaml: set real domain and GitHub username
# Edit infrastructure/k8s/cert-manager/cluster-issuer.yaml: set real email and domain
kubectl apply -f infrastructure/k8s/cert-manager/cluster-issuer.yaml
kubectl apply -f infrastructure/k8s/namespaces/tec-shop.yaml
./infrastructure/scripts/create-k8s-secrets.sh demo
pnpm k8s:deploy:demo
```

TLS certificates are provisioned automatically by cert-manager + Let's Encrypt within 1–3 minutes.

### Key design decisions for demo

| Decision                     | Reason                                                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| External managed services    | MongoDB Atlas M0, Upstash Redis, and Upstash Kafka all have free tiers. Running them in-cluster on a 24 GB VM would leave insufficient memory for the 15 application pods. |
| `imagePullPolicy: Always`    | Images are pushed to GHCR by CI. The VM always pulls the latest image on pod restart — no image pre-loading step.                                                          |
| ARM64 multi-arch builds      | Oracle Cloud free tier uses Ampere A1 (ARM64). CI builds `linux/amd64,linux/arm64` images via QEMU so the same tag works everywhere.                                       |
| cert-manager + Let's Encrypt | Free automated TLS renewal. No manual certificate management.                                                                                                              |
| k3s over full k3d/kind       | k3s is designed for single-node production deployments. It includes a built-in ingress controller slot, ServiceLB, and runs with minimal overhead (~512 MB).               |

## Rollback

```bash
./infrastructure/scripts/rollback.sh
# or:
helm rollback tec-shop -n tec-shop
```

## Production Checklist

- [ ] Set strong, unique environment variables (no defaults)
- [ ] Configure production databases with connection pooling
- [ ] Set up Redis with persistence and authentication
- [ ] Configure HTTPS with valid SSL certificates
- [ ] Generate mTLS certificates for all services
- [ ] Set up Kafka with topic replication
- [ ] Configure Stripe webhook endpoint and secret
- [ ] Set up ImageKit project and keys
- [ ] Enable Prometheus metrics scraping (`:metrics` port per service)
- [ ] Configure reverse proxy (nginx-ingress)
- [ ] Enable database backups
- [ ] Set up monitoring and alerting
- [ ] Create GitHub Environments (`staging`, `production`) with required reviewers
- [ ] Add kubeconfig and app-secrets as base64-encoded GitHub Actions secrets
