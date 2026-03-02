#!/bin/bash
set -euo pipefail

# TecShop service health check script
# Curls /health on all services and reports status
#
# Usage:
#   ./infrastructure/scripts/health-check.sh                   # check localhost (dev)
#   ./infrastructure/scripts/health-check.sh staging           # check staging
#   API_BASE_URL=https://api.tec-shop.com ./health-check.sh    # check production
#
# TODO: Add --timeout flag
# TODO: Add JSON output mode for CI/CD integration

ENVIRONMENT="${1:-local}"

# ─── Configure Base URLs ─────────────────────────────────────────────────────

case "${ENVIRONMENT}" in
  local)
    API_GATEWAY_URL="${API_GATEWAY_URL:-http://localhost:8080}"
    AUTH_URL="${AUTH_URL:-http://localhost:6001}"
    USER_URL="${USER_URL:-http://localhost:6002}"
    SELLER_URL="${SELLER_URL:-http://localhost:6003}"
    PRODUCT_URL="${PRODUCT_URL:-http://localhost:6004}"
    ORDER_URL="${ORDER_URL:-http://localhost:6005}"
    ADMIN_URL="${ADMIN_URL:-http://localhost:6006}"
    CHATTING_URL="${CHATTING_URL:-http://localhost:6007}"
    LOGGER_URL="${LOGGER_URL:-http://localhost:6008}"
    KAFKA_URL="${KAFKA_URL:-http://localhost:6009}"
    RECOMMENDATION_URL="${RECOMMENDATION_URL:-http://localhost:6010}"
    ;;
  staging)
    # TODO: Replace with actual staging URLs
    API_GATEWAY_URL="https://api.staging.tec-shop.com"
    AUTH_URL="http://auth-service.tec-shop.svc.cluster.local:6001"
    USER_URL="http://user-service.tec-shop.svc.cluster.local:6002"
    SELLER_URL="http://seller-service.tec-shop.svc.cluster.local:6003"
    PRODUCT_URL="http://product-service.tec-shop.svc.cluster.local:6004"
    ORDER_URL="http://order-service.tec-shop.svc.cluster.local:6005"
    ADMIN_URL="http://admin-service.tec-shop.svc.cluster.local:6006"
    CHATTING_URL="http://chatting-service.tec-shop.svc.cluster.local:6007"
    LOGGER_URL="http://logger-service.tec-shop.svc.cluster.local:6008"
    KAFKA_URL="http://kafka-service.tec-shop.svc.cluster.local:6009"
    RECOMMENDATION_URL="http://recommendation-service.tec-shop.svc.cluster.local:6010"
    ;;
  prod|production)
    # TODO: Replace with actual production URLs
    API_GATEWAY_URL="https://api.tec-shop.com"
    AUTH_URL="http://auth-service.tec-shop.svc.cluster.local:6001"
    USER_URL="http://user-service.tec-shop.svc.cluster.local:6002"
    SELLER_URL="http://seller-service.tec-shop.svc.cluster.local:6003"
    PRODUCT_URL="http://product-service.tec-shop.svc.cluster.local:6004"
    ORDER_URL="http://order-service.tec-shop.svc.cluster.local:6005"
    ADMIN_URL="http://admin-service.tec-shop.svc.cluster.local:6006"
    CHATTING_URL="http://chatting-service.tec-shop.svc.cluster.local:6007"
    LOGGER_URL="http://logger-service.tec-shop.svc.cluster.local:6008"
    KAFKA_URL="http://kafka-service.tec-shop.svc.cluster.local:6009"
    RECOMMENDATION_URL="http://recommendation-service.tec-shop.svc.cluster.local:6010"
    ;;
  *)
    echo "ERROR: Unknown environment '${ENVIRONMENT}'. Use: local, staging, prod"
    exit 1
    ;;
esac

# ─── Health Check Function ────────────────────────────────────────────────────

PASS=0
FAIL=0
TIMEOUT=5

check_health() {
  local service_name="$1"
  local url="$2"
  local health_path="${3:-/health}"

  local full_url="${url}${health_path}"
  local http_code

  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time "${TIMEOUT}" \
    --connect-timeout "${TIMEOUT}" \
    "${full_url}" 2>/dev/null || echo "000")

  if [[ "${http_code}" == "200" ]]; then
    echo "  [PASS] ${service_name} (${full_url}) -> HTTP ${http_code}"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] ${service_name} (${full_url}) -> HTTP ${http_code}"
    FAIL=$((FAIL + 1))
  fi
}

# ─── Run Checks ───────────────────────────────────────────────────────────────

echo "=========================================="
echo " TecShop Health Check (env: ${ENVIRONMENT})"
echo "=========================================="
echo ""

echo "Backend Services:"
check_health "api-gateway"          "${API_GATEWAY_URL}"
check_health "auth-service"         "${AUTH_URL}"
check_health "user-service"         "${USER_URL}"
check_health "seller-service"       "${SELLER_URL}"
check_health "product-service"      "${PRODUCT_URL}"
check_health "order-service"        "${ORDER_URL}"
check_health "admin-service"        "${ADMIN_URL}"
check_health "chatting-service"     "${CHATTING_URL}"
check_health "logger-service"       "${LOGGER_URL}"
check_health "kafka-service"        "${KAFKA_URL}"
check_health "recommendation-service" "${RECOMMENDATION_URL}"

echo ""
echo "=========================================="
echo " Results: ${PASS} passed, ${FAIL} failed"
echo "=========================================="

if [[ "${FAIL}" -gt 0 ]]; then
  echo "HEALTH CHECK FAILED: ${FAIL} service(s) are not healthy"
  # TODO: Send alert to on-call when running in CI/CD
  exit 1
else
  echo "All services are healthy!"
  exit 0
fi
