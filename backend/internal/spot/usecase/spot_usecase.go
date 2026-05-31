package usecase

import (
	"context"

	"github.com/google/uuid"

	"enduro/internal/spot/dto"
	"enduro/internal/spot/entity"
)

type SpotRepository interface {
	Create(ctx context.Context, sp *entity.Spot) (*entity.Spot, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Spot, error)
	List(ctx context.Context, f dto.ListSpotsFilter, limit, offset int) ([]*entity.Spot, error)
	Delete(ctx context.Context, id, authorID uuid.UUID) error
	Vote(ctx context.Context, spotID, userID uuid.UUID, value int) (int, error)
	GetMyVote(ctx context.Context, spotID, userID uuid.UUID) (int, error)
}

type SpotUsecase struct {
	repo SpotRepository
}

func NewSpotUsecase(repo SpotRepository) *SpotUsecase {
	return &SpotUsecase{repo: repo}
}

func (uc *SpotUsecase) Create(ctx context.Context, req dto.CreateSpotRequest, authorID uuid.UUID) (*entity.Spot, error) {
	if !entity.ValidKinds[req.Kind] {
		req.Kind = entity.KindDanger
	}
	sp := &entity.Spot{
		AuthorID:    authorID,
		Title:       req.Title,
		Description: req.Description,
		Kind:        req.Kind,
		Lat:         req.Lat,
		Lng:         req.Lng,
		Country:     req.Country,
	}
	return uc.repo.Create(ctx, sp)
}

func (uc *SpotUsecase) List(ctx context.Context, f dto.ListSpotsFilter, limit, offset int) ([]*entity.Spot, error) {
	return uc.repo.List(ctx, f, limit, offset)
}

func (uc *SpotUsecase) Delete(ctx context.Context, id, authorID uuid.UUID) error {
	return uc.repo.Delete(ctx, id, authorID)
}

func (uc *SpotUsecase) Vote(ctx context.Context, spotID, userID uuid.UUID, value int) (int, error) {
	return uc.repo.Vote(ctx, spotID, userID, value)
}

func (uc *SpotUsecase) GetMyVote(ctx context.Context, spotID, userID uuid.UUID) (int, error) {
	return uc.repo.GetMyVote(ctx, spotID, userID)
}
