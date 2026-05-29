package route_module

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// RoutePoint represents a geographic coordinate in a route
type RoutePoint struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

// Route is the domain entity for an enduro trail/route
type Route struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	Name        string
	Description string
	Points      []RoutePoint // Stored as JSONB in DB
	DistanceKm  float64
	Difficulty  string // "easy", "medium", "hard", "extreme"
	Country     string
	Region      string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// Repository interface for route persistence
type Repository interface {
	Create(ctx context.Context, r *Route) error
	GetByID(ctx context.Context, id uuid.UUID) (*Route, error)
	List(ctx context.Context, limit, offset int, country, difficulty string) ([]*Route, error)
	Update(ctx context.Context, r *Route) error
	Delete(ctx context.Context, id uuid.UUID) error
}
