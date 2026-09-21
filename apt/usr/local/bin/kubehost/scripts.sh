isNatReset=false
isReBuildImage=false
isReCreateContainers=false
domain=""

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

natReset() {
  docker stop minikube-port-80 2>/dev/null
  docker rm -f minikube-port-80 2>/dev/null

  # Delete the PREROUTING redirect rule
  sudo iptables -t nat -D PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 30111

  # Delete the OUTPUT loopback redirect rule
  sudo iptables -t nat -D OUTPUT -p tcp -o lo --dport 80 -j REDIRECT --to-ports 30111

  # Flush any remaining NAT PREROUTING rules (if needed)
  sudo iptables -t nat -F PREROUTING

  sudo netfilter-persistent save >/dev/null 2>&1 || true
}

buildImage() {
  docker rmi -f dockermahin/kubehost-server:latest 2>/dev/null
  docker rmi -f dockermahin/kubehost-client:latest 2>/dev/null

  docker build -t dockermahin/kubehost-server:latest -f ./apps/server/Dockerfile .
  docker build \
    --build-arg VITE_API_SERVER_URL=$1 \
    -t dockermahin/kubehost-client:latest -f ./apps/web/Dockerfile .
}

createContainers() {

  # Cleanup existing resources if they exist
  echo "Cleaning up existing resources if present..."
  minikube kubectl -- delete clusterrolebinding kubehost-sa-admin --ignore-not-found
  minikube kubectl -- delete serviceaccount kubehost-sa -n default --ignore-not-found

  sleep 1

  # re-create ServiceAccount
  echo "Creating ServiceAccount..."
  minikube kubectl -- create serviceaccount kubehost-sa -n default

  # re-create ClusterRoleBinding
  echo "Creating ClusterRoleBinding..."
  minikube kubectl -- create clusterrolebinding kubehost-sa-admin \
    --clusterrole=cluster-admin \
    --serviceaccount=default:kubehost-sa

  # generate new token
  echo "Generating token..."
  K8S_TOKEN=$(minikube kubectl -- create token kubehost-sa --duration=87600h -n default)

  # Print generated token
  echo -e "\n--- K8S_TOKEN ---"
  echo "$K8S_TOKEN"

  docker rm -f kubehost-server
  docker rm -f kubehost-client

  docker run -d \
    -p 3000:3000 \
    --name kubehost-server \
    --network minikube \
    -e K8S_SERVER=https://minikube:8443 \
    -e K8S_TOKEN="$K8S_TOKEN" \
    dockermahin/kubehost-server:latest

  docker run -d -p 3001:3000 --name kubehost-client --network minikube dockermahin/kubehost-client:latest 

  if minikube addons list | grep -q "| ingress .*| enabled ✅"; then
    echo "Ingress controller already configured ✅"
  else
    minikube addons enable ingress
  fi

  # Allow binding to ports down to 80 without root
  sudo sysctl net.ipv4.ip_unprivileged_port_start=80

  # Now run port-forward as normal ubuntu user
  nohup minikube kubectl -- port-forward --address 0.0.0.0 -n ingress-nginx service/ingress-nginx-controller 80:80 > port-forward.log 2>&1 &

}

if $isNatReset; then
  natReset
fi

if [["$isReBuildImage" = true && -n "$domain"]]; then
  buildImage "$domain"
  createContainers

  else
    echo "Build need domain parameter"
fi

if $isReCreateContainers; then
  natReset
  createContainers
fi

if [[ "$isReCreateContainers" = false && "$isReBuildImage" = false && "$isNatReset" = false && -n "$domain" ]]; then
  natReset
  buildImage "$domain"
  createContainers
fi