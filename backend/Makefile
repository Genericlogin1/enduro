.PHONY: run build test lint migrate-up migrate-down docker-up docker-down tidy

# Default DB URL for local development
DB_URL ?= postgres://enduro:enduro_secret@localhost:5432/enduro_db?sslmode=disable

run:
	go run ./cmd/api/...

build:
	go build -ldflags="-s -w" -o ./bin/api ./cmd/api

test:
	go test -v -race ./...

test-cover:
	go test -v -race -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

lint:
	golangci-lint run ./...

tidy:
	go mod tidy

migrate-up:
	migrate -path ./migrations -database "$(DB_URL)" up

migrate-down:
	migrate -path ./migrations -database "$(DB_URL)" down

migrate-create:
	@read -p "Migration name: " name; \
	migrate create -ext sql -dir ./migrations -seq $$name

docker-up:
	docker-compose up --build -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f api

docker-reset:
	docker-compose down -v
	docker-compose up --build -d

.DEFAULT_GOAL := run
