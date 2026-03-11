# ADR-0009: Redis for Caching, Sessions, and Token Blacklisting

## Status
Accepted

## Context
Multiple services required a fast, shared, in-memory store for:
1. **OTP storage**: Email verification codes with 3-attempt limits and expiry
2. **Token blacklisting**: Revoked JWTs must be rejected before natural expiry
3. **Rate limiting state**: ThrottlerModule needs shared state across API Gateway
   instances to enforce per-user request limits
4. **General caching**: Frequently read data (e.g., product listings) to reduce
   database load

## Decision
We adopted Redis (ioredis v5) as the shared in-memory store, centralised in the
`@tec-shop/redis-client` shared library (`libs/shared/redis-client`). The library
exports `RedisModule.forRoot()` and `RedisService`, which are imported by services
that need Redis access.

Usages:
- **auth-service**: OTP storage (TTL-based expiry), token blacklisting
- **api-gateway**: ThrottlerModule storage (rate limiting state), response caching
- **order-service**: Payment session caching
- **notification-service**: Notification preference caching

The `RedisModule.forRoot()` pattern ensures a single shared Redis connection per
service instance, not a new connection per module import.

## Alternatives Considered
- **In-memory Maps per service** — no shared state across instances; OTPs and
  blacklisted tokens would not be visible to horizontally scaled instances.
- **Database-backed rate limiting** — too slow for high-frequency checks; Redis
  sub-millisecond latency is essential for request-path operations.
- **Memcached** — simpler key-value store, but lacks Redis data structures (sorted
  sets for rate limiting, TTL-aware keys for OTP expiry) and pub/sub capabilities.

## Consequences
- **Positive:** Sub-millisecond latency for all in-memory operations; shared state
  across service instances; TTL-based expiry is native to Redis.
- **Negative:** Redis is a required infrastructure dependency; Redis downtime
  affects rate limiting, OTP flow, and logout (blacklist lookups fail open or
  closed depending on error handling).

## Trade-offs
An additional infrastructure dependency was accepted for the performance and
correctness guarantees that shared in-memory state provides for rate limiting
and token revocation.
