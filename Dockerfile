# syntax=docker/dockerfile:1
# Canonical Next.js + Prisma multi-stage build
# https://nextjs.org/docs/app/getting-started/deploying#docker

# -----------------------------------------------------------------------------
# Stage 1: deps — install full deps for the build step
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat && npm install -g pnpm@10

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: builder — generate Prisma client and build Next.js standalone
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@10

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Bypass runtime env validation during next build — route modules import
# src/lib/env.ts which would otherwise fail without real secrets. Runtime
# validation (container start) remains strict because this flag is only
# set in the builder stage, not the runner.
ENV SKIP_ENV_VALIDATION=true

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time.
# NEXT_PUBLIC_APP_URL is required by src/lib/auth-client.ts.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm prisma generate && pnpm build

# -----------------------------------------------------------------------------
# Stage 3: runner — minimal runtime image, non-root, healthcheck
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs \
 && apk add --no-cache wget \
 && npm install -g pnpm@10

# Prisma CLI + dotenv live in a separate prefix to avoid pnpm's
# symlinked node_modules from the builder stage (not transplantable).
# `node-linker=hoisted` makes pnpm produce a flat, copy-safe node_modules
# like npm — the pnpm-native way to get a portable runtime install.
RUN mkdir -p /app/prisma-runtime \
 && cd /app/prisma-runtime \
 && echo '{"name":"prisma-runtime","version":"1.0.0","private":true}' > package.json \
 && pnpm add --config.node-linker=hoisted --prod \
      prisma@7.1.0 dotenv@17.2.3 \
 && chown -R nextjs:nodejs /app

# Next.js standalone output ships the minimal server.js + traced deps.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma migrate deploy at container start needs schema, migrations,
# and the config file. The CLI + dotenv came from the pnpm install
# into /app/prisma-runtime above.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["sh", "-c", "NODE_PATH=/app/prisma-runtime/node_modules /app/prisma-runtime/node_modules/.bin/prisma migrate deploy && node server.js"]
