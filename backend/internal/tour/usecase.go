package tour

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
	OrganizerID uuid.UUID
	Title       string
	Description string
	StartDate   time.Time
	EndDate     time.Time
	Location    string
	MaxRiders   int
}

type UpdateInput struct {
	Title       *string
	Description *string
	StartDate   *time.Time
	EndDate     *time.Time
	Location    *string
	MaxRiders   *int
	Status      *string
}

func (uc *UseCase) Create(ctx context.Context, input CreateInput) (*Tour, error) {
	if input.Title == "" {
		return nil, domain.NewInvalidInput("tour title is required")
	}
	if input.StartDate.IsZero() {
		return nil, domain.NewInvalidInput("start date is required")
	}

	now := time.Now().UTC()
	t := &Tour{
		ID:          uuid.New(),
		OrganizerID: input.OrganizerID,
		Title:       input.Title,
		Description: input.Description,
		StartDate:   input.StartDate,
		EndDate:     input.EndDate,
		Location:    input.Location,
		MaxRiders:   input.MaxRiders,
		Status:      "upcoming",
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := uc.repo.Create(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (uc *UseCase) GetByID(ctx context.Context, id uuid.UUID) (*Tour, error) {
	return uc.repo.GetByID(ctx, id)
}

func (uc *UseCase) List(ctx context.Context, limit, offset int) ([]*Tour, error) {
	if limit <= 0 || limit > 100 { limit = 20 }
	if offset < 0 { offset = 0 }
	return uc.repo.List(ctx, limit, offset)
}

func (uc *UseCase) Update(ctx context.Context, id, userID uuid.UUID, input UpdateInput) (*Tour, error) {
	t, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if t.OrganizerID != userID {
		return nil, domain.NewForbidden("not authorized to update this tour")
	}
	if input.Title != nil { t.Title = *input.Title }
	if input.Description != nil { t.Description = *input.Description }
	if input.StartDate != nil { t.StartDate = *input.StartDate }
	if input.EndDate != nil { t.EndDate = *input.EndDate }
	if input.Location != nil { t.Location = *input.Location }
	if input.MaxRiders != nil { t.MaxRiders = *input.MaxRiders }
	if input.Status != nil { t.Status = *input.Status }
	t.UpdatedAt = time.Now().UTC()
	if err := uc.repo.Update(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (uc *UseCase) Delete(ctx context.Context, id, userID uuid.UUID) error {
	t, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if t.OrganizerID != userID {
		return domain.NewForbidden("not authorized to delete this tour")
	}
	return uc.repo.Delete(ctx, id)
}
