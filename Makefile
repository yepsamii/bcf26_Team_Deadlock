DBSTRING ?= postgresql://postgres:postgres123@47.128.225.20:5432/postgres?sslmode=disable

.PHONY: up build down migrate-up migrate-down migrate-version

# Docker Compose commands
up:
	docker compose up -d

build:
	docker compose up --build -d

down:
	docker compose down

# Database Migration commands
migrate-up:
	@echo "Running migrations up..."
	cd db && DBSTRING=$(DBSTRING) go run migrate.go up

migrate-down:
	@echo "Rolling back migrations..."
	cd db && DBSTRING=$(DBSTRING) go run migrate.go down

migrate-version:
	@echo "Checking migration version..."
	cd db && DBSTRING=$(DBSTRING) go run migrate.go version
