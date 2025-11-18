#!/usr/bin/env bash
set -euo pipefail

# ========================
# mTLS Certificate Generator
# ========================

# Colors
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

CERTS_DIR="./certs"
CA_KEY="$CERTS_DIR/ca/ca-key.pem"
CA_CERT="$CERTS_DIR/ca/ca-cert.pem"

# ========================
# Helper Functions
# ========================

print_help() {
  echo -e "${YELLOW}Usage:${NC} $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --service <name>   Generate certificates for a single service"
  echo "  --all              Generate certificates for all default services"
  echo "  --clean            Remove all certificates"
  echo "  --help             Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --service order-product"
  echo "  $0 --all"
}

create_ca() {
  if [[ -f "$CA_KEY" && -f "$CA_CERT" ]]; then
    echo -e "${YELLOW} CA already exists, skipping generation.${NC}"
    return
  fi

  echo -e "${GREEN} Generating CA...${NC}"
  mkdir -p "$CERTS_DIR/ca"

  openssl genrsa -out "$CA_KEY" 4096
  openssl req -new -x509 -days 365 -key "$CA_KEY" -sha256 -out "$CA_CERT" \
    -subj "/C=BR/ST=SP/L=São Paulo/O=TecShop/OU=DevOps/CN=TecShop-CA"

  chmod 600 "$CA_KEY"
  chmod 644 "$CA_CERT"
  echo -e "${GREEN} CA generated successfully.${NC}"
}

generate_service_cert() {
  local service=$1
  echo -e "${GREEN} Generating certificate for service: ${service}${NC}"

  local service_dir="$CERTS_DIR/$service"
  mkdir -p "$service_dir"

  # Generate private key
  openssl genrsa -out "$service_dir/${service}-key.pem" 4096

  # Generate CSR
  openssl req -subj "/C=BR/ST=SP/L=São Paulo/O=TecShop/OU=Services/CN=${service}" \
    -new -key "$service_dir/${service}-key.pem" \
    -out "$service_dir/${service}.csr"

  # Create extensions file
  local ext_file="$service_dir/${service}-extensions.cnf"
  cat >"$ext_file" <<EOF
[v3_req]
authorityKeyIdentifier = keyid,issuer
basicConstraints = CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${service}
DNS.2 = localhost
DNS.3 = ${service}.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

  # Generate certificate signed by CA
  openssl x509 -req -in "$service_dir/${service}.csr" \
    -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial \
    -out "$service_dir/${service}-cert.pem" -days 365 \
    -extensions v3_req -extfile "$ext_file"

  # Clean up CSR and extension file
  rm "$service_dir/${service}.csr" "$ext_file"

  chmod 600 "$service_dir/${service}-key.pem"
  chmod 644 "$service_dir/${service}-cert.pem"

  echo -e "${GREEN}✅ Certificate for ${service} generated.${NC}"
}

clean_certs() {
  echo -e "${RED} Removing all certificates...${NC}"
  rm -rf "$CERTS_DIR"
  echo -e "${GREEN} All certificates removed.${NC}"
}

# ========================
# Main Script
# ========================

if [[ $# -eq 0 ]]; then
  print_help
  exit 1
fi

create_ca

DEFAULT_SERVICES=("api-gateway" "auth-service" "user-service" "seller-service" "product-service" "order-service" "admin-service")

while [[ $# -gt 0 ]]; do
  case $1 in
  --service)
    SERVICE_NAME="$2"
    generate_service_cert "$SERVICE_NAME"
    shift 2
    ;;
  --all)
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
    echo -e "${RED} Unknown option: $1${NC}"
    print_help
    exit 1
    ;;
  esac
done

echo -e "${GREEN}🎉 All requested certificates generated successfully!${NC}"
echo -e "📂 Certificates location: ${CERTS_DIR}/"
