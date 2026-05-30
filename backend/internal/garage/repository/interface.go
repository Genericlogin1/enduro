package repository

import (
	"context"

	"github.com/google/uuid"

	"enduro/internal/garage/entity"
)

type GarageRepository interface {
	AddBike(ctx context.Context, b *entity.Bike) error
	ListBikes(ctx context.Context, userID uuid.UUID) ([]*entity.Bike, error)
	DeleteBike(ctx context.Context, id, userID uuid.UUID) error
}
