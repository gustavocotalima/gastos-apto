# Production Dockerfile for gastos-apto (multi-stage)

# -----------------------------------------------------------------------------
# Stage 1: deps — install all dependencies (includes postinstall prisma generate)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm@10

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: builder — compile the Next.js app in production mode
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g pnpm@10

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm prisma generate && pnpm build

# -----------------------------------------------------------------------------
# Stage 3: runner — minimal runtime image, non-root, healthcheck
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN npm install -g pnpm@10 && apk add --no-cache wget

COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder --chown=node:node /app/prisma.config.ts ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/src/generated ./src/generated

RUN pnpm prune --prod && chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]
