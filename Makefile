# Cactoide Makefile
# Database and application management commands

.PHONY: help migrate-up migrate-down db-reset dev build test

# Default target
help:
	@echo "Available commands:"
	@echo "  migrate-up      - Apply invite-only events migration"
	@echo "  migrate-down    - Rollback invite-only events migration"
	@echo "  db-reset        - Reset database to initial state"
	@echo "  dev             - Start development server"
	@echo "  build           - Build the application"
	@echo "  test            - Run tests"

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

# Reset database to initial state
db-reset:
	@echo "Resetting database..."
	@psql "$(DB_URL)" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"
	@psql "$(DB_URL)" -f database/init.sql
	@echo "Database reset complete!"

# Development server
dev:
	@echo "Starting development server..."
	npm run dev

# Build application
build:
	@echo "Building application..."
	npm run build

# Run tests
test:
	@echo "Running tests..."
	npm run test

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install

# Docker commands
docker-build:
	@echo "Building Docker image..."
	docker build -t cactoide .

docker-run:
	@echo "Running Docker container..."
	docker run -p 3000:3000 cactoide

# Database setup for development
db-setup: install db-reset migrate-up
	@echo "Database setup complete!"

# Full development setup
setup: install db-setup
	@echo "Development environment ready!"
	@echo "Run 'make dev' to start the development server"