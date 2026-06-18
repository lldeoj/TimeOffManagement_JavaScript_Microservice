.PHONY: help setup start stop restart logs clean test test-local test-docker test-coverage test-watch test-unit test-integration

help:
	@echo "Time-Off Microservice - Available Commands"
	@echo ""
	@echo "Services Management:"
	@echo "  make setup          - Build all Docker images"
	@echo "  make start          - Start all services (background)"
	@echo "  make stop           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - Show live logs from all services"
	@echo "  make logs-api       - Show Publisher API logs"
	@echo "  make logs-consumer  - Show Consumer Service logs"
	@echo "  make logs-rabbitmq  - Show RabbitMQ logs"
	@echo "  make logs-mongodb   - Show MongoDB logs"
	@echo "  make clean          - Remove all containers and volumes"
	@echo "  make ps             - List running services"
	@echo "  make health         - Check health of all services"
	@echo "  make shell-api      - Open shell in Publisher API container"
	@echo "  make shell-consumer - Open shell in Consumer Service container"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run all tests locally"
	@echo "  make test-local     - Run tests locally (same as test)"
	@echo "  make test-docker    - Run tests in Docker containers"
	@echo "  make test-coverage  - Generate coverage reports"
	@echo "  make test-watch     - Run tests in watch mode"
	@echo "  make test-unit      - Run unit tests only"
	@echo "  make test-integration - Run integration tests only"

setup:
	@echo "Building Docker images..."
	docker-compose build

start:
	@echo "Starting all services..."
	docker-compose up -d
	@sleep 3
	@echo "✓ Services started successfully"
	@echo "Publisher API: http://localhost:3000"
	@echo "RabbitMQ UI: http://localhost:15672 (guest:guest)"
	@echo "MongoDB: mongodb://admin:password@localhost:27017"

stop:
	@echo "Stopping all services..."
	docker-compose down

restart: stop start

logs:
	docker-compose logs -f

logs-api:
	docker-compose logs -f publisher-api

logs-consumer:
	docker-compose logs -f consumer-service

logs-rabbitmq:
	docker-compose logs -f rabbitmq

logs-mongodb:
	docker-compose logs -f mongodb

clean:
	@echo "Removing all containers and volumes..."
	docker-compose down -v
	@echo "✓ Cleanup complete"

ps:
	@echo "Running services:"
	docker-compose ps

health:
	@echo "Checking service health..."
	@echo ""
	@echo "Publisher API:"
	@curl -s http://localhost:3000/health | jq . || echo "  ✗ Not responding"
	@echo ""
	@echo "RabbitMQ:"
	@curl -s -u guest:guest http://localhost:15672/api/aliveness-test/% | jq . || echo "  ✗ Not responding"
	@echo ""
	@echo "MongoDB:"
	@docker exec mongodb-server mongosh -u admin -p password --authenticationDatabase admin --eval "db.adminCommand('ping')" 2>/dev/null || echo "  ✗ Not responding"

shell-api:
	docker exec -it publisher-api-server sh

shell-consumer:
	docker exec -it consumer-service-worker sh

test-create:
	@echo "Testing: Create time-off request..."
	@curl -X POST http://localhost:3000/api/time-off \
		-H "Content-Type: application/json" \
		-H "x-employee-id: test-emp-001" \
		-d '{"start_date":"2024-03-15T00:00:00Z","end_date":"2024-03-22T00:00:00Z","reason":"Test vacation","type":"vacation"}' | jq .

test-list:
	@echo "Testing: List time-off requests..."
	@curl http://localhost:3000/api/time-off \
		-H "x-employee-id: test-emp-001" | jq .

test-health:
	@echo "Testing: Health check..."
	@curl http://localhost:3000/health | jq .

# Testing targets
test: test-local

test-local:
	@echo "Running tests locally..."
	@bash run-tests.sh local

test-docker:
	@echo "Running tests in Docker..."
	@bash run-tests.sh docker

test-coverage:
	@echo "Generating coverage reports..."
	@bash run-tests.sh coverage

test-watch:
	@echo "Running tests in watch mode..."
	@bash run-tests.sh watch

test-unit:
	@echo "Running unit tests..."
	@bash run-tests.sh unit

test-integration:
	@echo "Running integration tests..."
	@bash run-tests.sh integration

.DEFAULT_GOAL := help
