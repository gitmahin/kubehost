#!/usr/bin/env bash
set -e

isNatReset=false
isReBuildImage=false
isReCreateContainers=false
domain=""

# Parse positional arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --nat-reset)
            isNatReset=true
            shift
            ;;
        --re-build)
            isReBuildImage=true
            shift
            ;;
        --re-create)
            isReCreateContainers=true
            shift
            ;;
        --domain)
            if [[ -n "$2" && "$2" != --* ]]; then
                domain="$2"
                shift 2
            else
                echo "Error: Argument --domain requires a non-empty value." >&2
                exit 1
            fi
            ;;
        *)
            echo "Unknown argument: $1" >&2
            shift
            ;;
    esac
done

# Check if Minikube host is actually running
echo "Checking Minikube status..."
if minikube status 2>/dev/null | grep -q "host: Running"; then
    echo "Minikube is running."
else
    echo "Minikube is stopped or not running. Starting Minikube with Docker driver..."
    minikube start --vm-driver=docker
fi

natReset() {
  echo "Clearing NAT rules and proxy containers..."
  docker stop minikube-port-80 2>/dev/null || true
  docker rm -f minikube-port-80 2>/dev/null || true

  # Delete the PREROUTING redirect rule
  sudo iptables -t nat -D PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 30111 2>/dev/null || true

  # Delete the OUTPUT loopback redirect rule
  sudo iptables -t nat -D OUTPUT -p tcp -o lo --dport 80 -j REDIRECT --to-ports 30111 2>/dev/null || true

  # Flush any remaining NAT PREROUTING rules
  sudo iptables -t nat -F PREROUTING 2>/dev/null || true

  sudo netfilter-persistent save >/dev/null 2>&1 || true
}

buildImage() {
  local targetDomain="$1"
  echo "Building Docker images for domain: '${targetDomain}'..."

  docker rmi -f dockermahin/kubehost-server:latest 2>/dev/null || true
  docker rmi -f dockermahin/kubehost-client:latest 2>/dev/null || true

  docker build -t dockermahin/kubehost-server:latest -f ./apps/server/Dockerfile .
  docker build \
    --build-arg VITE_API_SERVER_URL="${targetDomain}" \
    -t dockermahin/kubehost-client:latest -f ./apps/web/Dockerfile .
}

createContainers() {
  # Cleanup existing resources if they exist
  echo "Cleaning up existing Kubernetes resources if present..."
  minikube kubectl -- delete clusterrolebinding kubehost-sa-admin --ignore-not-found
  minikube kubectl -- delete serviceaccount kubehost-sa -n default --ignore-not-found

  sleep 1

  # Re-create ServiceAccount
  echo "Creating ServiceAccount..."
  minikube kubectl -- create serviceaccount kubehost-sa -n default

  # Re-create ClusterRoleBinding
  echo "Creating ClusterRoleBinding..."
  minikube kubectl -- create clusterrolebinding kubehost-sa-admin \
    --clusterrole=cluster-admin \
    --serviceaccount=default:kubehost-sa

  # Generate new token
  echo "Generating token..."
  K8S_TOKEN=$(minikube kubectl -- create token kubehost-sa --duration=87600h -n default)

  echo -e "\n--- K8S_TOKEN ---"
  echo "$K8S_TOKEN"

  docker rm -f kubehost-server 2>/dev/null || true
  docker rm -f kubehost-client 2>/dev/null || true

  echo "Running Docker containers..."
  docker run -d \
    -p 3000:3000 \
    --name kubehost-server \
    --network minikube \
    -e K8S_SERVER=https://minikube:8443 \
    -e K8S_TOKEN="$K8S_TOKEN" \
    dockermahin/kubehost-server:latest

  docker run -d \
    -p 3001:3000 \
    --name kubehost-client \
    --network minikube \
    dockermahin/kubehost-client:latest 

  if minikube addons list | grep -q "| ingress .*| enabled ✅"; then
    echo "Ingress controller already configured ✅"
  else
    echo "Enabling Ingress addon..."
    minikube addons enable ingress
  fi

  # Allow binding to ports down to 80 without root
  echo "Configuring unprivileged port binding..."
  sudo sysctl -w net.ipv4.ip_unprivileged_port_start=80 >/dev/null

  # Stop any active port forwards before launching a new one
  sudo pkill -f "port-forward" 2>/dev/null || true

  # Run port-forward as background nohup process
  echo "Starting background port-forwarding on port 80..."
  nohup minikube kubectl -- port-forward --address 0.0.0.0 -n ingress-nginx service/ingress-nginx-controller 80:80 > port-forward.log 2>&1 &
}

# --- Execution Flow ---

if [[ "$isNatReset" = true ]]; then
  natReset
fi

# Rebuild images
if [[ "$isReBuildImage" = true ]]; then
  if [[ -n "$domain" ]]; then
    buildImage "$domain"
    createContainers
  else
    echo "Error: Argument --re-build requires --domain <your-domain>." >&2
    exit 1
  fi

# Recreate containers without rebuilding images
elif [[ "$isReCreateContainers" = true ]]; then
  natReset
  createContainers

# Standard run when only --domain is passed
elif [[ -n "$domain" ]]; then
  natReset
  buildImage "$domain"
  createContainers

else
  echo "Usage: kubehost [--domain <domain>] [--re-build] [--re-create] [--nat-reset]"
fi