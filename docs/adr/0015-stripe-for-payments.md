# ADR-0015: Stripe for Payment Processing and Seller Payouts

## Status
Accepted

## Context
TecShop is a multi-vendor marketplace requiring payment collection from buyers and
disbursement to multiple sellers per order. We needed a payment provider that
supports split payments natively, handles PCI compliance at the provider level,
and integrates with our NestJS backend without requiring us to store raw card data.

## Decision
We adopted Stripe as the exclusive payment and payout provider. The integration
spans two services:

**seller-service** — Stripe Connect onboarding:
- Each seller creates a Stripe Connect account (StripeAccount model)
- Bank accounts (StripeBankAccount) and cards (StripeCard) are stored as Stripe
  references, never raw data
- Sellers complete Stripe's identity verification flow before receiving payouts

**order-service** — Checkout and payout:
- Buyer payment via Stripe Checkout Sessions (`PaymentSession` model)
- Platform fee: 10% of each item subtotal; deducted before seller payout
- All monetary values stored in cents (integers) to avoid floating-point errors
- `SellerPayout` records use an outbox pattern — created on order payment, processed
  via scheduled jobs that trigger Stripe transfers to seller accounts
- Stripe webhook handling requires raw request body (configured via `rawBody: true`
  in the API Gateway)

## Alternatives Considered
- **PayPal** — widely recognised but more complex API for marketplace split
  payments; Stripe Connect has better developer documentation and SDK support.
- **Custom payment gateway integration** — would require PCI DSS compliance
  scope for storing card data. Rejected as a core risk for a marketplace platform.
- **Braintree** — PayPal subsidiary with similar features; Stripe ecosystem
  (Stripe Radar for fraud, Stripe Tax) provides more long-term extensibility.

## Consequences
- **Positive:** PCI DSS compliance scope is minimal (no raw card data stored);
  Stripe Connect handles seller identity verification and payout regulatory
  compliance; webhook-driven state machine is reliable.
- **Negative:** Stripe fees reduce marketplace margins; vendor lock-in for
  payment processing; Stripe Connect onboarding adds friction for new sellers.

## Trade-offs
Vendor dependency and per-transaction fees were accepted to eliminate PCI compliance
management and leverage Stripe's battle-tested marketplace payment infrastructure.
