#!/bin/bash
set -euo pipefail

# TecShop Helm deploy script
# Usage: ./infrastructure/scripts/deploy.sh [dev|prod|demo|local] [IMAGE_TAG]
#
# Examples:
#   ./infrastructure/scripts/deploy.sh local           # kind cluster (images pre-loaded)
#   ./infrastructure/scripts/deploy.sh dev             # staging cluster
#   ./infrastructure/scripts/deploy.sh demo v1.2.3    # Oracle Cloud k3s (free tier)
#   ./infrastructure/scripts/deploy.sh prod v1.2.3    # production cluster
#
# TODO: Add --dry-run flag support

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="${SCRIPT_DIR}/../helm/tec-shop"
RELEASE_NAME="tec-shop"
NAMESPACE="tec-shop"

# ─── Argument Parsing ─────────────────────────────────────────────────────────

ENVIRONMENT="${1:-dev}"
IMAGE_TAG="${2:-latest}"

if [[ "${ENVIRONMENT}" != "dev" && "${ENVIRONMENT}" != "prod" && "${ENVIRONMENT}" != "demo" && "${ENVIRONMENT}" != "local" ]]; then
  echo "ERROR: Environment must be 'dev', 'prod', 'demo', or 'local'"
  echo "Usage: $0 [dev|prod|demo|local] [IMAGE_TAG]"
  exit 1
fi

VALUES_FILE="${CHART_DIR}/values.${ENVIRONMENT}.yaml"

if [[ ! -f "${VALUES_FILE}" ]]; then
  echo "ERROR: Values file not found: ${VALUES_FILE}"
  exit 1
fi

# ─── Pre-flight Checks ────────────────────────────────────────────────────────

echo "Pre-flight checks..."

if ! command -v helm &>/dev/null; then
  echo "ERROR: helm is not installed. See https://helm.sh/docs/intro/install/"
  exit 1
fi

if ! command -v kubectl &>/dev/null; then
  echo "ERROR: kubectl is not installed."
  exit 1
fi

# TODO: Add check for correct kubectl context before deploying to prod
if [[ "${ENVIRONMENT}" == "local" ]]; then
  CURRENT_CONTEXT=$(kubectl config current-context)
  if [[ "${CURRENT_CONTEXT}" != "kind-tec-shop" ]]; then
    echo "WARNING: Current kubectl context is '${CURRENT_CONTEXT}', expected 'kind-tec-shop'."
    read -r -p "Continue anyway? (yes/no): " CONFIRM
    if [[ "${CONFIRM}" != "yes" ]]; then
      echo "Deployment cancelled. Switch context: kubectl config use-context kind-tec-shop"
      exit 0
    fi
  fi
fi

if [[ "${ENVIRONMENT}" == "demo" || "${ENVIRONMENT}" == "prod" ]]; then
  CURRENT_CONTEXT=$(kubectl config current-context)
  ENV_LABEL=$(echo "${ENVIRONMENT}" | tr '[:lower:]' '[:upper:]')
  echo "WARNING: Deploying to ${ENV_LABEL} using context: ${CURRENT_CONTEXT}"
  read -r -p "Are you sure? (yes/no): " CONFIRM
  if [[ "${CONFIRM}" != "yes" ]]; then
    echo "Deployment cancelled."
    exit 0
  fi
fi

# ─── Namespace Setup ──────────────────────────────────────────────────────────

echo "Ensuring namespace '${NAMESPACE}' exists..."
kubectl apply -f "${SCRIPT_DIR}/../k8s/namespaces/tec-shop.yaml"

# ─── Secrets Check ────────────────────────────────────────────────────────────

SECRETS_FILE="${SCRIPT_DIR}/../k8s/secrets/app-secrets.yaml"
if [[ ! -f "${SECRETS_FILE}" ]]; then
  echo "ERROR: Secrets file not found at ${SECRETS_FILE}"
  echo "Copy app-secrets.yaml.example to app-secrets.yaml and fill in real values."
  exit 1
fi

echo "Applying secrets..."
kubectl apply -f "${SECRETS_FILE}" --namespace="${NAMESPACE}"

# ─── Helm Deploy ──────────────────────────────────────────────────────────────

echo "Deploying TecShop (environment=${ENVIRONMENT}, image_tag=${IMAGE_TAG})..."

helm upgrade --install "${RELEASE_NAME}" "${CHART_DIR}" \
  --namespace "${NAMESPACE}" \
  --create-namespace \
  --values "${CHART_DIR}/values.yaml" \
  --values "${VALUES_FILE}" \
  --set global.imageTag="${IMAGE_TAG}" \
  --timeout 10m \
  --wait \
  --atomic

echo "Deployment complete!"
echo "Run: kubectl get pods -n ${NAMESPACE} to verify all pods are running."

# TODO: Add post-deploy smoke test (curl /health on api-gateway)
# TODO: Send deployment notification to Slack/PagerDuty
