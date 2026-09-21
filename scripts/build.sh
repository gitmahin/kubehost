docker build -t dockermahin/kubehost-server:latest -f ./apps/server/Dockerfile .

docker build \
  --build-arg VITE_API_SERVER_URL=http://kubehost.duckdns.org:3000/api \
  -t dockermahin/kubehost-client:latest -f ./apps/web/Dockerfile .

