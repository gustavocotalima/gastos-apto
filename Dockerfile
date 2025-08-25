# Debug Dockerfile to investigate package.json issue
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy files first
COPY . .

# Debug: List all files and check package.json
RUN echo "=== DEBUGGING PACKAGE.JSON ISSUE ==="
RUN echo "Current directory:" && pwd
RUN echo "All files in directory:" && ls -la
RUN echo "Checking if package.json exists:" && test -f package.json && echo "EXISTS" || echo "NOT FOUND"
RUN echo "Checking if pnpm-lock.yaml exists:" && test -f pnpm-lock.yaml && echo "EXISTS" || echo "NOT FOUND"
RUN echo "Package.json contents:" && cat package.json || echo "FAILED TO READ"
RUN echo "Package.json file info:" && file package.json || echo "NO FILE INFO"
RUN echo "=== END DEBUGGING ==="

# Try to run pnpm install
RUN pnpm install

# Build the app
RUN pnpm prisma generate && pnpm build

# Expose port
EXPOSE 3000

# Create startup script that runs migrations and starts the app
RUN echo '#!/bin/sh\npnpm prisma migrate deploy\npnpm start' > start.sh && chmod +x start.sh

# Start command
CMD ["./start.sh"]