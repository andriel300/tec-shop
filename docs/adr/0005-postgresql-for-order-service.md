# ADR-0005: PostgreSQL (Neon) for Order Service

## Status
Accepted

## Context
The order-service manages financial data: orders, line items, seller payouts, and
Stripe payment sessions. This domain requires ACID-compliant transactions, precise
decimal arithmetic for monetary amounts, and reliable reporting queries. These
requirements differ fundamentally from the document-oriented domains handled by the
MongoDB services.

## Decision
The order-service uses PostgreSQL hosted on Neon (serverless PostgreSQL) with the
Prisma Neon adapter. All monetary values are stored in cents (integer) to avoid
floating-point precision errors. The schema includes:

- `Order` — master order record with status machine (PENDING -> PAID -> SHIPPED ->
  DELIVERED / CANCELLED)
- `OrderItem` — line items with per-item price snapshot and platform fee calculation
- `SellerPayout` — per-seller settlement records (outbox pattern for Stripe transfers)
- `PaymentSession` — Stripe checkout session tracking

## Alternatives Considered
- **MongoDB for orders** — flexible schema, but lacks multi-document ACID transactions
  needed for atomic order + payout creation and financial reporting.
- **PlanetScale (MySQL)** — considered, but Neon provides serverless PostgreSQL which
  is more compatible with Prisma and the existing tech stack.

## Consequences
- **Positive:** ACID transactions ensure payment and payout records are always
  consistent; strong typing for enums (OrderStatus, PaymentStatus); reliable
  aggregation queries for financial reporting.
- **Negative:** The order-service uses a different database technology from all other
  services, requiring a different mental model and connection configuration.

## Trade-offs
Financial data integrity was prioritised over technology uniformity across services.
The increased operational complexity of managing two database technologies is
justified by the correctness guarantees PostgreSQL provides for monetary transactions.
