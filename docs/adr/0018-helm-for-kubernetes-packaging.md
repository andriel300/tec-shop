# ADR-0018: Helm for Kubernetes Package Management

## Status
Accepted

## Context
With 13 services each requiring a Deployment, Service, ConfigMap, and potentially
an Ingress, managing raw Kubernetes YAML produces 50+ manifest files with significant
repetition. Environment promotion (dev → staging → production) requires changing
image tags, replica counts, resource limits, and hostnames across all of those files
simultaneously. Manual YAML editing at this scale is error-prone.

## Decision
We adopted Helm (chart version 0.1.0) to template all Kubernetes manifests for the
`tec-shop` platform. The chart lives at `infrastructure/helm/tec-shop/` with
environment-specific value overrides:

- `values.yaml` — base defaults (shared across environments)
- `values.dev.yaml` — development overrides (single replica, relaxed resources)
- `values.prod.yaml` — production overrides (replica counts, resource limits,
  external hostnames, TLS)

Key templated parameters per service:
- `image.repository`, `image.tag` — changed per deployment without touching templates
- `replicaCount` — scaled per environment
- `resources.requests/limits` — right-sized per service profile
- `ingress.hosts`, `ingress.tls` — environment-specific hostnames and TLS config

Deployment and rollback use `infrastructure/scripts/deploy.sh` and `rollback.sh`.

## Alternatives Considered
- **Raw YAML manifests only** — present in `infrastructure/k8s/` as static reference
  manifests, but duplicating values across 13 services for environment promotion
  is not maintainable.
- **Kustomize** — patch-based overlays without a templating engine. Better for
  minor per-environment patches but less readable than Helm values files when the
  changes are extensive (image tags, replica counts, resource profiles).
- **Pulumi / Terraform (Kubernetes provider)** — infrastructure-as-code with full
  programming language support. Considered for future migration when multi-cloud
  provisioning is needed, but adds runtime dependency on a separate IaC tool for
  what is currently a Kubernetes-only deployment.

## Consequences
- **Positive:** Single template set for all environments; image tag promotion is
  one `--set image.tag=<sha>` flag; Helm release history enables one-command rollback.
- **Negative:** Helm templating syntax (Go templates + Sprig) adds a layer of
  indirection; chart version must be bumped alongside application changes.

## Trade-offs
The Go template learning curve was accepted for the significant reduction in
manifest duplication and the operational convenience of Helm release management
across multiple environments.
