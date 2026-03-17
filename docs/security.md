# Security

## Authentication Flow

1. User registers with email/password
2. 6-digit OTP sent via email for verification (3-attempt limit, Redis-backed)
3. Verified user receives JWT access token and refresh token in httpOnly cookies
4. Access token: 1 hour (standard) or 24 hours (remember me)
5. Refresh token: 7 days (standard) or 30 days (remember me)
6. Silent token refresh on expiry with rotation
7. Logout revokes the refresh token in the database

## Cookie Naming

| Environment | Pattern                                  | Example                       |
| ----------- | ---------------------------------------- | ----------------------------- |
| Development | `{userType}_{access\|refresh}_token`     | `customer_access_token`       |
| Production  | `__Host-{userType}_{access\|refresh}_token` | `__Host-customer_access_token` |

`userType` is one of `customer`, `seller`, or `admin`. All cookies are `httpOnly: true`.

## Rate Limiting Tiers

| Tier   | Endpoints               | Dev Limit     | Prod Limit   |
| ------ | ----------------------- | ------------- | ------------ |
| Short  | General                 | 1000 req/min  | 100 req/min  |
| Medium | Auth operations         | 100 req/15min | 20 req/15min |
| Long   | Search / high-frequency | 2000 req/min  | 200 req/min  |

Setting `LOAD_TEST=true` in `.env` bypasses all throttling for load testing. Starting with `LOAD_TEST=true` and `NODE_ENV=production` simultaneously throws at bootstrap.

## Data Protection

- Passwords hashed with bcrypt (10 rounds)
- Refresh tokens hashed with SHA-256 before storage
- Sensitive data encrypted in transit (HTTPS/TLS)
- Input validation on all endpoints via class-validator DTOs
- `DOMPurify.sanitize()` wraps all `dangerouslySetInnerHTML` (product descriptions)
- File uploads validate MIME type via `fileFilter` in `FileInterceptor`
- HMAC inter-service signatures use `timingSafeEqual` for constant-time comparison

## Inter-Service Authentication

All sensitive cross-service calls (e.g. profile creation on registration) include an HMAC signature derived from `SERVICE_MASTER_SECRET`. The receiving service verifies the signature using `timingSafeEqual` before processing the request. See `@tec-shop/service-auth` (`ServiceAuthUtil`).

## mTLS

Services communicate over TCP with mutual TLS. Certificates live in `certs/<service-name>/` (gitignored). Generate them with:

```bash
pnpm certs:generate
```

## WebSocket Authentication

WebSocket clients cannot send httpOnly cookies in the Socket.IO handshake directly. The flow is:

1. Client calls `GET /api/chat/ws-token` (authenticated via JWT cookie)
2. API Gateway issues a short-lived 5-minute WebSocket token
3. Client connects to the WS service with the token as a query param
4. WS service verifies the token via `WsJwtModule` from `@tec-shop/ws-auth`
