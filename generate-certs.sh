#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  TecShop -- mTLS Certificate Generator
#
#  Generates a self-signed CA and per-service leaf certificates
#  for mutual TLS authentication between backend microservices.
#
#  Usage:
#    ./generate-certs.sh                  Generate CA + all service certs
#    ./generate-certs.sh --all            Same as above (explicit)
#    ./generate-certs.sh --service <name> Generate cert for one service
#    ./generate-certs.sh --clean          Remove all certificates
#    ./generate-certs.sh --help           Print usage
#
#  Output layout:
#    certs/
#    |-- ca/
#    |   |-- ca-key.pem       CA private key  (keep secret, never commit)
#    |   `-- ca-cert.pem      CA certificate  (distributed to all services)
#    `-- <service>/
#        |-- <service>-key.pem
#        `-- <service>-cert.pem
# ============================================================

CERTS_DIR="./certs"
CA_KEY="$CERTS_DIR/ca/ca-key.pem"
CA_CERT="$CERTS_DIR/ca/ca-cert.pem"

DEFAULT_SERVICES=(
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
  notification-service
  recommendation-service
)

# ── Output helpers ────────────────────────────────────────────────────────────

log_info() { printf '  [INFO]  %s\n' "$*"; }
log_ok() { printf '  [ OK ]  %s\n' "$*"; }
log_warn() { printf '  [WARN]  %s\n' "$*"; }
log_error() { printf '  [ERROR] %s\n' "$*" >&2; }

# ── CA generation ─────────────────────────────────────────────────────────────

create_ca() {
  if [[ -f "$CA_KEY" && -f "$CA_CERT" ]]; then
    log_warn "CA already exists at $CERTS_DIR/ca/ -- skipping generation."
    return
  fi

  log_info "Generating Certificate Authority (4096-bit RSA, 365 days)..."
  mkdir -p "$CERTS_DIR/ca"

  openssl genrsa -out "$CA_KEY" 4096 2>/dev/null
  openssl req -new -x509 -days 365 -key "$CA_KEY" -sha256 -out "$CA_CERT" \
    -subj "/C=BR/ST=SP/L=Sao Paulo/O=TecShop/OU=DevOps/CN=TecShop-CA" 2>/dev/null

  chmod 600 "$CA_KEY"
  chmod 644 "$CA_CERT"
  log_ok "CA ready at $CERTS_DIR/ca/"
}

# ── Service certificate ───────────────────────────────────────────────────────

generate_service_cert() {
  local service="$1"
  local service_dir="$CERTS_DIR/$service"
  local key_file="$service_dir/${service}-key.pem"
  local cert_file="$service_dir/${service}-cert.pem"
  local csr_file="$service_dir/${service}.csr"
  local ext_file="$service_dir/${service}-extensions.cnf"

  if [[ -f "$key_file" && -f "$cert_file" ]]; then
    log_warn "$service -- certificate already exists, skipping. Run --clean to regenerate."
    return
  fi

  log_info "Generating certificate: $service"
  mkdir -p "$service_dir"

  openssl genrsa -out "$key_file" 4096 2>/dev/null

  openssl req \
    -subj "/C=BR/ST=SP/L=Sao Paulo/O=TecShop/OU=Services/CN=${service}" \
    -new -key "$key_file" \
    -out "$csr_file" 2>/dev/null

  cat >"$ext_file" <<EOF
[v3_req]
authorityKeyIdentifier = keyid,issuer
basicConstraints       = CA:FALSE
keyUsage               = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName         = @alt_names

[alt_names]
DNS.1 = ${service}
DNS.2 = localhost
DNS.3 = ${service}.tec-shop.svc.cluster.local
IP.1  = 127.0.0.1
IP.2  = ::1
EOF

  openssl x509 -req \
    -in "$csr_file" \
    -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial \
    -out "$cert_file" -days 365 \
    -extensions v3_req -extfile "$ext_file" 2>/dev/null

  rm -f "$csr_file" "$ext_file"

  chmod 600 "$key_file"
  chmod 644 "$cert_file"
  log_ok "$service"
}

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean_certs() {
  if [[ ! -d "$CERTS_DIR" ]]; then
    log_warn "$CERTS_DIR does not exist, nothing to remove."
    return
  fi
  log_info "Removing $CERTS_DIR ..."
  rm -rf "$CERTS_DIR"
  log_ok "Certificates removed."
}

# ── Help ──────────────────────────────────────────────────────────────────────

print_help() {
  cat <<EOF

Usage: $0 [OPTIONS]

Options:
  (no args)             Generate CA + all ${#DEFAULT_SERVICES[@]} service certificates
  --all                 Generate CA + all service certificates (explicit)
  --service <name>      Generate certificate for a specific service only
  --clean               Remove all certificates (deletes $CERTS_DIR/)
  --help                Print this help

Examples:
  $0                             # first-time setup
  $0 --service kafka-service     # add a single new service
  $0 --clean && $0               # full certificate rotation

Default services:
$(printf '  %s\n' "${DEFAULT_SERVICES[@]}")
EOF
}

# ── Entry point ───────────────────────────────────────────────────────────────

printf '\n'
printf '  ============================================================\n'
printf '   TecShop  --  mTLS Certificate Generator\n'
printf '  ============================================================\n'
printf '\n'

if [[ $# -eq 0 ]]; then
  create_ca
  for svc in "${DEFAULT_SERVICES[@]}"; do
    generate_service_cert "$svc"
  done
  printf '\n'
  log_ok "All certificates ready at $CERTS_DIR/"
  printf '\n'
  exit 0
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
  --service)
    [[ -z "${2:-}" ]] && {
      log_error "--service requires a service name argument."
      exit 1
    }
    create_ca
    generate_service_cert "$2"
    shift 2
    ;;
  --all)
    create_ca
    for svc in "${DEFAULT_SERVICES[@]}"; do
      generate_service_cert "$svc"
    done
    shift
    ;;
  --clean)
    clean_certs
    exit 0
    ;;
  --help)
    print_help
    exit 0
    ;;
  *)
    log_error "Unknown option: $1"
    print_help
    exit 1
    ;;
  esac
done

printf '\n'
log_ok "All requested certificates generated at $CERTS_DIR/"
printf '\n'
