#!/bin/bash
set -euo pipefail

# =============================================================================
#  TecShop — Oracle Cloud Always Free k3s provisioning guide
#  Run this script ON the Oracle Cloud VM after SSH access is established.
#
#  Oracle Cloud Always Free tier specs (as of 2024):
#    Compute  : Ampere A1 — up to 4 OCPU cores, 24 GB RAM (ARM64)
#    Storage  : 200 GB block volume (boot)
#    Egress   : 10 TB/month
#    OS       : Ubuntu 22.04 / Oracle Linux 8 (recommended)
#
#  Prerequisites (local machine, done BEFORE running this script):
#    1. Create an Oracle Cloud account at cloud.oracle.com
#    2. Provision a free ARM VM instance (shape: VM.Standard.A1.Flex)
#    3. Open ports 22, 80, 443, 6443 in the Security List / NSG
#    4. Note your VM's public IP address
#    5. DNS: point *.tec-shop.example.com -> VM public IP (A record)
#       Use a free provider like Cloudflare, DuckDNS, or nip.io for testing
#
#  Usage:
#    scp infrastructure/scripts/setup-k3s.sh ubuntu@<VM_IP>:~/
#    ssh ubuntu@<VM_IP>
#    chmod +x ~/setup-k3s.sh && ~/setup-k3s.sh
# =============================================================================

DOMAIN="${DOMAIN:-tec-shop.example.com}"   # Override via: DOMAIN=mysite.com ./setup-k3s.sh
K3S_VERSION="v1.30.3+k3s1"               # Pin to a tested version

# ─── Step 1: System update ────────────────────────────────────────────────────

echo "[INFO] Updating system packages..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq

# ─── Step 2: Install k3s ──────────────────────────────────────────────────────
# Traefik is used as the ingress controller (built into k3s by default).
# ServiceLB (Klipper) handles LoadBalancer services for the single-node setup.

echo "[INFO] Installing k3s ${K3S_VERSION}..."
curl -sfL https://get.k3s.io | \
  INSTALL_K3S_VERSION="${K3S_VERSION}" \
  sh -s - server \
    --disable servicelb \
    --disable traefik \
    --write-kubeconfig-mode 644

echo "[ OK ] k3s installed"

# Make kubectl available without sudo
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown "$(id -u):$(id -g)" ~/.kube/config
export KUBECONFIG=~/.kube/config
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc

echo "[INFO] Waiting for k3s node to be ready..."
kubectl wait node --all --for=condition=Ready --timeout=120s

# ─── Step 3: Install Helm ─────────────────────────────────────────────────────

echo "[INFO] Installing Helm..."
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
echo "[ OK ] Helm $(helm version --short) installed"

# ─── Step 4: Install Nginx Ingress Controller ─────────────────────────────────

echo "[INFO] Installing nginx ingress controller..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.hostNetwork=true \
  --set controller.kind=DaemonSet \
  --wait --timeout 5m

echo "[ OK ] nginx ingress controller installed"

# ─── Step 5: Install cert-manager ─────────────────────────────────────────────

echo "[INFO] Installing cert-manager..."
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true \
  --wait --timeout 5m

echo "[ OK ] cert-manager installed"

# ─── Step 6: Bitnami repo (for local dev reference) ───────────────────────────
# Not needed on the demo server (Bitnami charts are disabled in values.demo.yaml)
# but useful to have for reference.

helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# ─── Step 7: Print next steps ─────────────────────────────────────────────────

PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "<PUBLIC_IP>")

echo ""
echo "============================================================"
echo " k3s is ready. Public IP: ${PUBLIC_IP}"
echo "============================================================"
echo ""
echo "NEXT STEPS (run from your LOCAL machine):"
echo ""
echo "  1. Copy kubeconfig to local machine:"
echo "     scp ubuntu@${PUBLIC_IP}:~/.kube/config ~/.kube/tec-shop-demo"
echo "     export KUBECONFIG=~/.kube/tec-shop-demo"
echo "     kubectl config rename-context default tec-shop-demo"
echo ""
echo "  2. Update DNS records:"
echo "     ${DOMAIN}           -> ${PUBLIC_IP}  (A)"
echo "     api.${DOMAIN}       -> ${PUBLIC_IP}  (A)"
echo "     seller.${DOMAIN}    -> ${PUBLIC_IP}  (A)"
echo "     admin.${DOMAIN}     -> ${PUBLIC_IP}  (A)"
echo ""
echo "  3. Apply Let's Encrypt ClusterIssuers:"
echo "     # Edit infrastructure/k8s/cert-manager/cluster-issuer.yaml"
echo "     # Replace 'your-email@example.com' with your real email"
echo "     # Replace 'tec-shop.example.com' with your real domain"
echo "     kubectl apply -f infrastructure/k8s/cert-manager/cluster-issuer.yaml"
echo ""
echo "  4. Create Kubernetes namespace and secrets:"
echo "     kubectl apply -f infrastructure/k8s/namespaces/tec-shop.yaml"
echo "     ./infrastructure/scripts/create-k8s-secrets.sh demo"
echo ""
echo "  5. Generate and push mTLS certs secret:"
echo "     ./generate-certs.sh --all"
echo "     # (create-k8s-secrets.sh handles packaging certs into tec-shop-certs)"
echo ""
echo "  6. Update values.demo.yaml with your real domain and GitHub username."
echo "     Then deploy:"
echo "     pnpm k8s:deploy:demo"
echo "     # Or with a specific image tag:"
echo "     ./infrastructure/scripts/deploy.sh demo \$(git rev-parse --short HEAD)"
echo ""
echo "  7. Verify:"
echo "     kubectl get pods -n tec-shop"
echo "     kubectl get ingress -n tec-shop"
echo "     curl -k https://api.${DOMAIN}/health"
echo ""
echo "NOTE: TLS certificate issuance takes 1-3 minutes after first deployment."
echo "      Check progress: kubectl describe certificate -n tec-shop"
echo "============================================================"
