#!/bin/bash
# Builds all backend service Docker images and loads them into a kind cluster.
# Images are tagged as tec-shop-local/<service>:<tag> and never pushed to a registry —
# kind loads them directly from the local Docker daemon via `kind load docker-image`.
#
# Usage: ./infrastructure/scripts/build-and-load.sh [IMAGE_TAG] [CLUSTER_NAME]
#   IMAGE_TAG     defaults to "local"
#   CLUSTER_NAME  defaults to "tec-shop"
#
# Example:
#   ./infrastructure/scripts/build-and-load.sh          # tag=local, cluster=tec-shop
#   ./infrastructure/scripts/build-and-load.sh v1.0.0   # tag=v1.0.0

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DOCKER_DIR="${REPO_ROOT}/infrastructure/docker/services"

IMAGE_TAG="${1:-local}"
CLUSTER_NAME="${2:-tec-shop}"
REGISTRY="tec-shop-local"

SERVICES=(
  api-gateway
  auth-service
  user-service
  seller-service
  product-service
  order-service
  admin-service
  chatting-service
  logger-service
  kafka-service
  recommendation-service
)

echo "=================================================="
echo " TecShop — build & load into kind"
echo " Registry : ${REGISTRY}"
echo " Tag      : ${IMAGE_TAG}"
echo " Cluster  : ${CLUSTER_NAME}"
echo "=================================================="
echo ""

# Verify the kind cluster exists
if ! kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
  echo "ERROR: kind cluster '${CLUSTER_NAME}' not found."
  echo "  Run: kind create cluster --name ${CLUSTER_NAME}"
  exit 1
fi

BUILT=()
SKIPPED=()

for SERVICE in "${SERVICES[@]}"; do
  IMAGE="${REGISTRY}/tec-shop-${SERVICE}:${IMAGE_TAG}"
  DOCKERFILE="${DOCKER_DIR}/${SERVICE}.Dockerfile"

  if [[ ! -f "${DOCKERFILE}" ]]; then
    echo "SKIP: ${SERVICE} — Dockerfile not found at ${DOCKERFILE}"
    SKIPPED+=("${SERVICE}")
    continue
  fi

  echo "──────────────────────────────────────────────────"
  echo "Building  : ${IMAGE}"
  docker build \
    -f "${DOCKERFILE}" \
    -t "${IMAGE}" \
    "${REPO_ROOT}"

  echo "Loading   : ${IMAGE} → kind cluster '${CLUSTER_NAME}'"
  kind load docker-image "${IMAGE}" --name "${CLUSTER_NAME}"

  BUILT+=("${SERVICE}")
  echo "Done      : ${SERVICE}"
  echo ""
done

echo "=================================================="
echo " Summary"
echo "=================================================="
echo " Built & loaded : ${#BUILT[@]} services"
if [[ ${#SKIPPED[@]} -gt 0 ]]; then
  echo " Skipped        : ${SKIPPED[*]}"
fi
echo ""
echo "Next steps:"
echo "  1. Create K8s secrets (if not done yet):"
echo "       ./infrastructure/scripts/create-k8s-secrets.sh local"
echo "  2. Deploy with Helm:"
echo "       ./infrastructure/scripts/deploy.sh local ${IMAGE_TAG}"
