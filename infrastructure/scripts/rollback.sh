#!/bin/bash
set -euo pipefail

# TecShop Helm rollback script
# Usage: ./infrastructure/scripts/rollback.sh [REVISION]
#
# Examples:
#   ./infrastructure/scripts/rollback.sh        # rolls back to previous revision
#   ./infrastructure/scripts/rollback.sh 3      # rolls back to revision 3
#
# To list available revisions:
#   helm history tec-shop -n tec-shop

RELEASE_NAME="tec-shop"
NAMESPACE="tec-shop"
REVISION="${1:-}"

# ─── Pre-flight Checks ────────────────────────────────────────────────────────

if ! command -v helm &>/dev/null; then
  echo "ERROR: helm is not installed."
  exit 1
fi

if ! command -v kubectl &>/dev/null; then
  echo "ERROR: kubectl is not installed."
  exit 1
fi

# ─── Show Current and Available History ──────────────────────────────────────

echo "Current release status:"
helm status "${RELEASE_NAME}" --namespace "${NAMESPACE}" 2>/dev/null || true

echo ""
echo "Release history:"
helm history "${RELEASE_NAME}" --namespace "${NAMESPACE}"

echo ""

# ─── Confirm Rollback ────────────────────────────────────────────────────────

if [[ -z "${REVISION}" ]]; then
  echo "No revision specified. Rolling back to previous revision."
  read -r -p "Confirm rollback? (yes/no): " CONFIRM
else
  echo "Rolling back to revision: ${REVISION}"
  read -r -p "Confirm rollback to revision ${REVISION}? (yes/no): " CONFIRM
fi

if [[ "${CONFIRM}" != "yes" ]]; then
  echo "Rollback cancelled."
  exit 0
fi

# ─── Execute Rollback ─────────────────────────────────────────────────────────

if [[ -z "${REVISION}" ]]; then
  echo "Executing rollback to previous revision..."
  helm rollback "${RELEASE_NAME}" \
    --namespace "${NAMESPACE}" \
    --wait \
    --timeout 10m
else
  echo "Executing rollback to revision ${REVISION}..."
  helm rollback "${RELEASE_NAME}" "${REVISION}" \
    --namespace "${NAMESPACE}" \
    --wait \
    --timeout 10m
fi

echo ""
echo "Rollback complete!"
echo "New release status:"
helm status "${RELEASE_NAME}" --namespace "${NAMESPACE}"

echo ""
echo "Run: kubectl get pods -n ${NAMESPACE} to verify all pods are running."

# TODO: Add post-rollback smoke test
# TODO: Send rollback notification to Slack/PagerDuty with reason
