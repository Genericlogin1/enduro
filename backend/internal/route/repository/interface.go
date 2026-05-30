package repository

import (
	"context"

	"github.com/google/uuid"

	"enduro/internal/route/dto"
	"enduro/internal/route/entity"
)

type RouteRepository interface {
	Create(ctx context.Context, r *entity.Route) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Route, error)
	List(ctx context.Context, filter dto.ListRoutesFilter) ([]*entity.Route, error)
	Update(ctx context.Context, r *entity.Route) error
	Delete(ctx context.Context, id uuid.UUID) error
}
