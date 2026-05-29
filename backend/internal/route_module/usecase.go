package route_module

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/Genericlogin1/enduro/backend/internal/domain"
)

type TxManager interface {
	RunInTx(ctx context.Context, fn func(ctx context.Context) error) error
}

type UseCase struct {
	repo      Repository
	txManager TxManager
}

func NewUseCase(repo Repository, txManager TxManager) *UseCase {
	return &UseCase{repo: repo, txManager: txManager}
}

type CreateInput struct {
	UserID      uuid.UUID
	Name        string
	Description string
	Points      []RoutePoint
	DistanceKm  float64
	Difficulty  string
	Country     string
	Region      string
}

type UpdateInput struct {
	Name        *string
	Description *string
	Points      []RoutePoint
	DistanceKm  *float64
	Difficulty  *string
	Country     *string
	Region      *string
}

func (uc *UseCase) Create(ctx context.Context, input CreateInput) (*Route, error) {
	if input.Name == "" {
		return nil, domain.NewInvalidInput("route name is required")
	}
	if len(input.Points) < 2 {
		return nil, domain.NewInvalidInput("route must have at least 2 points")
	}

	now := time.Now().UTC()
	r := &Route{
		ID:          uuid.New(),
		UserID:      input.UserID,
		Name:        input.Name,
		Description: input.Description,
		Points:      input.Points,
		DistanceKm:  input.DistanceKm,
		Difficulty:  input.Difficulty,
		Country:     input.Country,
		Region:      input.Region,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := uc.repo.Create(ctx, r); err != nil {
		return nil, err
	}
	return r, nil
}

func (uc *UseCase) GetByID(ctx context.Context, id uuid.UUID) (*Route, error) {
	return uc.repo.GetByID(ctx, id)
}

func (uc *UseCase) List(ctx context.Context, limit, offset int, country, difficulty string) ([]*Route, error) {
	if limit <= 0 || limit > 100 { limit = 20 }
	if offset < 0 { offset = 0 }
	return uc.repo.List(ctx, limit, offset, country, difficulty)
}

func (uc *UseCase) Update(ctx context.Context, id, userID uuid.UUID, input UpdateInput) (*Route, error) {
	r, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if r.UserID != userID {
		return nil, domain.NewForbidden("not authorized to update this route")
	}
	if input.Name != nil { r.Name = *input.Name }
	if input.Description != nil { r.Description = *input.Description }
	if len(input.Points) >= 2 { r.Points = input.Points }
	if input.DistanceKm != nil { r.DistanceKm = *input.DistanceKm }
	if input.Difficulty != nil { r.Difficulty = *input.Difficulty }
	if input.Country != nil { r.Country = *input.Country }
	if input.Region != nil { r.Region = *input.Region }
	r.UpdatedAt = time.Now().UTC()
	if err := uc.repo.Update(ctx, r); err != nil {
		return nil, err
	}
	return r, nil
}

func (uc *UseCase) Delete(ctx context.Context, id, userID uuid.UUID) error {
	r, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if r.UserID != userID {
		return domain.NewForbidden("not authorized to delete this route")
	}
	return uc.repo.Delete(ctx, id)
}
