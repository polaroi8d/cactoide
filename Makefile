.PHONY: help build up down db-only logs db-clean prune i18n lint format migrate-up migrate-down

# Database connection variables
DB_HOST ?= localhost
DB_PORT ?= 5432
DB_NAME ?= cactoide_database
DB_USER ?= cactoide
DB_PASSWORD ?= cactoide_password

# Migration variables
MIGRATIONS_DIR = database/migrations

# Database connection string
DB_URL = postgresql://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)

help:
	@echo "Available commands:"
	@echo "  build           - Docker build the application"
	@echo "  up              - Start all services"
	@echo "  down            - Stop all services"
	@echo "  db-only         - Start only the database"
	@echo "  logs            - Show logs from all services"
	@echo "  db-clean        - Clean up all Docker resources"
	@echo "  prune           - Clean up everything (containers, images, volumes)"
	@echo "  i18n            - Validate translation files"
	@echo "  lint            - Lint the project"
	@echo "  format          - Format the project"
	@echo "  migrate-up      - Apply invite-only events migration"
	@echo "  migrate-down    - Rollback invite-only events migration"

# Apply invite-only events migration
migrate-up:
	@echo "Applying invite-only events migration..."
	@if [ -f "$(MIGRATIONS_DIR)/20241220_001_add_invite_only_events.sql" ]; then \
		psql "$(DB_URL)" -f "$(MIGRATIONS_DIR)/20241220_001_add_invite_only_events.sql" && \
		echo "Migration applied successfully!"; \
	else \
		echo "Migration file not found: $(MIGRATIONS_DIR)/20241220_001_add_invite_only_events.sql"; \
		exit 1; \
	fi

# Rollback invite-only events migration
migrate-down:
	@echo "Rolling back invite-only events migration..."
	@if [ -f "$(MIGRATIONS_DIR)/20241220_001_add_invite_only_events_rollback.sql" ]; then \
		psql "$(DB_URL)" -f "$(MIGRATIONS_DIR)/20241220_001_add_invite_only_events_rollback.sql" && \
		echo "Migration rolled back successfully!"; \
	else \
		echo "Rollback file not found: $(MIGRATIONS_DIR)/20241220_001_add_invite_only_events_rollback.sql"; \
		exit 1; \
	fi

# Build the Docker images
build:
	@echo "Building Docker images..."
	docker compose build

# Start all services
up:
	@echo "Starting all services..."
	docker compose up -d

down:
	@echo "Stopping all services..."
	docker compose down

db-clean:
	@echo "Cleaning up all Docker resources..."
	docker stop cactoide-db && docker rm cactoide-db && docker volume prune -f && docker network prune -f

# Start only the database
db-only:
	@echo "Starting only the database..."
	docker compose up -d postgres

# Show logs from all services
logs:
	@echo "Showing logs from all services..."
	docker compose logs -f



# Clean up everything (containers, images, volumes)
prune:
	@echo "Cleaning up all Docker resources..."
	docker compose down -v --rmi all


lint:
	@echo "Linting the project..."
	npm run lint

format:
	@echo "Formatting the project..."
	npm run format

#TODO: not working yet
i18n:
	@echo "Validating translation files..."
	@if [ -n "$(FILE)" ]; then \
		./scripts/i18n-check.sh $(FILE); \
