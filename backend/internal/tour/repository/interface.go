package repository

import (
	"context"
	"github.com/google/uuid"
	"enduro/internal/tour/entity"
)

type TourRepository interface {
	Create(ctx context.Context, t *entity.Tour) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Tour, error)
	List(ctx context.Context, limit, offset int) ([]*entity.Tour, error)
	ListByOrganizer(ctx context.Context, organizerID uuid.UUID, limit, offset int) ([]*entity.Tour, error)
	Update(ctx context.Context, t *entity.Tour) error
	Delete(ctx context.Context, id uuid.UUID) error
	Register(ctx context.Context, tourID, userID uuid.UUID) error
	Unregister(ctx context.Context, tourID, userID uuid.UUID) error
	IsRegistered(ctx context.Context, tourID, userID uuid.UUID) (bool, error)
	RegsCount(ctx context.Context, tourID uuid.UUID) (int, error)
}
