.PHONY: help install lint lint-backend lint-frontend format test test-unit test-integration test-api test-frontend test-all docker-build docker-up docker-down clean pre-commit

SHELL := /bin/bash

# ──────────────────────────────────────────────
# Help
# ──────────────────────────────────────────────
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ──────────────────────────────────────────────
# Setup
# ──────────────────────────────────────────────
install: ## Install all dependencies
	pip install -r backend/requirements.txt
	pip install pytest pytest-cov pytest-asyncio pytest-xdist httpx ruff pre-commit
	cd frontend/rag-ui-new && npm ci
	pre-commit install

# ──────────────────────────────────────────────
# Linting & Formatting
# ──────────────────────────────────────────────
lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Lint backend Python code
	ruff check backend/
	ruff format --check backend/

lint-frontend: ## Lint frontend code
	cd frontend/rag-ui-new && npm run lint

format: ## Auto-format all code
	ruff format backend/
	ruff check --fix backend/

# ──────────────────────────────────────────────
# Testing
# ──────────────────────────────────────────────
test: test-unit ## Run fast tests (unit only)

test-unit: ## Run backend unit tests
	cd backend && python -m pytest tests/unit/ -v --tb=short -m "unit or not (integration or e2e or api)"

test-api: ## Run backend API tests (requires PostgreSQL)
	cd backend && python -m pytest tests/api/ -v --tb=short

test-integration: ## Run integration tests (requires PostgreSQL + Qdrant)
	cd backend && python -m pytest tests/integration/ -v --tb=short -m integration

test-frontend: ## Run frontend tests
	cd frontend/rag-ui-new && npm run test:ci

test-all: test-unit test-api test-integration test-frontend ## Run all tests

test-coverage: ## Run tests with coverage report
	cd backend && python -m pytest tests/ -v --cov=app --cov-report=html --cov-report=term-missing
	@echo "Coverage report: backend/htmlcov/index.html"

# ──────────────────────────────────────────────
# Docker
# ──────────────────────────────────────────────
docker-build: ## Build all Docker images
	docker compose build

docker-up: ## Start all services
	docker compose up -d

docker-down: ## Stop all services
	docker compose down

docker-logs: ## Tail service logs
	docker compose logs -f --tail=50

# ──────────────────────────────────────────────
# Pre-commit
# ──────────────────────────────────────────────
pre-commit: ## Run pre-commit on all files
	pre-commit run --all-files

# ──────────────────────────────────────────────
# Cleanup
# ──────────────────────────────────────────────
clean: ## Remove build artifacts and caches
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find backend -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/htmlcov backend/.coverage backend/coverage-*.xml
	rm -rf frontend/rag-ui-new/coverage frontend/rag-ui-new/dist
	@echo "Cleaned build artifacts"
