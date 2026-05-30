.PHONY: run build test lint migrate-up migrate-down docker-up docker-down tidy

DB_URL ?= $(shell grep DATABASE_URL .env 2>/dev/null | cut -d= -f2-)

run:
	go run ./cmd/server

build:
	go build -o bin/server ./cmd/server

test:
	go test ./... -v -race

lint:
	golangci-lint run ./...

tidy:
	go mod tidy

migrate-up:
	migrate -path ./migrations -database "$(DB_URL)" up

migrate-down:
	migrate -path ./migrations -database "$(DB_URL)" down 1

docker-up:
	docker compose -f deployments/docker-compose.yml up --build -d

docker-down:
	docker compose -f deployments/docker-compose.yml down
