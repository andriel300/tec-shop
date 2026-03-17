#!/bin/bash
# Creates Kubernetes secrets for tec-shop from your .env file and mTLS cert files.
#
# Usage: ./infrastructure/scripts/create-k8s-secrets.sh [MODE] [ENV_FILE]
#   MODE      "local" (default) — uses in-cluster Bitnami MongoDB/Redis URLs
#             "dev"             — reads all DB URLs from .env as-is
#   ENV_FILE  path to .env file (default: <repo-root>/.env)
#
# Creates:
#   tec-shop-secrets  — JWT, DB connection strings, Stripe, ImageKit, email
#   tec-shop-certs    — mTLS certificates for all backend services
#
# Prerequisites:
#   - kubectl configured for the target cluster
#   - .env file present at the project root
#   - mTLS cert files in ./certs/ (run generate-certs.sh first if missing)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

MODE="${1:-local}"
ENV_FILE="${2:-${REPO_ROOT}/.env}"
NAMESPACE="tec-shop"
RELEASE_NAME="tec-shop"

if [[ "${MODE}" != "local" && "${MODE}" != "dev" ]]; then
  echo "ERROR: MODE must be 'local' or 'dev'"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: .env file not found at ${ENV_FILE}"
  echo "  Copy .env.example to .env and fill in the required values."
  exit 1
fi

echo "=================================================="
echo " TecShop — create K8s secrets"
echo " Mode      : ${MODE}"
echo " Namespace : ${NAMESPACE}"
echo " Env file  : ${ENV_FILE}"
echo "=================================================="
echo ""

# Load .env without exporting (just to read values)
set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

# Ensure namespace exists
echo "Ensuring namespace '${NAMESPACE}'..."
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

# ─── tec-shop-secrets ────────────────────────────────────────────────────────

echo "Creating tec-shop-secrets..."

if [[ "${MODE}" == "local" ]]; then
  # In-cluster Bitnami services (no auth, plain URLs)
  MONGO_BASE="mongodb://${RELEASE_NAME}-mongodb:27017"
  REDIS_URL_VALUE="redis://${RELEASE_NAME}-redis-master:6379"

  AUTH_DB="${AUTH_SERVICE_DB_URL:-${MONGO_BASE}/tec-shop-auth}"
  USER_DB="${USER_SERVICE_DB_URL:-${MONGO_BASE}/tec-shop-user}"
  SELLER_DB="${SELLER_SERVICE_DB_URL:-${MONGO_BASE}/tec-shop-seller}"
  PRODUCT_DB="${PRODUCT_SERVICE_DB_URL:-${MONGO_BASE}/tec-shop-product}"
  CHATTING_DB="${CHATTING_SERVICE_DB_URL:-${MONGO_BASE}/tec-shop-chatting}"
  LOGGER_DB="${LOGGER_SERVICE_DB_URL:-${MONGO_BASE}/tec-shop-logger}"
  NOTIFICATION_DB="${NOTIFICATION_SERVICE_DB_URL:-${MONGO_BASE}/tec-shop-notification}"
  ANALYTICS_DB="${ANALYTICS_SERVICE_DB_URL:-${MONGO_BASE}/tec-shop-analytics}"
else
  # dev: use connection strings from .env directly
  AUTH_DB="${AUTH_SERVICE_DB_URL:?AUTH_SERVICE_DB_URL is required in .env}"
  USER_DB="${USER_SERVICE_DB_URL:?USER_SERVICE_DB_URL is required in .env}"
  SELLER_DB="${SELLER_SERVICE_DB_URL:?SELLER_SERVICE_DB_URL is required in .env}"
  PRODUCT_DB="${PRODUCT_SERVICE_DB_URL:?PRODUCT_SERVICE_DB_URL is required in .env}"
  CHATTING_DB="${CHATTING_SERVICE_DB_URL:?CHATTING_SERVICE_DB_URL is required in .env}"
  LOGGER_DB="${LOGGER_SERVICE_DB_URL:?LOGGER_SERVICE_DB_URL is required in .env}"
  NOTIFICATION_DB="${NOTIFICATION_SERVICE_DB_URL:?NOTIFICATION_SERVICE_DB_URL is required in .env}"
  ANALYTICS_DB="${ANALYTICS_SERVICE_DB_URL:?ANALYTICS_SERVICE_DB_URL is required in .env}"
  REDIS_URL_VALUE="${REDIS_URL:?REDIS_URL is required in .env}"
