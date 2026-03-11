# ADR-0020: Nginx Ingress Controller as Kubernetes Edge Router

## Status
Accepted

## Context
The platform exposes four public hostnames: `api.tec-shop.com` (API),
`tec-shop.com` (user storefront), `seller.tec-shop.com` (seller dashboard),
and `admin.tec-shop.com` (admin panel). In Kubernetes, an Ingress resource
defines these routing rules, but a controller must implement them. We also
needed TLS termination, path-based routing, and rate limiting at the cluster
edge — before traffic reaches any application.

An important architectural note: there is no standalone Nginx configuration file
in this codebase. Nginx is used exclusively as the Kubernetes Ingress Controller
(`ingressClassName: nginx`). Application-level middleware (CORS, Helmet security
headers, request parsing) is handled by the NestJS API Gateway, not by Nginx.

## Decision
We adopted the Nginx Ingress Controller as the Kubernetes edge router. The
Ingress resource (`infrastructure/k8s/ingress/tec-shop-ingress.yaml`) and the
equivalent Helm template define:

| Host | Backend Service | Port |
|------|----------------|------|
| `api.tec-shop.com` | api-gateway | 80 |
| `tec-shop.com` | user-ui | 3000 |
| `seller.tec-shop.com` | seller-ui | 3000 |
| `admin.tec-shop.com` | admin-ui | 3000 |

TLS configuration and cert-manager integration are defined but currently commented
as TODO — to be enabled when deploying to a production cluster with a valid domain.

Rate limiting annotations on the Ingress are prepared but commented; coarse
cluster-edge rate limiting can be activated without application changes.

## Alternatives Considered
- **Traefik** — popular alternative with automatic Let&apos;s Encrypt integration
  and a built-in dashboard. Nginx Ingress was preferred because of its wider
  adoption, more extensive documentation, and direct compatibility with annotations
  used in the existing Helm templates.
- **AWS ALB Ingress Controller** — tight AWS integration with native WAF support.
  Rejected to avoid cloud vendor lock-in; the platform must be deployable to any
  Kubernetes cluster.
- **Standalone Nginx (non-Kubernetes)** — a traditional reverse proxy outside the
  cluster. Rejected because running Kubernetes already provides an Ingress abstraction;
  a separate Nginx instance would duplicate concerns and add operational overhead.
- **Istio Gateway** — provides Ingress plus service mesh capabilities. Considered
  over-engineered for current scale; remains an upgrade path when full service mesh
  features are needed.

## Consequences
- **Positive:** Single Ingress resource manages all external routing declaratively;
  annotation-based configuration (rate limiting, TLS, redirects) without modifying
  application code; cert-manager can automate TLS certificate renewal.
- **Negative:** Nginx Ingress Controller must be installed separately in the cluster
  (not bundled with Kubernetes); controller upgrades require separate management.

## Trade-offs
Nginx Ingress was chosen over more feature-rich alternatives (Traefik, Istio Gateway)
for its simplicity, maturity, and portability across cloud providers. Advanced
service mesh features remain an upgrade path, not a current requirement.
