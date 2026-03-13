#!/usr/bin/env bash
# load-testing/run-tests.sh
#
# Runs k6 load test scenarios and exports results to:
#   - Timestamped JSON files in load-testing/results/ (for offline analysis)
#   - Prometheus remote-write (for live Grafana visibility during the test)
#
# Prerequisites:
#   - k6 installed and on PATH
#   - Infrastructure running: pnpm run infra:up
#   - Services running: pnpm run dev
#   - LOAD_TEST=true set in root .env and api-gateway restarted
#
# Usage:
#   ./load-testing/run-tests.sh             # runs stress + soak only
#   ./load-testing/run-tests.sh --all       # runs all four scenarios
#   ./load-testing/run-tests.sh --baseline  # single scenario flags
#   ./load-testing/run-tests.sh --stress
#   ./load-testing/run-tests.sh --spike
#   ./load-testing/run-tests.sh --soak
#
# Grafana dashboard (open before running to watch metrics live):
#   http://localhost:3030  →  TecShop Platform Overview  →  Load Test Results row
#
# Prometheus remote-write endpoint used:
#   http://localhost:9090/api/v1/write  (--web.enable-remote-write-receiver already set)

set -euo pipefail

# ── colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results"
SCENARIOS_DIR="${SCRIPT_DIR}/scenarios"
PROMETHEUS_URL="${K6_PROMETHEUS_RW_SERVER_URL:-http://localhost:9090/api/v1/write}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

# ── helpers ───────────────────────────────────────────────────────────────────
log() { echo -e "${CYAN}[run-tests]${RESET} $*"; }
ok() { echo -e "${GREEN}[run-tests]${RESET} $*"; }
warn() { echo -e "${YELLOW}[run-tests]${RESET} $*"; }
fail() {
  echo -e "${RED}[run-tests]${RESET} $*" >&2
  exit 1
}

# ── preflight checks ──────────────────────────────────────────────────────────
preflight() {
  if ! command -v k6 &>/dev/null; then
    fail "k6 not found on PATH. Install it: https://k6.io/docs/getting-started/installation/"
  fi

  # Read LOAD_TEST from root .env if it exists
  local env_file
  env_file="$(git -C "${SCRIPT_DIR}" rev-parse --show-toplevel 2>/dev/null)/.env"
  local load_test_val=""
  if [[ -f "${env_file}" ]]; then
    load_test_val="$(grep -E '^LOAD_TEST=' "${env_file}" | tail -1 | cut -d= -f2 | tr -d ' ')"
  fi

  if [[ "${load_test_val}" != "true" ]]; then
    fail "LOAD_TEST is not set to 'true' in .env.\n  Set LOAD_TEST=true, restart api-gateway, then re-run this script."
  fi

  # Verify api-gateway is reachable
  if ! curl -sf --max-time 3 "http://localhost:8080/api/categories" -o /dev/null; then
    fail "api-gateway not reachable at http://localhost:8080. Start services first."
  fi

  # Verify Prometheus remote-write receiver is up
  if ! curl -sf --max-time 3 "${PROMETHEUS_URL%/write}" -o /dev/null 2>/dev/null; then
    warn "Prometheus not reachable at ${PROMETHEUS_URL%/write}. JSON output only."
    PROMETHEUS_AVAILABLE=false
  else
    PROMETHEUS_AVAILABLE=true
  fi
}

# ── run one scenario ──────────────────────────────────────────────────────────
run_scenario() {
  local name="$1"
  local file="${SCENARIOS_DIR}/${name}.js"
  local json_out="${RESULTS_DIR}/${name}-${TIMESTAMP}.json"
  local separator
  separator="$(printf '─%.0s' {1..70})"

  if [[ ! -f "${file}" ]]; then
    warn "Scenario file not found: ${file} — skipping."
    return
  fi

  echo ""
  echo -e "${BOLD}${separator}${RESET}"
  echo -e "${BOLD}  Running: ${name}${RESET}"
  echo -e "${BOLD}${separator}${RESET}"
  log "Results JSON : ${json_out}"

  local k6_args=("run" "--out" "json=${json_out}")

  if [[ "${PROMETHEUS_AVAILABLE}" == "true" ]]; then
    log "Prometheus   : ${PROMETHEUS_URL}"
    k6_args+=("--out" "experimental-prometheus-rw")
    # Enable native histograms for better quantile accuracy in Grafana
    export K6_PROMETHEUS_RW_SERVER_URL="${PROMETHEUS_URL}"
    export K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true
  fi

  k6_args+=("${file}")

  local start
  start="$(date +%s)"

  if k6 "${k6_args[@]}"; then
    local elapsed=$(($(date +%s) - start))
    ok "${name} passed in ${elapsed}s"
  else
    warn "${name} finished with threshold violations (check output above)"
  fi

  echo ""
  log "JSON saved: ${json_out}"
  log "File size:  $(du -sh "${json_out}" 2>/dev/null | cut -f1)"
}

# ── parse args ────────────────────────────────────────────────────────────────
RUN_BASELINE=false
RUN_STRESS=false
RUN_SPIKE=false
RUN_SOAK=false

if [[ $# -eq 0 ]]; then
  # Default: run stress + soak (the two with new/updated instrumentation)
  RUN_STRESS=true
  RUN_SOAK=true
else
  for arg in "$@"; do
    case "$arg" in
    --all)
      RUN_BASELINE=true
      RUN_STRESS=true
      RUN_SPIKE=true
      RUN_SOAK=true
      ;;
    --baseline) RUN_BASELINE=true ;;
    --stress) RUN_STRESS=true ;;
    --spike) RUN_SPIKE=true ;;
    --soak) RUN_SOAK=true ;;
    *) fail "Unknown flag: ${arg}\nUsage: $0 [--all|--baseline|--stress|--spike|--soak]" ;;
    esac
  done
fi

# ── main ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}TecShop Load Test Runner${RESET}"
echo -e "Timestamp : ${TIMESTAMP}"
echo -e "Grafana   : http://localhost:3030  →  TecShop Platform Overview"
echo ""

preflight
mkdir -p "${RESULTS_DIR}"

[[ "${RUN_BASELINE}" == "true" ]] && run_scenario "baseline"
[[ "${RUN_STRESS}" == "true" ]] && run_scenario "stress"
[[ "${RUN_SPIKE}" == "true" ]] && run_scenario "spike"
[[ "${RUN_SOAK}" == "true" ]] && run_scenario "soak"

echo ""
echo -e "${BOLD}$(printf '─%.0s' {1..70})${RESET}"
ok "All selected scenarios complete."
echo -e "Results saved in: ${RESULTS_DIR}/"
echo ""
echo -e "${YELLOW}IMPORTANT: Set LOAD_TEST=false in .env and restart api-gateway.${RESET}"
echo ""
