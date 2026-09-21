docker stop minikube-port-80 2>/dev/null
docker rm minikube-port-80 2>/dev/null

# Delete the PREROUTING redirect rule
sudo iptables -t nat -D PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 30111 2>/dev/null

# Delete the OUTPUT loopback redirect rule
sudo iptables -t nat -D OUTPUT -p tcp -o lo --dport 80 -j REDIRECT --to-ports 30111 2>/dev/null

# Flush any remaining NAT PREROUTING rules (if needed)
sudo iptables -t nat -F PREROUTING 2>/dev/null

sudo netfilter-persistent save >/dev/null 2>&1 || true