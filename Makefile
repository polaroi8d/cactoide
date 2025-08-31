.PHONY: help build up db-only logs clean

# Default target
help:
	@echo "Cactoide Commands"
	@echo ""
	@echo "Main commands:"
	@echo "  make build    - Build the Docker images"
	@echo "  make up       - Start all services (database + app)"
	@echo ""
	@echo "Individual services:"
	@echo "  make db-only  - Start only the database"
	@echo ""
	@echo "Utility commands:"
	@echo "  make logs     - Show logs from all services"
	@echo "  make clean    - Remove all containers, images, and volumes"
	@echo "  make help     - Show this help message"

# Build the Docker images
build:
	@echo "Building Docker images..."
	docker compose build

# Start all services
up:
	@echo "Starting all services..."
	docker compose up -d

# Start only the database
db-only:
	@echo "Starting only the database..."
	docker compose up -d postgres

# Show logs from all services
logs:
	@echo "Showing logs from all services..."
	docker compose logs -f

# Clean up everything (containers, images, volumes)
clean:
	@echo "Cleaning up all Docker resources..."
	docker compose down -v --rmi all


