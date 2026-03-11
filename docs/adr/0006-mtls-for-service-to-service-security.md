# ADR-0006: mTLS for Service-to-Service Security

## Status
Accepted

## Context
All inter-service TCP communication is internal to the cluster, but we needed
assurance that only legitimate services could connect to each other. Without
transport-level security, a compromised container on the same network could send
arbitrary TCP messages to any service and impersonate the API Gateway.

## Decision
We implemented mutual TLS (mTLS) on all TCP connections between the API Gateway and
each microservice. Each service has a dedicated certificate/key pair signed by a
shared internal CA. The `generate-certs.sh` script creates these certificates:

```
./generate-certs.sh --all          # generate for all services
./generate-certs.sh --service auth # generate for a single service
./generate-certs.sh --clean        # remove all certificates
```

Certificate files are stored in `certs/` and loaded at service startup via
environment-resolved file paths. Connections with `rejectUnauthorized: true` reject
any client not presenting a valid CA-signed certificate.

## Alternatives Considered
- **No transport security** — acceptable for a fully private network but leaves the
  system vulnerable if any part of the network is compromised.
- **Service mesh (Istio/Linkerd)** — provides mTLS transparently via sidecars.
  Rejected as over-engineered for the current scale; a service mesh adds significant
  operational overhead. Can be adopted when moving to Kubernetes at scale.
- **Network-level isolation only** — relying solely on firewall rules and VPC
  segmentation. Considered insufficient as defence-in-depth; mTLS adds a layer
  regardless of network configuration.

## Consequences
- **Positive:** Mutual authentication ensures both sides of every TCP connection are
  verified; encrypted transport prevents network eavesdropping.
- **Negative:** Certificate rotation must be managed manually; `generate-certs.sh`
  must be re-run when certificates expire or services are added.

## Trade-offs
Manual certificate management was accepted as an operational burden in exchange for
strong transport-layer authentication without a full service mesh.
