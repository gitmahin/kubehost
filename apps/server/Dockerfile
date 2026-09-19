FROM node:24-alpine AS base


# ******************************INSTALLATION**************************************
FROM base AS installer

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* ./

# Install project dependencies with frozen lockfile for reproducible builds
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/local/share/.cache/yarn \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
  if [ -f package-lock.json ]; then \
    npm ci --no-audit --no-fund; \
  elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn install --frozen-lockfile --production=false; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

# ******************************BUILD THE APP*************************************
FROM base AS builder

WORKDIR /app

COPY --from=installer /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

# Build the "emails" workspace package first (if present)
RUN if [ -f package-lock.json ]; then \
    npm run build:package --workspace=emails; \
  elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn workspace emails run build:package; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm --filter emails run build:package; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

# Build the main app
RUN if [ -f package-lock.json ]; then \
    npm run build; \
  elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn build; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm build; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

# ******************************RUN THE APP***********************************
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 express

COPY --from=builder --chown=express:nodejs  /app/package*.json .
COPY --from=builder --chown=express:nodejs  /app/node_modules ./node_modules
COPY --from=builder --chown=express:nodejs  /app/emails/dist ./emails/dist
COPY --from=builder --chown=express:nodejs  /app/emails/node_modules ./emails/node_modules
COPY --from=builder --chown=express:nodejs  /app/emails/package*.json ./emails/
COPY --from=builder --chown=express:nodejs  /app/dist ./dist

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD [ "node", "dist/index.mjs" ]