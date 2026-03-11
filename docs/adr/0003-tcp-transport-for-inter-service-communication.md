# ADR-0003: TCP Transport for Inter-Service Communication

## Status
Accepted

## Context
All backend services must communicate with each other and with the API Gateway.
We needed a transport protocol that was simple to configure in NestJS, performant
for internal traffic, and compatible with our monorepo development workflow where
all services run on localhost.

## Decision
We used NestJS built-in TCP microservice transport for all synchronous inter-service
calls. The API Gateway acts as the sole entry point and connects to each downstream
service via `ClientProxy` (TCP). Services are registered at fixed ports:

- auth: 6001, user: 6002, seller: 6003, product: 6004
- order: 6005, admin: 6006, logger: 6011, recommendation: 6009

Message patterns (strings like `'get-user-profile'`, `'seller-verify-shop'`) identify
operations. mTLS certificates (see ADR-0006) secure all TCP connections in production.

## Alternatives Considered
- **gRPC** — strongly typed contracts and bi-directional streaming. Rejected because
  it requires Protobuf schema management and more complex tooling; the NestJS TCP
  transport was sufficient for request/response patterns.
- **HTTP REST between services** — familiar but adds HTTP overhead for internal calls
  and requires service discovery. The NestJS TCP client is lighter and integrated.
- **Message broker for all communication (Kafka)** — asynchronous by default.
  Kafka is used for fire-and-forget events (see ADR-0011), but synchronous
  request/response operations (e.g., validate shop ownership during product creation)
  require immediate responses, making TCP more appropriate.

## Consequences
- **Positive:** Simple NestJS-native setup; low overhead; direct request/response
  semantics; no service discovery needed (fixed ports in `.env`).
- **Negative:** Tight coupling to fixed ports; no built-in load balancing (single
  instance per service); TCP failures are hard failures with no retry out of the box.

## Trade-offs
Simplicity and fast development velocity were prioritised over advanced features like
load balancing and schema-enforced contracts.
