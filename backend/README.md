# Enduro World — Go Backend

Production-ready Go backend for the Enduro World social platform. Built with Clean Architecture and modular monolith principles.

## Architecture

```
backend/
├── cmd/api/           # Entry point
├── internal/
│   ├── app/           # App bootstrap (DI container)
│   ├── config/        # Configuration loading
│   ├── domain/        # Shared domain errors
│   ├── auth/          # Auth module (register/login/JWT)
│   ├── user/          # User CRUD module
│   ├── post/          # Social posts module
│   ├── route_module/  # Enduro trail routes module
│   ├── tour/          # Group rides / tours module
│   ├── delivery/
│   │   └── http/
│   │       ├── middleware/  # JWT, logger, error handler
│   │       └── route/       # Route registration
│   └── infrastructure/
│       └── postgres/    # DB pool, transaction manager
├── migrations/        # SQL migrations
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── .env.example
```

### Layer Dependencies

```
delivery → usecase → domain
infrastructure → usecase/domain
domain → (nothing)
```

Each module contains: entity, repository interface, usecase, repository impl, handler.

## Tech Stack

- **Go 1.22**
- **Fiber v2** — HTTP framework
- **PostgreSQL** — Database
- **pgxpool** — Connection pool
- **JWT** — Authentication (golang-jwt/jwt/v5)
- **bcrypt** — Password hashing
- **slog** — Structured logging
- **Docker + docker-compose**

## Quick Start

### 1. Prerequisites

- Go 1.22+
- Docker & docker-compose
- `migrate` CLI: `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest`

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run with Docker

```bash
make docker-up
```

This starts:
- PostgreSQL on port 5432
- API on port 8080
- Runs migrations automatically

### 4. Run Locally

```bash
# Start only postgres
docker-compose up postgres -d

# Run migrations
make migrate-up

# Start API
make run
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| APP_ENV | No | development | Application environment |
| HTTP_PORT | No | 8080 | HTTP server port |
| DATABASE_URL | Yes | — | PostgreSQL connection string |
| JWT_SECRET | Yes | — | JWT signing secret (min 32 chars) |
| JWT_ACCESS_TTL | No | 15m | JWT access token TTL |
| LOG_LEVEL | No | info | Log level (debug/info/warn/error) |
| SHUTDOWN_TIMEOUT | No | 30s | Graceful shutdown timeout |

## API Endpoints

### Health Check

```
GET /health
```

### Auth

```
POST /api/v1/auth/register
POST /api/v1/auth/login
```

### Users (requires JWT)

```
POST   /api/v1/users
GET    /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
```

### Posts

```
GET    /api/v1/posts          # public
GET    /api/v1/posts/:id      # public
POST   /api/v1/posts          # auth required
PATCH  /api/v1/posts/:id      # auth required
DELETE /api/v1/posts/:id      # auth required
POST   /api/v1/posts/:id/like # auth required (toggles like)
```

### Routes (Enduro Trails)

```
GET    /api/v1/routes         # public, filter: ?country=&difficulty=
GET    /api/v1/routes/:id     # public
POST   /api/v1/routes         # auth required
PATCH  /api/v1/routes/:id     # auth required
DELETE /api/v1/routes/:id     # auth required
```

### Tours (Group Rides)

```
GET    /api/v1/tours          # public
GET    /api/v1/tours/:id      # public
POST   /api/v1/tours          # auth required
PATCH  /api/v1/tours/:id      # auth required
DELETE /api/v1/tours/:id      # auth required
```

## API Examples

### Register

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"rider@example.com","password":"password123","name":"Trail Rider"}'
```

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rider@example.com","password":"password123"}'
```

### Create Route

```bash
curl -X POST http://localhost:8080/api/v1/routes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Forest Trail Lviv",
    "description": "Technical singletrack through forest",
    "points": [{"lat":49.8397,"lng":24.0297},{"lat":49.8500,"lng":24.0400}],
    "distance_km": 12.5,
    "difficulty": "hard",
    "country": "Ukraine",
    "region": "Lviv"
  }'
```

### Error Response Format

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "user not found"
  }
}
```

## Migrations

```bash
# Run all migrations up
make migrate-up

# Rollback last migration
make migrate-down

# Create new migration
make migrate-create
```

## Tests

```bash
# Run all tests
make test

# Run with coverage
make test-cover
```

## Adding a New Module

1. Create `internal/<module>/` directory
2. Add `entity.go` — domain entity + Repository interface
3. Add `usecase.go` — business logic
4. Add `repository.go` — postgres implementation
5. Add `handler.go` — HTTP handlers + request/response DTOs
6. Register routes in `internal/delivery/http/route/routes.go`
7. Wire up dependencies in `internal/app/app.go`
8. Add migration in `migrations/`

## Make Commands

```bash
make run          # Run locally
make build        # Build binary
make test         # Run tests
make lint         # Run linter
make migrate-up   # Apply migrations
make migrate-down # Rollback migrations
make docker-up    # Start with Docker Compose
make docker-down  # Stop Docker Compose
```
