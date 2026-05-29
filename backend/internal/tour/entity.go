package tour

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Tour is the domain entity for a group ride/tour event
type Tour struct {
	ID           uuid.UUID
	OrganizerID  uuid.UUID
	Title        string
	Description  string
	StartDate    time.Time
	EndDate      time.Time
	Location     string
	MaxRiders    int
	CurrentCount int
	Status       string // "upcoming", "ongoing", "completed", "cancelled"
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// Repository interface for tour persistence
type Repository interface {
	Create(ctx context.Context, t *Tour) error
	GetByID(ctx context.Context, id uuid.UUID) (*Tour, error)
	List(ctx context.Context, limit, offset int) ([]*Tour, error)
	Update(ctx context.Context, t *Tour) error
	Delete(ctx context.Context, id uuid.UUID) error
}
