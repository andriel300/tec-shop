# ADR-0008: JWT Authentication with httpOnly Cookies

## Status
Accepted

## Context
The platform serves three user types (CUSTOMER, SELLER, ADMIN) across three separate
frontend applications. We needed an authentication mechanism that is secure against
XSS attacks (a major concern for e-commerce platforms handling payment data), supports
token refresh without user interaction, and works across all three frontends.

## Decision
We issue JWTs as httpOnly cookies rather than returning tokens in response bodies for
client-side storage. The cookie naming convention separates tokens per user type:

- Development: `{userType}_access_token`, `{userType}_refresh_token`
  (e.g., `admin_access_token`)
- Production: `__Host-{userType}_access_token` (with `__Host-` prefix for strict
  same-site enforcement)

All cookies are `httpOnly: true` and `secure: true` in production. The JWT payload
contains: `{ sub, username, role, userType, iat, exp }` where `sub` is the user ID.

Token blacklisting via Redis handles logout and revocation without waiting for
token expiry.

## Alternatives Considered
- **localStorage / sessionStorage** — tokens accessible to JavaScript, making them
  vulnerable to XSS attacks. Rejected for a financial platform.
- **In-memory storage** — secure against XSS but lost on page refresh, degrading
  user experience and requiring frequent re-authentication.
- **Session-based auth** — stateful server sessions require sticky sessions or
  a shared session store; JWT with Redis blacklisting achieves similar statefulness
  with better horizontal scaling characteristics.

## Consequences
- **Positive:** Tokens inaccessible to JavaScript, eliminating XSS token theft;
  `__Host-` prefix in production prevents subdomain cookie injection.
- **Negative:** httpOnly cookies require `withCredentials: true` on all API and
  WebSocket connections; CSRF protection must be explicit (mitigated by `SameSite`
  cookie attribute and CORS restrictions).

## Trade-offs
Stronger XSS protection was prioritised over the simplicity of Authorization header
tokens. The extra `withCredentials` requirement on every client request is an
acceptable operational cost.