fi

kubectl create secret generic tec-shop-secrets \
  --namespace="${NAMESPACE}" \
  --from-literal=JWT_SECRET="${JWT_SECRET:?JWT_SECRET is required in .env}" \
  --from-literal=SERVICE_MASTER_SECRET="${SERVICE_MASTER_SECRET:?SERVICE_MASTER_SECRET is required in .env}" \
  --from-literal=AUTH_SERVICE_DB_URL="${AUTH_DB}" \
  --from-literal=USER_SERVICE_DB_URL="${USER_DB}" \
  --from-literal=SELLER_SERVICE_DB_URL="${SELLER_DB}" \
  --from-literal=PRODUCT_SERVICE_DB_URL="${PRODUCT_DB}" \
  --from-literal=CHATTING_SERVICE_DB_URL="${CHATTING_DB}" \
  --from-literal=LOGGER_SERVICE_DB_URL="${LOGGER_DB}" \
  --from-literal=NOTIFICATION_SERVICE_DB_URL="${NOTIFICATION_DB}" \
  --from-literal=ANALYTICS_SERVICE_DB_URL="${ANALYTICS_DB}" \
  --from-literal=ORDER_SERVICE_DB_URL="${ORDER_SERVICE_DB_URL:?ORDER_SERVICE_DB_URL is required in .env (Neon PostgreSQL)}" \
  --from-literal=REDIS_URL="${REDIS_URL_VALUE}" \
  --from-literal=IMAGEKIT_PRIVATE_KEY="${IMAGEKIT_PRIVATE_KEY:-placeholder}" \
  --from-literal=IMAGEKIT_PUBLIC_KEY="${IMAGEKIT_PUBLIC_KEY:-placeholder}" \
  --from-literal=EMAIL_USER="${EMAIL_USER:-placeholder}" \
  --from-literal=EMAIL_PASS="${EMAIL_PASS:-placeholder}" \
  --from-literal=STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-placeholder}" \
  --from-literal=STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-placeholder}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "tec-shop-secrets created."
echo ""

# ─── tec-shop-certs ──────────────────────────────────────────────────────────

CERTS_DIR="${REPO_ROOT}/certs"

if [[ ! -d "${CERTS_DIR}" ]]; then
  echo "WARNING: certs/ directory not found at ${CERTS_DIR}"
  echo "  Skipping tec-shop-certs. Pods will crash until certs are available."
  echo "  Run ./generate-certs.sh to create mTLS certificates."
  exit 0
fi

echo "Creating tec-shop-certs..."

CERT_ARGS=()

# CA certificate (shared across all services)
if [[ -f "${CERTS_DIR}/ca/ca-cert.pem" ]]; then
  CERT_ARGS+=(--from-file=ca-cert.pem="${CERTS_DIR}/ca/ca-cert.pem")
else
  echo "WARNING: Missing ${CERTS_DIR}/ca/ca-cert.pem"
fi

BACKEND_SERVICES=(
  api-gateway
  auth-service
  user-service
  seller-service
  product-service
  order-service
  admin-service
  chatting-service
  logger-service
  notification-service
  kafka-service
  recommendation-service
)

for SERVICE in "${BACKEND_SERVICES[@]}"; do
  KEY_FILE="${CERTS_DIR}/${SERVICE}/${SERVICE}-key.pem"
  CERT_FILE="${CERTS_DIR}/${SERVICE}/${SERVICE}-cert.pem"

  if [[ -f "${KEY_FILE}" && -f "${CERT_FILE}" ]]; then
    CERT_ARGS+=(--from-file="${SERVICE}-key.pem=${KEY_FILE}")
    CERT_ARGS+=(--from-file="${SERVICE}-cert.pem=${CERT_FILE}")
  else
    echo "WARNING: Missing certs for ${SERVICE} in ${CERTS_DIR}/${SERVICE}/"
  fi
done

if [[ ${#CERT_ARGS[@]} -gt 0 ]]; then
  kubectl create secret generic tec-shop-certs \
    --namespace="${NAMESPACE}" \
    "${CERT_ARGS[@]}" \
    --dry-run=client -o yaml | kubectl apply -f -
  echo "tec-shop-certs created."
else
  echo "WARNING: No cert files found — tec-shop-certs not created."
fi

echo ""
echo "=================================================="
echo " Secrets ready. Next:"
echo "   ./infrastructure/scripts/deploy.sh local"
echo "=================================================="
