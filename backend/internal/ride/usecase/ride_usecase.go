package usecase

import (
	"context"

	"github.com/google/uuid"

	"enduro/internal/ride/entity"
)

type RideRepo interface {
	Create(ctx context.Context, organizerID uuid.UUID, req *entity.Ride) (*entity.Ride, error)
	List(ctx context.Context, userID *uuid.UUID) ([]*entity.Ride, error)
	GetByID(ctx context.Context, id uuid.UUID, userID *uuid.UUID) (*entity.Ride, error)
	Join(ctx context.Context, rideID, userID uuid.UUID) error
	Leave(ctx context.Context, rideID, userID uuid.UUID) error
	Participants(ctx context.Context, rideID uuid.UUID) ([]*entity.Participant, error)
	Delete(ctx context.Context, id, organizerID uuid.UUID) error
}

type RideUsecase struct {
	repo RideRepo
}

func NewRideUsecase(repo RideRepo) *RideUsecase {
	return &RideUsecase{repo: repo}
}

func (u *RideUsecase) Create(ctx context.Context, organizerID uuid.UUID, req *entity.Ride) (*entity.Ride, error) {
	return u.repo.Create(ctx, organizerID, req)
}

func (u *RideUsecase) List(ctx context.Context, userID *uuid.UUID) ([]*entity.Ride, error) {
	return u.repo.List(ctx, userID)
}

func (u *RideUsecase) GetByID(ctx context.Context, id uuid.UUID, userID *uuid.UUID) (*entity.Ride, error) {
	return u.repo.GetByID(ctx, id, userID)
}

func (u *RideUsecase) Join(ctx context.Context, rideID, userID uuid.UUID) error {
	return u.repo.Join(ctx, rideID, userID)
}

func (u *RideUsecase) Leave(ctx context.Context, rideID, userID uuid.UUID) error {
	return u.repo.Leave(ctx, rideID, userID)
}

func (u *RideUsecase) Participants(ctx context.Context, rideID uuid.UUID) ([]*entity.Participant, error) {
	return u.repo.Participants(ctx, rideID)
}

func (u *RideUsecase) Delete(ctx context.Context, id, organizerID uuid.UUID) error {
	return u.repo.Delete(ctx, id, organizerID)
}
