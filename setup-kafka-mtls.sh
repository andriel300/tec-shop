#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  TecShop -- Kafka mTLS Setup
#
#  Converts PEM certs (from generate-certs.sh) into the
#  PKCS12 keystore/truststore format required by Confluent
#  cp-kafka, and copies flat PEM files for KafkaJS clients.
#
#  Prerequisites:
#    - ./generate-certs.sh must have been run at least once
#    - openssl
#    - keytool  (ships with any JDK — `java -version` to check)
#
#  Usage:
#    ./setup-kafka-mtls.sh
#
#  Output (all under certs/kafka/ which is gitignored):
#    kafka.p12        — broker keystore  (PKCS12)
#    truststore.p12   — broker truststore (PKCS12, CA cert)
#    password         — password file for Confluent Docker vars
#    ca.pem           — CA cert for KafkaJS clients
#    service.cert     — client cert for KafkaJS clients
#    service.key      — client key for KafkaJS clients
# ============================================================

CERTS_DIR="./certs"
KAFKA_DIR="$CERTS_DIR/kafka"
CA_CERT="$CERTS_DIR/ca/ca-cert.pem"
PASS="tecshop-kafka"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ── Helpers ───────────────────────────────────────────────────────────────────
log_info() { printf "  ${CYAN}[INFO]${NC}  %s\n" "$*"; }
log_ok() { printf "  ${GREEN}[ OK ]${NC}  %s\n" "$*"; }
log_warn() { printf "  ${YELLOW}[WARN]${NC}  %s\n" "$*"; }
log_error() { printf "  ${RED}[ERROR]${NC} %s\n" "$*" >&2; }

# ── Dependency check ──────────────────────────────────────────────────────────
if ! command -v openssl &>/dev/null; then
  log_error "openssl not found. Please install it and try again."
  exit 1
fi

if ! command -v keytool &>/dev/null; then
  log_error "keytool not found. Install a JDK (e.g. 'sudo pacman -S jdk-openjdk') and try again."
  exit 1
fi

printf '\n'
printf "  ${YELLOW}============================================================${NC}\n"
printf "   TecShop  --  Kafka mTLS Setup\n"
printf "  ${YELLOW}============================================================${NC}\n"
printf '\n'

# ── Step 1: ensure Kafka broker cert exists ───────────────────────────────────
if [[ ! -f "$KAFKA_DIR/kafka-cert.pem" || ! -f "$KAFKA_DIR/kafka-key.pem" ]]; then
  log_info "Kafka broker cert not found — running generate-certs.sh --service kafka..."
  ./generate-certs.sh --service kafka
else
  log_info "Kafka broker cert already exists, skipping generation."
fi

mkdir -p "$KAFKA_DIR"

# ── Step 2: PKCS12 keystore for the broker ────────────────────────────────────
log_info "Creating broker keystore (kafka.p12)..."
openssl pkcs12 -export \
  -in "$KAFKA_DIR/kafka-cert.pem" \
  -inkey "$KAFKA_DIR/kafka-key.pem" \
  -CAfile "$CA_CERT" \
  -out "$KAFKA_DIR/kafka.p12" \
  -passout "pass:$PASS" \
  -name kafka-broker 2>/dev/null
chmod 600 "$KAFKA_DIR/kafka.p12"
log_ok "kafka.p12"

# ── Step 3: PKCS12 truststore (CA cert only) ──────────────────────────────────
log_info "Creating truststore (truststore.p12)..."
# Remove stale truststore so keytool doesn't fail on existing alias
rm -f "$KAFKA_DIR/truststore.p12"
keytool -importcert \
  -trustcacerts \
  -alias tec-shop-ca \
  -file "$CA_CERT" \
  -keystore "$KAFKA_DIR/truststore.p12" \
  -storepass "$PASS" \
  -storetype PKCS12 \
  -noprompt 2>/dev/null
chmod 600 "$KAFKA_DIR/truststore.p12"
log_ok "truststore.p12"

# ── Step 4: Password file for Confluent Docker ────────────────────────────────
log_info "Creating password file for Docker credentials..."
echo "$PASS" >"$KAFKA_DIR/password"
chmod 600 "$KAFKA_DIR/password"
log_ok "password"

# ── Step 5: flat PEM files for KafkaJS clients ────────────────────────────────
log_info "Copying PEM client files..."
cp "$CA_CERT" "$KAFKA_DIR/ca.pem"
cp "$KAFKA_DIR/kafka-cert.pem" "$KAFKA_DIR/service.cert"
cp "$KAFKA_DIR/kafka-key.pem" "$KAFKA_DIR/service.key"
chmod 644 "$KAFKA_DIR/ca.pem" "$KAFKA_DIR/service.cert"
chmod 600 "$KAFKA_DIR/service.key"
log_ok "ca.pem, service.cert, service.key"

printf '\n'
log_ok "Kafka mTLS setup complete at $KAFKA_DIR/"
printf '\n'
printf '  Next steps:\n'
printf '    1. Restart infra:  pnpm run infra:down && pnpm run infra:up\n'
printf '    2. In .env set:\n'
printf '         KAFKA_BROKER="localhost:9093"\n'
printf '         KAFKA_SSL_CA_PATH="certs/kafka/ca.pem"\n'
printf '         KAFKA_SSL_CERT_PATH="certs/kafka/service.cert"\n'
printf '         KAFKA_SSL_KEY_PATH="certs/kafka/service.key"\n'
printf '\n'
