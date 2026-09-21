#!/usr/bin/env bash
set -e

isNatReset=false
isReCreateContainers=false
apiServer=""
showHelp=false

# Parse positional arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --nat-reset)
            isNatReset=true
            shift
            ;;
        --re-create)
            isReCreateContainers=true
            shift
            ;;
        --api-server)
            if [[ -n "$2" && "$2" != --* ]]; then
                apiServer="$2"
                shift 2
            else
                echo "Error: Argument --api-server requires a non-empty value." >&2
                exit 1
            fi
            ;;
        --help|-h)
            showHelp=true
            shift
            ;;
        *)
            echo "Unknown argument: $1" >&2
            echo "Run 'kubehost --help' for usage information." >&2
            exit 1
            ;;
    esac
done

# Display Help Information
printHelp() {

    echo "KUBEHOST CLI TOOL"
    echo "A Bash-based CLI tool for automated Depoylment Infrastructure setup."
    echo ""
    echo "Usage: kubehost [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --api-server <url>    Specify the API server URL for the web client container."
    echo "  --re-create           Clean up existing K8s resources, re-generate tokens, and restart containers."
    echo "  --nat-reset           Clear iptables NAT rules, stop proxy containers, and reset routing."
    echo "  --help, -h            Display this help message and exit."
    echo ""
    echo "Examples:"
    echo "  kubehost --api-server https://<domain.com>:3000/api"
    echo "  kubehost --re-create --api-server https://<domain.com>:3000/api"
    echo "  kubehost --nat-reset"
}

if [[ "$showHelp" = true ]]; then
    printHelp
    exit 0
fi

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

createContainers() {
  local apiServerUrl="$1"

  if [[ -z "$apiServerUrl" ]]; then
    echo "Error: --api-server is required when creating or re-creating containers." >&2
    exit 1
  fi

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

  docker rmi -f dockermahin/kubehost-server:latest 2>/dev/null || true
  docker rmi -f dockermahin/kubehost-client:latest 2>/dev/null || true

  echo "Running Api Server..."

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
    -e NITRO_PUBLIC_API_SERVER_URL="$apiServerUrl" \
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

# Execution Flow

actionExecuted=false

if [[ "$isNatReset" = true ]]; then
  natReset
  actionExecuted=true
fi

if [[ "$isReCreateContainers" = true || -n "$apiServer" ]]; then
  createContainers "$apiServer"
  actionExecuted=true
fi

if [[ "$actionExecuted" = false ]]; then
  echo "Error: Missing required arguments."
  echo "Run 'kubehost --help' for usage instructions."
  exit 1
fi