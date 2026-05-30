package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"

	"enduro/internal/garage/dto"
	"enduro/internal/garage/entity"
	garagerepo "enduro/internal/garage/repository"
)

type GarageUsecase interface {
	AddBike(ctx context.Context, userID uuid.UUID, req dto.AddBikeRequest) (dto.BikeResponse, error)
	ListBikes(ctx context.Context, userID uuid.UUID) ([]dto.BikeResponse, error)
	DeleteBike(ctx context.Context, bikeID, userID uuid.UUID) error
}

type garageUsecase struct {
	repo garagerepo.GarageRepository
}

func NewGarageUsecase(repo garagerepo.GarageRepository) GarageUsecase {
	return &garageUsecase{repo: repo}
}

func (u *garageUsecase) AddBike(ctx context.Context, userID uuid.UUID, req dto.AddBikeRequest) (dto.BikeResponse, error) {
	b := &entity.Bike{
		ID: uuid.New(), UserID: userID,
		Make: req.Make, Model: req.Model,
		Year: req.Year, EngineCC: req.EngineCC,
		Notes: req.Notes, CreatedAt: time.Now().UTC(),
	}
	if err := u.repo.AddBike(ctx, b); err != nil {
		return dto.BikeResponse{}, err
	}
	return dto.ToBikeResponse(b), nil
}

func (u *garageUsecase) ListBikes(ctx context.Context, userID uuid.UUID) ([]dto.BikeResponse, error) {
	bikes, err := u.repo.ListBikes(ctx, userID)
	if err != nil {
		return nil, err
	}
	result := make([]dto.BikeResponse, len(bikes))
	for i, b := range bikes {
		result[i] = dto.ToBikeResponse(b)
	}
	return result, nil
}

func (u *garageUsecase) DeleteBike(ctx context.Context, bikeID, userID uuid.UUID) error {
	return u.repo.DeleteBike(ctx, bikeID, userID)
}
