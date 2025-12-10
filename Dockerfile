# Production Dockerfile for gastos-apto
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and prisma schema first for better caching
# (prisma generate runs in postinstall, so schema must be present)
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies (includes postinstall: prisma generate)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Generate Prisma client and build the app
RUN pnpm prisma generate && pnpm build

# Expose port
EXPOSE 3000

# Start command - run migrations then start app
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]
