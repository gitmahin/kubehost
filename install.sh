#!/usr/bin/env bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==> Installing KubeHost...${NC}"

# Check for root privileges (required for installing to /usr/bin)
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Please run this script with sudo or as root.${NC}"
  echo "Usage: curl -sSL https://raw.githubusercontent.com/gitmahin/kubehost/main/install.sh | sudo bash"
  exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Warning: Docker is not installed. KubeHost requires Docker to containerize applications.${NC}"
  read -p "Would you like to install Docker now? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    apt-get update && apt-get install -y docker.io
    systemctl enable --now docker
  else
    echo "Continuing installation without Docker..."
  fi
fi

# Check if Minikube is installed (since you use minikube kubectl)
if ! command -v minikube &> /dev/null; then
  echo -e "${YELLOW}Notice: Minikube is not detected on your system.${NC}"
  echo "KubeHost relies on Minikube for cluster management. You can install it later."
fi

# Download scripts.sh from your correct repository root (gitmahin)
REPO_RAW_URL="https://raw.githubusercontent.com/gitmahin/kubehost/main/scripts.sh"

echo "Downloading KubeHost script..."
if command -v curl &> /dev/null; then
  curl -sSL "$REPO_RAW_URL" -o /usr/bin/kubehost
elif command -v wget &> /dev/null; then
  wget -qO /usr/bin/kubehost "$REPO_RAW_URL"
else
  echo -e "${RED}Error: Neither curl nor wget is installed. Please install one and try again.${NC}"
  exit 1
fi

# Make it executable
chmod +x /usr/bin/kubehost

echo -e "${GREEN}==> KubeHost successfully installed!${NC}"
echo "Run 'kubehost --help' or start deploying your apps globally."
