# Makefile for Gastos Apto Docker Management

.PHONY: help up down restart logs tunnel clean build dev prod

# Colors for output
YELLOW := \033[1;33m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo '$(YELLOW)Available commands:$(NC)'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# Docker Commands
up: ## Start all services with Docker Compose
	@echo '$(YELLOW)Starting Docker services...$(NC)'
	docker-compose up -d
	@echo '$(GREEN)Services started!$(NC)'
	@echo 'App: http://localhost:3000'
	@echo 'Database: localhost:5432'

down: ## Stop all services
	@echo '$(YELLOW)Stopping Docker services...$(NC)'
	docker-compose down
	@echo '$(GREEN)Services stopped!$(NC)'

restart: down up ## Restart all services

logs: ## Show logs from all services
	docker-compose logs -f

logs-app: ## Show logs from app service only
	docker-compose logs -f app

logs-db: ## Show logs from database service only
	docker-compose logs -f postgres

build: ## Build Docker images
	@echo '$(YELLOW)Building Docker images...$(NC)'
	docker-compose build --no-cache
	@echo '$(GREEN)Build complete!$(NC)'

clean: ## Clean up Docker resources
	@echo '$(YELLOW)Cleaning Docker resources...$(NC)'
	docker-compose down -v
	docker system prune -f
	@echo '$(GREEN)Cleanup complete!$(NC)'

# Database Commands
db-migrate: ## Run database migrations
	docker-compose exec app pnpm prisma migrate deploy

db-seed: ## Seed the database
	docker-compose exec app pnpm prisma db seed

db-studio: ## Open Prisma Studio
	docker-compose exec app pnpm prisma studio

db-reset: ## Reset database (WARNING: Destroys all data)
	@echo '$(RED)WARNING: This will destroy all data!$(NC)'
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose exec app pnpm prisma migrate reset --force; \
	fi

# Tunnel Commands
tunnel-cloudflare: ## Start Cloudflare tunnel
	@echo '$(YELLOW)Starting Cloudflare tunnel...$(NC)'
	@./scripts/tunnel-manager.sh

tunnel-ngrok: ## Start Ngrok tunnel
	@echo '$(YELLOW)Starting Ngrok tunnel...$(NC)'
	@TUNNEL_TYPE=ngrok ./scripts/tunnel-manager.sh

# Development Commands
dev: ## Start development environment
	pnpm run dev

prod: up ## Start production environment with Docker

# Network Commands
network-create: ## Create Docker network with fixed subnet
	@echo '$(YELLOW)Creating Docker network...$(NC)'
	docker network create --driver bridge \
		--subnet=172.20.0.0/24 \
		--gateway=172.20.0.1 \
		gastos_network || true
	@echo '$(GREEN)Network created!$(NC)'

network-info: ## Show network information
	@echo '$(YELLOW)Network Information:$(NC)'
	@docker network inspect gastos_network 2>/dev/null || echo "Network not found. Run 'make network-create' first."

# Status Commands
status: ## Show status of all services
	@echo '$(YELLOW)Service Status:$(NC)'
	@docker-compose ps

ip: ## Show container IP addresses
	@echo '$(YELLOW)Container IP Addresses:$(NC)'
	@docker inspect -f '{{.Name}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $$(docker ps -q) 2>/dev/null || echo "No containers running"

# Quick Commands
quick-start: network-create up ## Quick start with network setup
	@echo '$(GREEN)Application is ready!$(NC)'
	@echo 'Access at: http://localhost:3000'

tunnel-status: ## Check tunnel status
	@if [ -f .tunnel-url ]; then \
		echo '$(GREEN)Tunnel URL:$(NC) $$(cat .tunnel-url)'; \
	else \
		echo '$(YELLOW)No tunnel active$(NC)'; \
	fi