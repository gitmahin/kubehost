docker build -t dockermahin/kubehost-server:latest -f ./apps/server/Dockerfile .
docker build -t dockermahin/kubehost-client:latest -f ./apps/web/Dockerfile .

