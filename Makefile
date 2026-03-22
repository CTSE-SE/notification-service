SHELL := /bin/sh

COMPOSE ?= docker compose

.PHONY: help install docker-up docker-down docker-logs localstack-init start dev test lint lint-fix

help:
	@echo "Available commands:"
	@echo "  make install         Install npm dependencies"
	@echo "  make docker-up       Start notification-service, PostgreSQL, and LocalStack"
	@echo "  make docker-down     Stop and remove docker services"
	@echo "  make docker-logs     Tail docker service logs"
	@echo "  make localstack-init Run LocalStack init script manually"
	@echo "  make start           Start service (production mode)"
	@echo "  make dev             Start service in dev mode"
	@echo "  make test            Run tests"
	@echo "  make lint            Run linter"
	@echo "  make lint-fix        Run linter with auto-fix"

install:
	npm install

docker-up:
	$(COMPOSE) up -d --build

docker-down:
	$(COMPOSE) down

docker-logs:
	$(COMPOSE) logs -f --tail=100

localstack-init:
	$(COMPOSE) exec localstack sh /etc/localstack/init/ready.d/init.sh

start:
	npm start

dev:
	npm run dev

test:
	npm test

lint:
	npm run lint

lint-fix:
	npm run lint:fix
