# Security

## Authentication Flow

### Customer / Seller

1. User registers with email/password
2. 6-digit OTP sent via email for verification (10-minute expiry, 3-attempt limit, Redis-backed)
3. Verified user receives a JWT access token and refresh token in httpOnly cookies
4. Access token: **15 minutes**
5. Refresh token: **7 days** (standard) or **30 days** (remember me)
6. Silent token refresh on expiry with family-based rotation (detects token theft)
7. Logout revokes the refresh token in the database

### Admin (Two-Factor)

Admin accounts use a mandatory two-step login flow when TOTP is enabled:

1. Submit credentials → server returns `{ requiresTotp: true, tempToken }` (5-minute partial-auth JWT)
2. Submit 6-digit TOTP code + `tempToken` to `/auth/admin/totp/verify`
3. Server validates the code, invalidates the partial-auth token, issues full httpOnly cookies
4. Admins without TOTP enabled proceed with the standard single-step flow

## TOTP Two-Factor Authentication (Admin)

- Enforced per admin account via the `/dashboard/settings` page in admin-ui
- **Algorithm**: RFC 6238 TOTP — HMAC-SHA1, 30-second time step, ±1 window (30s grace for clock drift)
- **Secret storage**: AES-256-GCM encrypted at rest (`TOTP_ENCRYPTION_KEY`; 96-bit IV + auth tag stored alongside ciphertext)
- **Backup codes**: 10 single-use codes in `XXXXX-XXXXX` format, argon2id-hashed in the database; consumed one at a time
- **Rate limit**: 5 req/min on the TOTP verify endpoint
- **Key generation**: `openssl rand -hex 32`

## Honeypot

The API Gateway actively detects and bans automated scanners via a honeypot layer.

### Lure paths

Any request to a known attack-probe path (e.g. `/.env`, `/wp-admin`, `/phpmyadmin`, `/.git/config`, `/actuator/env`, `/console`) triggers the honeypot. A full list lives in `apps/api-gateway/src/app/honeypot/honeypot.config.ts`.

### Response strategy

The middleware returns a **fake 200** (never 401/403) so the scanner cannot tell it was detected.

### Consequences

1. Source IP is added to a Redis blocklist with a configurable TTL (`HONEYPOT_BAN_TTL_SECONDS`, default: 3600 s)
2. A `SECURITY`-level Kafka log event is emitted to the `log-events` topic (visible in Grafana)
3. `BlocklistGuard` (first `APP_GUARD`) drops all subsequent requests from the banned IP with `403 Forbidden` before any rate-limit counter is incremented

## Cookie Naming

| Environment | Pattern                                     | Example                         |
| ----------- | ------------------------------------------- | ------------------------------- |
| Development | `{userType}_{access\|refresh}_token`        | `customer_access_token`         |
| Production  | `__Host-{userType}_{access\|refresh}_token` | `__Host-customer_access_token`  |

`userType` is one of `customer`, `seller`, or `admin`. All cookies are `httpOnly: true`.

## Rate Limiting

Three tiers via `ConditionalThrottlerGuard` backed by Redis (`@nest-lab/throttler-storage-redis`):

| Tier   | Endpoints               | Dev limit      | Prod limit    |
| ------ | ----------------------- | -------------- | ------------- |
| short  | General                 | 1000 req/min   | 100 req/min   |
| medium | Auth / sensitive ops    | 100 req/15 min | 20 req/15 min |
| long   | Search / high-frequency | 2000 req/min   | 200 req/min   |

`LOAD_TEST=true` bypasses all throttling. Combining it with `NODE_ENV=production` throws at bootstrap.

## Data Protection

| Concern | Implementation |
| --- | --- |
| Passwords | **argon2id** (migrated from bcrypt; legacy bcrypt hashes are verified and re-hashed on next login) |
| TOTP backup codes | argon2id (single-use, consumed by splice) |
| Refresh tokens | SHA-256 hashed before storage; family ID tracked to detect reuse attacks |
| TOTP secrets | AES-256-GCM encrypted (`TOTP_ENCRYPTION_KEY`) |
| Password reset tokens | 32-byte cryptographically random hex token, single-use, deleted on consumption |
| Transport | HTTPS / mTLS between services |
| Input validation | `class-validator` DTOs on all endpoints with `whitelist: true` and `forbidNonWhitelisted: true` |
| XSS — rich text | `DOMPurify.sanitize()` (via `isomorphic-dompurify`) wraps all `dangerouslySetInnerHTML` |
| XSS — image URLs | Image URLs sanitized to prevent script injection via `src` attributes |
| File uploads | MIME type validated via `fileFilter` in `FileInterceptor`; type confusion attack prevention |
| Inter-service signatures | HMAC-SHA256 via `ServiceAuthUtil`; compared with `timingSafeEqual` (constant-time) |

## HTTP Security Headers

Configured via `helmet` in `main.ts`:

| Header | Setting |
| --- | --- |
| Content-Security-Policy | `defaultSrc 'self'`; strict per-directive policy |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains; preload` |
| X-Frame-Options | `DENY` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `no-referrer` |
| Cross-Origin-Opener-Policy | `same-origin` |
| Cross-Origin-Embedder-Policy | `require-corp` |
| X-Powered-By | Removed |

## Inter-Service Authentication

All sensitive cross-service calls (e.g. profile creation on registration) include an HMAC signature derived from `SERVICE_MASTER_SECRET`. The receiving service verifies the signature using `timingSafeEqual` before processing. Implementation: `@tec-shop/service-auth` (`ServiceAuthUtil`).

## mTLS

All service-to-service TCP communication uses mutual TLS. Certificates live in `certs/<service-name>/` (gitignored).

```bash
pnpm certs:generate
```

## WebSocket Authentication

WebSocket clients cannot forward httpOnly cookies in the Socket.IO handshake. The flow is:

1. Client calls `GET /api/chat/ws-token` (authenticated via JWT cookie)
2. API Gateway issues a short-lived 5-minute WebSocket token
3. Client connects to the WS service with the token as a query param
4. WS service verifies the token via `WsJwtModule` from `@tec-shop/ws-auth`

## User Banning

Admins can ban accounts with an optional reason and expiry. The ban is enforced at login: banned users receive a `403` before any token is issued. Permanent bans and time-limited bans (`bannedUntil`) are both supported.

## Container Security (Production)

All production containers (`docker-compose.prod.yml`) are hardened:

```yaml
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
```

## Google OAuth

Customer accounts support Google OAuth 2.0 sign-in via `passport-google-oauth20`. The strategy is registered in `AuthModule` and handled by `GoogleStrategy`. On first sign-in, a new customer account is automatically provisioned.

## Password Reset

1. User requests a reset — server always returns the same message regardless of whether the email exists (prevents email enumeration)
2. A 32-byte cryptographically random token is stored in the database (hex-encoded, single-use)
3. The token is emailed as a link; it expires after a configurable TTL
4. On use, the token is deleted and the password is rehashed with argon2id
5. All active refresh tokens for the user are invalidated on successful reset
