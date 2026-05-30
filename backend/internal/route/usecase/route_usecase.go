package usecase

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"

	"enduro/internal/route/dto"
	"enduro/internal/route/entity"
	routerepo "enduro/internal/route/repository"
	"enduro/pkg/apperrors"
)

type RouteUsecase interface {
	Create(ctx context.Context, authorID uuid.UUID, req dto.CreateRouteRequest) (dto.RouteResponse, error)
	GetByID(ctx context.Context, id uuid.UUID) (dto.RouteResponse, error)
	List(ctx context.Context, filter dto.ListRoutesFilter) ([]dto.RouteResponse, error)
	Update(ctx context.Context, id, callerID uuid.UUID, req dto.UpdateRouteRequest) (dto.RouteResponse, error)
	Delete(ctx context.Context, id, callerID uuid.UUID) error
}

type routeUsecase struct {
	repo routerepo.RouteRepository
}

func NewRouteUsecase(repo routerepo.RouteRepository) RouteUsecase {
	return &routeUsecase{repo: repo}
}

func (u *routeUsecase) Create(ctx context.Context, authorID uuid.UUID, req dto.CreateRouteRequest) (dto.RouteResponse, error) {
	if req.Name == "" {
		return dto.RouteResponse{}, apperrors.New(apperrors.ErrInvalidInput, "INVALID_INPUT", "name is required")
	}
	if len(req.GeoJSON) == 0 || !json.Valid(req.GeoJSON) {
		return dto.RouteResponse{}, entity.ErrInvalidGeoJSON
	}
	difficulty := req.Difficulty
	if difficulty == "" {
		difficulty = "Medium"
	}
	now := time.Now().UTC()
	r := &entity.Route{
		ID: uuid.New(), AuthorID: authorID, Name: req.Name,
		Description: req.Description, Difficulty: difficulty,
		Country: req.Country, DistanceKm: req.DistanceKm,
		GeoJSON: req.GeoJSON, StartLat: req.StartLat, StartLng: req.StartLng,
		CreatedAt: now, UpdatedAt: now,
	}
	if err := u.repo.Create(ctx, r); err != nil {
		return dto.RouteResponse{}, err
	}
	return dto.ToRouteResponse(r), nil
}

func (u *routeUsecase) GetByID(ctx context.Context, id uuid.UUID) (dto.RouteResponse, error) {
	r, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) {
			return dto.RouteResponse{}, entity.ErrNotFound
		}
		return dto.RouteResponse{}, err
	}
	return dto.ToRouteResponse(r), nil
}

func (u *routeUsecase) List(ctx context.Context, filter dto.ListRoutesFilter) ([]dto.RouteResponse, error) {
	if filter.Limit <= 0 || filter.Limit > 100 {
		filter.Limit = 20
	}
	routes, err := u.repo.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	result := make([]dto.RouteResponse, len(routes))
	for i, r := range routes {
		result[i] = dto.ToRouteResponse(r)
	}
	return result, nil
}

func (u *routeUsecase) Update(ctx context.Context, id, callerID uuid.UUID, req dto.UpdateRouteRequest) (dto.RouteResponse, error) {
	r, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) {
			return dto.RouteResponse{}, entity.ErrNotFound
		}
		return dto.RouteResponse{}, err
	}
	if r.AuthorID != callerID {
		return dto.RouteResponse{}, entity.ErrForbidden
	}
	if req.Name != nil {
		r.Name = *req.Name
	}
	if req.Description != nil {
		r.Description = *req.Description
	}
	if req.Difficulty != nil {
		r.Difficulty = *req.Difficulty
	}
	if req.Country != nil {
		r.Country = *req.Country
	}
	if req.DistanceKm != nil {
		r.DistanceKm = *req.DistanceKm
	}
	if req.GeoJSON != nil {
		if !json.Valid(*req.GeoJSON) {
			return dto.RouteResponse{}, entity.ErrInvalidGeoJSON
		}
		r.GeoJSON = *req.GeoJSON
	}
	r.UpdatedAt = time.Now().UTC()
	if err := u.repo.Update(ctx, r); err != nil {
		return dto.RouteResponse{}, err
	}
	return dto.ToRouteResponse(r), nil
}

func (u *routeUsecase) Delete(ctx context.Context, id, callerID uuid.UUID) error {
	r, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) {
			return entity.ErrNotFound
		}
		return err
	}
	if r.AuthorID != callerID {
		return entity.ErrForbidden
	}
	return u.repo.Delete(ctx, id)
}
