package repository

import (
	"context"

	"github.com/google/uuid"

	"enduro/internal/tracking/entity"
)

type TrackingRepository interface {
	CreateSession(ctx context.Context, s *entity.TrackSession) error
	GetSession(ctx context.Context, id uuid.UUID) (*entity.TrackSession, error)
	FinishSession(ctx context.Context, id uuid.UUID, finishedAt interface{}) error
	AddPoint(ctx context.Context, p *entity.TrackPoint) error
	ListPoints(ctx context.Context, sessionID uuid.UUID) ([]*entity.TrackPoint, error)
}
