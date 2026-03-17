# Key Features

## Authentication & Security

- Email/password registration with OTP email verification
- Google OAuth 2.0 integration
- Remember me functionality with extended sessions
- Password reset with cryptographically secure codes
- Automatic token refresh with rotation
- Session management with httpOnly cookies
- Account ban/unban by admins

## Multi-Vendor Marketplace

- Sellers create and manage shops with branding (logo, banner)
- Admins control the category and brand taxonomy
- Sellers manage products, variants (SKU, price, stock), and images (up to 4 per product)
- Discount codes with configurable type, value, expiry, and usage limits
- Shop events with scheduled start/end dates
- Stripe Connect for seller payouts

## Orders & Payments

- Stripe Checkout Session-based payment flow
- Webhook-driven order status transitions
- Per-seller payout tracking
- Order history with item-level detail

## Real-Time Features

- Buyer-to-seller chat with Socket.IO
- Online presence tracking
- Live notification delivery
- Centralized log streaming to admin dashboard

## Recommendations

- Collaborative filtering model trained on user analytics (views, add-to-cart, purchases)
- TensorFlow.js trains the model based on interaction data
- Fallback to popularity-based rankings for cold-start users
- Similar product discovery by shop context
- Redis-cached results with background retraining scheduler

## Internationalization

- Full URL-based locale routing (`/en/`, `/ptbr/`) via `next-intl` v4
- Shared translations in `@tec-shop/i18n`; per-app overrides merged at request time
- Language switcher across all three frontends
