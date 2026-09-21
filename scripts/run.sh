#!/usr/bin/env bash

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

docker run -p 3001:3000 --name kubehost-client --network minikube dockermahin/kubehost-client:latest 

minikube addons enable ingress

# Allow binding to ports down to 80 without root
sudo sysctl net.ipv4.ip_unprivileged_port_start=80

# Now run port-forward as normal ubuntu user
nohup minikube kubectl -- port-forward --address 0.0.0.0 -n ingress-nginx service/ingress-nginx-controller 80:80 > port-forward.log 2>&1 &
