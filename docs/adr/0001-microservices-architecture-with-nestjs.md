# ADR-0001: Microservices Architecture with NestJS

## Status
Accepted

## Context
TecShop is a multi-vendor e-commerce platform requiring independent deployability of
distinct business domains: authentication, user management, seller management, product
catalog, order processing, real-time chat, event logging, analytics, notifications,
and recommendations. A monolithic architecture would couple all these domains, making
independent scaling and team ownership impractical.

## Decision
We adopted a microservices architecture using NestJS as the framework for all backend
services. Each service owns a single bounded context:

| Service              | Domain                                          |
|----------------------|-------------------------------------------------|
| api-gateway          | Request routing, auth enforcement, rate limiting |
| auth-service         | Authentication, JWT issuance, password reset     |
| user-service         | User profiles, addresses                         |
| seller-service       | Seller accounts, shops, Stripe accounts          |
| product-service      | Products, variants, categories, brands           |
| order-service        | Orders, payments, seller payouts                 |
| admin-service        | Admin operations                                 |
| chatting-service     | Real-time buyer-seller chat (WebSocket)          |
| logger-service       | Structured event logging                         |
| notification-service | Push and in-app notifications (WebSocket)        |
| recommendation-service | Personalised product recommendations           |
| kafka-service        | Kafka event consumer and analytics processor     |

## Alternatives Considered
- **Monolith** — faster initial development, but would prevent independent scaling
  of high-traffic domains (product search, chat) and tightly couple unrelated teams.
- **Modular monolith** — considered as a stepping stone, but the team opted to start
  with full service separation given clear bounded context boundaries from day one.

## Consequences
- **Positive:** Independent scaling per domain; isolated failure blast radius; clear
  team ownership; independent deployment cadence.
- **Negative:** Distributed system complexity (network latency, partial failure,
  distributed tracing required); cross-service data consistency managed via events
  rather than ACID transactions.

## Trade-offs
Operational complexity was accepted in exchange for long-term scalability and
clear domain isolation.
