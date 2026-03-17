# Environment Variables

Copy `.env.example` to `.env` and fill in the values below.

## Required Variables

```bash
# Database — one URL per service (separate MongoDB databases)
AUTH_SERVICE_DB_URL="mongodb+srv://user:pass@cluster.mongodb.net/auth"
USER_SERVICE_DB_URL="mongodb+srv://user:pass@cluster.mongodb.net/user"
SELLER_SERVICE_DB_URL="mongodb+srv://user:pass@cluster.mongodb.net/seller"
PRODUCT_SERVICE_DB_URL="mongodb+srv://user:pass@cluster.mongodb.net/product"
CHATTING_SERVICE_DB_URL="mongodb+srv://user:pass@cluster.mongodb.net/chatting"
LOGGER_SERVICE_DB_URL="mongodb+srv://user:pass@cluster.mongodb.net/logger"
ANALYTICS_SERVICE_DB_URL="mongodb+srv://user:pass@cluster.mongodb.net/analytics"

# Order service uses PostgreSQL (Neon recommended)
ORDER_SERVICE_DB_URL="postgres://user:pass@ep-xxx.neon.tech/order?sslmode=require"

# Redis (Upstash recommended)
REDIS_URL="rediss://default:token@host.upstash.io:6379"

# Security — minimum 32 characters, no defaults allowed
# Generate with: openssl rand -base64 32
JWT_SECRET="your-jwt-secret-minimum-32-characters"
SERVICE_MASTER_SECRET="your-service-master-secret-32-chars"
OTP_SALT="your-otp-salt"

# Email SMTP
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
SMTP_FROM="noreply@yourdomain.com"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:8080/api/auth/google/callback"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ImageKit CDN
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-id"
IMAGEKIT_PUBLIC_KEY="your-imagekit-public-key"
IMAGEKIT_PRIVATE_KEY="your-imagekit-private-key"

# Kafka
KAFKA_BROKER="localhost:9092"
```

## Optional Variables

```bash
# Sentry error tracking
SENTRY_DSN="https://xxx@sentry.io/project-id"

# OpenTelemetry tracing
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"

# Load testing — bypasses all rate limiting at request time
# Never set to true alongside NODE_ENV=production (throws at bootstrap)
LOAD_TEST=false

# Seed admin user
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="your-admin-password"

# CORS origins (comma-separated, production)
CORS_ORIGINS="https://tec-shop.com,https://seller.tec-shop.com,https://admin.tec-shop.com"

# Next.js public API URL (baked into client bundle at build time)
NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXT_PUBLIC_CHATTING_WS_URL="http://localhost:6007"
NEXT_PUBLIC_NOTIFICATION_WS_URL="http://localhost:6012"
```

## Production Configuration

For production deployments:

- Use strong, unique values for `JWT_SECRET` and `SERVICE_MASTER_SECRET` (no defaults)
- Use production database URLs with connection pooling enabled
- Use production SMTP credentials
- Set Redis with authentication and persistence (`rediss://`)
- Use HTTPS URLs for all external services and OAuth callbacks
- Set `NODE_ENV=production`
- Never set `LOAD_TEST=true` in production (the app throws at bootstrap if both are set)
