export const SWAGGER_DESCRIPTION = `
# TecShop — Multi-Vendor E-Commerce Platform API

TecShop is a production-grade multi-vendor e-commerce platform built on a microservices architecture.
This API gateway is the **single entry point** for all client traffic — browsers, mobile apps, and
third-party integrations. Every request is validated, authenticated, and routed to the appropriate
downstream service over TCP with mutual TLS.

---

## Microservices Architecture

All business logic lives in isolated NestJS TCP microservices. The gateway holds no domain logic —
it validates requests, enforces auth/throttle guards, and proxies calls via \`ClientProxy\`.

| Service | Responsibility |
|---|---|
| **Auth Service** | Registration, login, JWT issuance, refresh token rotation, OTP verification, Google OAuth 2.0, password reset |
| **User Service** | Customer profile, avatar upload, shipping address management, follower graph |
| **Seller Service** | Seller accounts, shop creation & branding, Stripe Connect onboarding, statistics, notification preferences |
| **Product Service** | Product catalog, variants (SKU/price/stock), images, category & brand taxonomy, ratings & reviews |
| **Order Service** | Cart validation, Stripe Checkout Sessions, webhook-driven order state machine, per-seller payouts |
| **Admin Service** | Platform administration — user/seller management, ban/unban, layout & hero slide control |
| **Chatting Service** | Buyer-seller real-time messaging via Socket.IO, online presence, image attachments |
| **Logger Service** | Centralized structured log ingestion and query interface |
| **Notification Service** | Per-user notification inbox — delivery, read state, bulk mark-as-read |
| **Recommendation Service** | Collaborative-filtering ML model (TensorFlow.js), popular products, similar-product discovery |
| **Kafka Service** | Analytics event consumer — processes interaction events and writes to the analytics database |

---

## Authentication

### Login methods

| Method | Endpoint |
|---|---|
| Email + password (customer) | \`POST /api/auth/login\` |
| Email + password (seller) | \`POST /api/auth/seller/login\` |
| Email + password (admin) | \`POST /api/auth/admin/login\` |
| Google OAuth 2.0 | \`GET /api/auth/google\` |

### Token storage

After a successful login two **httpOnly cookies** are set automatically — no manual token
handling is required for browser clients:

| Cookie | Lifetime | Purpose |
|---|---|---|
| \`{userType}_access_token\` | 15 min | Authorizes API requests |
| \`{userType}_refresh_token\` | 7 days (30 days with remember-me) | Obtains a new access token |

\`userType\` is one of \`customer\`, \`seller\`, or \`admin\`.
In production the cookies carry the \`__Host-\` prefix and \`Secure\` flag.

### Bearer token (non-browser clients)

For mobile apps or API consumers that cannot use cookies, pass the access token as a
Bearer header on every request:

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

Use the **Authorize** button at the top of this page to set the token globally for all
"Try it out" requests.

### Token refresh

\`\`\`
POST /api/auth/refresh
\`\`\`

Reads the refresh token from the cookie (or \`Authorization\` header) and returns a new
access token. Refresh tokens are rotated on each use and blacklisted on logout.

### Email verification

After registration a 6-digit OTP is sent by email. The account cannot log in until
\`POST /api/auth/verify-email\` is called with the correct OTP.
OTP attempts are limited to **3 per code** (Redis-backed), after which a new code must be requested.

---

## User Roles

All protected endpoints are guarded by both \`JwtAuthGuard\` and \`RolesGuard\`.

| Role | Access |
|---|---|
| \`CUSTOMER\` | Storefront, orders, chat, recommendations, notifications |
| \`SELLER\` | All CUSTOMER permissions + shop management, product management, seller dashboard |
| \`ADMIN\` | Full platform access — user/seller administration, layout control, log access |

Role is embedded in the JWT payload and re-validated on every request.
A banned account receives \`403 Forbidden\` on all authenticated endpoints.

---

## Rate Limiting

Three throttle tiers are enforced by \`ConditionalThrottlerGuard\` (Redis-backed counters).
Limits apply per IP address.

| Tier | Production | Development | Applied to |
|---|---|---|---|
| \`short\` | 100 req / min | 1 000 req / min | General endpoints |
| \`medium\` | 20 req / 15 min | 100 req / 15 min | Auth endpoints (login, signup, OTP) |
| \`long\` | 200 req / min | 2 000 req / min | Public search and catalog browsing |

Setting \`LOAD_TEST=true\` in the server environment bypasses all throttling for k6 load tests.

---

## Response Format

### Success

\`\`\`json
{
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { }
}
\`\`\`

### Paginated list

\`\`\`json
{
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": {
    "items": [ ],
    "total": 284,
    "page": 1,
    "limit": 20
  }
}
\`\`\`

### Error

\`\`\`json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["email must be an email", "password is too short"]
}
\`\`\`

Validation error details are **hidden in production** (\`disableErrorMessages: true\`).

---

## Real-Time (WebSocket)

Chat and live notifications use Socket.IO, not REST.
Because auth cookies are httpOnly and inaccessible to JavaScript, a short-lived
WebSocket token must be obtained first:

\`\`\`
GET /api/chat/ws-token          → { token, expiresIn: 300 }
GET /api/notifications/ws-token → { token, expiresIn: 300 }
\`\`\`

Pass the token as a query parameter during the Socket.IO handshake:

\`\`\`js
const socket = io('http://localhost:6007', {
  auth: { token: wsToken }
});
\`\`\`

WebSocket tokens expire in **5 minutes** and are single-purpose (scoped to \`websocket\` use).

---

## Payments (Stripe)

TecShop uses **Stripe Checkout Sessions** for customer payments and **Stripe Connect** for
seller payouts.

| Flow | Endpoint |
|---|---|
| Verify coupon before checkout | \`PUT /api/orders/verify-coupon-code\` |
| Create Checkout Session | \`POST /api/orders/checkout\` |
| Stripe redirects back on success | \`GET /api/orders/success/:sessionId\` |
| Seller onboards to Stripe Connect | \`POST /api/stripe/onboard\` |
| Webhook (Stripe → TecShop) | \`POST /api/webhooks/stripe\` |

The webhook endpoint requires a valid **Stripe-Signature** header and processes
\`checkout.session.completed\`, \`account.updated\`, and payout events.

---

## File Uploads

Endpoints that accept files use \`multipart/form-data\` with ImageKit CDN for storage.

| Endpoint | Field | Limits |
|---|---|---|
| \`POST /api/user/upload-avatar\` | \`avatar\` | JPEG, PNG, WebP — 5 MB |
| \`POST /api/seller/upload-image\` | \`image\` | JPEG, PNG, WebP — 10 MB |
| \`POST /api/chat/upload-image\` | \`image\` | JPEG, PNG, GIF, WebP — 5 MB |

MIME type is validated server-side via \`fileFilter\` — only declared types are accepted.

---

## Circuit Breaking

All downstream service calls are wrapped in an **Opossum circuit breaker**.
If a service becomes unresponsive, the circuit opens and returns \`503 Service Unavailable\`
immediately instead of queuing requests. The circuit resets automatically after a
configurable cool-down period.

---

## Observability

- **Metrics**: Prometheus endpoint at \`GET /api/metrics\` (prom-client, default + HTTP histogram)
- **Health**: \`GET /api/health\` — liveness probe used by Kubernetes
- **Tracing**: OpenTelemetry traces exported via OTLP HTTP to Grafana Tempo
- **Logs**: Structured JSON via nestjs-pino; authorization and cookie headers are redacted

---

## Support

Source code and issue tracker: [github.com/andriel300/tec-shop](https://github.com/andriel300/tec-shop)
`;
