#!/usr/bin/env bash
# local-dev-up.sh — spin up the full tec-shop stack locally using Docker Compose.
#
# Usage:
#   ./infrastructure/scripts/local-dev-up.sh [--build] [--down]
#
# Options:
#   --build   Force rebuild of all service images (passes --build to docker compose)
#   --down    Tear down the stack and wipe volumes (docker compose down -v), then exit

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/../docker/docker-compose.dev.yml"

BUILD_FLAG=""
TEARDOWN=false

for arg in "$@"; do
  case "$arg" in
    --build) BUILD_FLAG="--build" ;;
    --down)  TEARDOWN=true ;;
  esac
done

cd "$PROJECT_ROOT"

# ─── Tear down ────────────────────────────────────────────────────────────────
if [ "$TEARDOWN" = true ]; then
  echo "[local-dev] Tearing down stack and wiping volumes..."
  docker compose -f "$COMPOSE_FILE" down -v
  echo "[local-dev] Done."
  exit 0
fi

# ─── Prerequisites ────────────────────────────────────────────────────────────

# 1. .env file must exist
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  echo "[local-dev] ERROR: .env file not found."
  echo "  Copy .env.example to .env and fill in required secrets:"
  echo "    cp .env.example .env"
  exit 1
fi

# 2. Certificates must exist for every service that uses mTLS
REQUIRED_CERTS=(
  "certs/ca/ca-cert.pem"
  "certs/auth-service/auth-service-cert.pem"
  "certs/auth-service/auth-service-key.pem"
  "certs/user-service/user-service-cert.pem"
  "certs/user-service/user-service-key.pem"
)
MISSING_CERT=false
for cert in "${REQUIRED_CERTS[@]}"; do
  if [ ! -f "$PROJECT_ROOT/$cert" ]; then
    echo "[local-dev] Missing certificate: $cert"
    MISSING_CERT=true
  fi
done
if [ "$MISSING_CERT" = true ]; then
  echo "[local-dev] Run ./generate-certs.sh to create all certificates, then re-run this script."
  exit 1
fi

# 3. Required secrets must be non-empty in .env
check_env_var() {
  local var="$1"
  local value
  value=$(grep -E "^${var}=" "$PROJECT_ROOT/.env" 2>/dev/null | head -1 | cut -d'=' -f2- | tr -d '"')
  if [ -z "$value" ] || [[ "$value" == *"your-"* ]]; then
    echo "[local-dev] WARNING: $var in .env looks like a placeholder. Services may refuse to start."
  fi
}
check_env_var "JWT_SECRET"
check_env_var "SERVICE_MASTER_SECRET"
check_env_var "OTP_SALT"

# ─── Start infra first, wait for DBs, run migrations ─────────────────────────

echo "[local-dev] Starting infrastructure services (MongoDB, PostgreSQL, Redis, Kafka)..."
docker compose -f "$COMPOSE_FILE" up -d mongodb postgresql redis zookeeper kafka

echo "[local-dev] Waiting for PostgreSQL to be ready..."
until docker compose -f "$COMPOSE_FILE" exec -T postgresql pg_isready -U postgres &>/dev/null; do
  printf '.'
  sleep 2
done
echo " ready."

echo "[local-dev] Running order-service Prisma schema push..."
ORDER_SERVICE_DB_URL="postgresql://postgres:postgres@localhost:5432/tec-shop-orders" \
  npx nx run @tec-shop/order-schema:db-push --skip-nx-cache || {
    echo "[local-dev] WARNING: Prisma db-push failed. Order service may not start correctly."
    echo "  You can retry manually: ORDER_SERVICE_DB_URL=postgresql://postgres:postgres@localhost:5432/tec-shop-orders npx nx run @tec-shop/order-schema:db-push"
  }

echo "[local-dev] Waiting for Kafka to be ready..."
until docker compose -f "$COMPOSE_FILE" exec -T kafka \
  kafka-broker-api-versions --bootstrap-server localhost:9092 &>/dev/null; do
  printf '.'
  sleep 3
done
echo " ready."

# ─── Start all services ───────────────────────────────────────────────────────

echo "[local-dev] Starting all services..."
docker compose -f "$COMPOSE_FILE" up -d $BUILD_FLAG

echo ""
echo "[local-dev] Stack is up. Service URLs:"
echo "  user-ui      http://localhost:3000"
echo "  seller-ui    http://localhost:3001"
echo "  admin-ui     http://localhost:3002"
echo "  api-gateway  http://localhost:8080"
echo "  Swagger      http://localhost:8080/api-docs"
echo ""
echo "[local-dev] Tail logs:  docker compose -f infrastructure/docker/docker-compose.dev.yml logs -f"
echo "[local-dev] Tear down:  ./infrastructure/scripts/local-dev-up.sh --down"
