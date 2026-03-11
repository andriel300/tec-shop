# ADR-0017: Kubernetes for Container Orchestration

## Status
Accepted

## Context
Running 12+ containerised microservices in production requires automated scheduling,
health-based restarts, rolling deployments, and resource management. Manual
container management with Docker Compose would require custom scripting for every
concern that Kubernetes handles natively.

## Decision
We adopted Kubernetes as the production container orchestrator. All services are
deployed in a dedicated `tec-shop` namespace with the following patterns:

- **Deployments**: 2 replicas for most services; higher resources allocated to the
  recommendation-service (CPU 200m-750m, memory 256Mi-512Mi)
- **Health probes**: `readinessProbe` (httpGet `/health` or `/metrics`, 15s initial
  delay, 10s period) and `livenessProbe` (30s initial delay, 15s period) on every
  deployment — ensures no traffic is routed to unready pods and crashed pods are
  automatically restarted
- **Configuration**: `envFrom configMapRef` for non-sensitive config and `secretRef`
  for credentials — no hard-coded values in manifests
- **Services**: `ClusterIP` for all TCP microservices (internal only);
  `LoadBalancer` for the api-gateway (public entry point)
- **Ingress**: Nginx Ingress Controller routing external traffic to the api-gateway
  and frontends (see ADR-0020)

Static manifests live in `infrastructure/k8s/`; templated Helm charts in
`infrastructure/helm/tec-shop/` (see ADR-0018).

## Alternatives Considered
- **Docker Compose (production)** — familiar but lacks automatic rescheduling,
  rolling updates, and horizontal scaling. Insufficient for a multi-service
  platform that must stay available during deployments.
- **AWS ECS / Fargate** — managed container orchestration without managing the
  control plane. Rejected to avoid cloud vendor lock-in; Kubernetes runs on any
  cloud or on-premises.
- **Nomad** — simpler than Kubernetes. Rejected because the broader ecosystem
  (Helm charts, operators, Prometheus ServiceMonitors) is Kubernetes-native and
  would require significant adaptation.

## Consequences
- **Positive:** Automatic pod rescheduling on node failure; rolling deployments
  with zero downtime; declarative desired-state configuration; rich ecosystem
  (Helm, cert-manager, Prometheus Operator).
- **Negative:** High operational complexity; steep learning curve; requires a
  managed control plane (e.g., GKE, EKS, AKS) or self-hosted setup.

## Trade-offs
Significant operational complexity was accepted for the production-grade reliability
and ecosystem maturity that Kubernetes provides at microservices scale.
