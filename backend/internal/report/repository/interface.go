package repository

import (
	"context"

	"github.com/google/uuid"

	"enduro/internal/report/entity"
)

type ReportRepository interface {
	Create(ctx context.Context, r *entity.Report) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Report, error)
	List(ctx context.Context, limit, offset int) ([]*entity.Report, error)
	ListByAuthor(ctx context.Context, authorID uuid.UUID, limit, offset int) ([]*entity.Report, error)
	Update(ctx context.Context, r *entity.Report) error
	Delete(ctx context.Context, id uuid.UUID) error
	IncrementViews(ctx context.Context, id uuid.UUID) error
	AddLike(ctx context.Context, reportID, userID uuid.UUID) error
	RemoveLike(ctx context.Context, reportID, userID uuid.UUID) error
	IsLiked(ctx context.Context, reportID, userID uuid.UUID) (bool, error)
}
