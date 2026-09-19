FROM node:24-alpine AS base


WORKDIR /app
COPY package.json .
RUN corepack enable pnpm && pnpm install

FROM base AS builder

WORKDIR /app
COPY --from=base /app/ .

COPY . .

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD [ "node", "src/index.js" ]
