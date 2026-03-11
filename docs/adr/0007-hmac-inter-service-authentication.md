# ADR-0007: HMAC-Based Inter-Service Authentication

## Status
Accepted

## Context
mTLS (ADR-0006) authenticates the transport layer but does not authenticate the
application-level identity of the calling service. For sensitive cross-service
operations — such as auth-service creating a seller profile in seller-service or
a user profile in user-service — we needed a way to verify that the request
originated from a trusted internal service and has not been tampered with or replayed.

## Decision
We implemented HMAC-SHA256 request signing via the `@tec-shop/service-auth` shared
library (`libs/shared/service-auth`). The pattern works as follows:

1. **Secret derivation**: Each service derives a signing key from `SERVICE_MASTER_SECRET`
   using `HMAC-SHA256(masterSecret, "service:{serviceId}")`.
2. **Signing**: The calling service signs `{payload + timestamp + serviceId}` and
   attaches the signature, timestamp, and serviceId to the message.
3. **Verification**: The receiving service re-derives the key, verifies the signature,
   validates the serviceId, and rejects messages with timestamps older than 5 minutes
   (replay attack prevention).

The centralised `ServiceAuthUtil` class is the single source of truth for this logic.
Previously duplicated in auth-service and seller-service; now lives in the shared lib.

## Alternatives Considered
- **Shared API keys** — simpler but do not prevent replay attacks and require
  per-service key rotation.
- **OAuth2 client credentials** — industry standard but requires an OAuth server,
  adding significant infrastructure complexity.
- **No application-level auth (mTLS only)** — mTLS alone does not verify *which*
  service is calling at the application layer, only that the certificate is valid.

## Consequences
- **Positive:** Cryptographically verified service identity; replay attack prevention
  via timestamp TTL; single shared library removes duplication.
- **Negative:** `SERVICE_MASTER_SECRET` is a single point of compromise — if leaked,
  all inter-service trust is broken; requires secret rotation procedures.

## Trade-offs
Simplicity of a shared-secret approach was chosen over full OAuth2 infrastructure.
The 5-minute replay window is a pragmatic balance between security and clock-skew
tolerance across services.
