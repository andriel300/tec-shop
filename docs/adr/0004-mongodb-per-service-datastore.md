# ADR-0004: MongoDB as Per-Service Datastore (Database-per-Service Pattern)

## Status
Accepted

## Context
Each microservice must own its data exclusively — no shared databases — to maintain
true service independence and prevent tight schema coupling. We needed a datastore
suitable for flexible, document-oriented data models across auth, user profiles,
seller accounts, product catalog, analytics, chat, logging, and notifications.

## Decision
We adopted MongoDB (via MongoDB Atlas) as the primary datastore for 8 of the 9
services, with one dedicated database cluster per service. Prisma ORM is used for
all schema definitions and client generation, with separate schema files under
`libs/prisma-schemas/` and separate generated clients under `libs/prisma-clients/`.

Services and their databases:
- `auth-schema`: User credentials, password reset tokens
- `user-schema`: User profiles, shipping addresses
- `seller-schema`: Sellers, shops, Stripe accounts
- `product-schema`: Products, variants, categories, brands
- `analytics-schema`: User behaviour events
- `chatting-schema`: Conversations and messages
- `logger-schema`: System event logs
- `notification-schema`: Notifications and preferences

The order-service uses PostgreSQL (see ADR-0005).

## Alternatives Considered
- **Shared PostgreSQL database** — simpler initially, but would create tight schema
  coupling between services and prevent independent migrations.
- **PostgreSQL per service** — ACID guarantees are valuable, but most of our domains
  (profiles, products, chat messages) are document-oriented and benefit from flexible
  schemas during early development.

## Consequences
- **Positive:** Independent schema evolution per service; no cross-service joins at
  the database level; Prisma provides type-safe queries without raw MongoDB driver.
- **Negative:** No cross-service transactions; denormalisation required for
  cross-service data; Prisma MongoDB support is less mature than PostgreSQL support.

## Trade-offs
Schema flexibility and service isolation were prioritised over cross-service
transactional consistency (handled instead via eventual consistency through Kafka events).
