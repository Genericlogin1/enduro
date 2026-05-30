package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"

	"enduro/internal/tour/dto"
	"enduro/internal/tour/entity"
	repo "enduro/internal/tour/repository"
	"enduro/pkg/apperrors"
)

type TourUsecase interface {
	Create(ctx context.Context, organizerID uuid.UUID, req dto.CreateTourRequest) (dto.TourResponse, error)
	GetByID(ctx context.Context, id uuid.UUID, callerID uuid.UUID) (dto.TourResponse, error)
	List(ctx context.Context, limit, offset int, callerID uuid.UUID) ([]dto.TourResponse, error)
	ListByOrganizer(ctx context.Context, organizerID uuid.UUID, limit, offset int, callerID uuid.UUID) ([]dto.TourResponse, error)
	Update(ctx context.Context, id, callerID uuid.UUID, req dto.CreateTourRequest) (dto.TourResponse, error)
	Delete(ctx context.Context, id, callerID uuid.UUID) error
	ToggleRegister(ctx context.Context, tourID, userID uuid.UUID) (bool, error)
}

type tourUsecase struct{ repo repo.TourRepository }

func NewTourUsecase(r repo.TourRepository) TourUsecase { return &tourUsecase{repo: r} }

func (u *tourUsecase) Create(ctx context.Context, organizerID uuid.UUID, req dto.CreateTourRequest) (dto.TourResponse, error) {
	if req.Title == "" {
		return dto.TourResponse{}, apperrors.New(apperrors.ErrInvalidInput, "INVALID_INPUT", "title required")
	}
	now := time.Now().UTC()
	t := &entity.Tour{
		ID: uuid.New(), OrganizerID: organizerID,
		Title: req.Title, Description: req.Description,
		CoverURL: req.CoverURL, Region: req.Region, Country: req.Country,
		StartDate: req.StartDate, EndDate: req.EndDate,
		PriceUSD: req.PriceUSD, Currency: "USD",
		SpotsTotal: req.SpotsTotal, SpotsLeft: req.SpotsTotal,
		Difficulty: req.Difficulty, RouteID: req.RouteID,
		ContactEmail: req.ContactEmail, ContactPhone: req.ContactPhone,
		WebsiteURL: req.WebsiteURL, Status: "published",
		CreatedAt: now, UpdatedAt: now,
	}
	if err := u.repo.Create(ctx, t); err != nil { return dto.TourResponse{}, err }
	return dto.ToTourResponse(t), nil
}

func (u *tourUsecase) GetByID(ctx context.Context, id uuid.UUID, callerID uuid.UUID) (dto.TourResponse, error) {
	t, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) { return dto.TourResponse{}, entity.ErrNotFound }
		return dto.TourResponse{}, err
	}
	if callerID != uuid.Nil {
		t.RegisteredByMe, _ = u.repo.IsRegistered(ctx, id, callerID)
	}
	t.RegsCount, _ = u.repo.RegsCount(ctx, id)
	return dto.ToTourResponse(t), nil
}

func (u *tourUsecase) enrich(ctx context.Context, tours []*entity.Tour, callerID uuid.UUID) []dto.TourResponse {
	result := make([]dto.TourResponse, len(tours))
	for i, t := range tours {
		if callerID != uuid.Nil {
			t.RegisteredByMe, _ = u.repo.IsRegistered(ctx, t.ID, callerID)
		}
		t.RegsCount, _ = u.repo.RegsCount(ctx, t.ID)
		result[i] = dto.ToTourResponse(t)
	}
	return result
}

func (u *tourUsecase) List(ctx context.Context, limit, offset int, callerID uuid.UUID) ([]dto.TourResponse, error) {
	if limit <= 0 || limit > 100 { limit = 20 }
	tours, err := u.repo.List(ctx, limit, offset)
	if err != nil { return nil, err }
	return u.enrich(ctx, tours, callerID), nil
}

func (u *tourUsecase) ListByOrganizer(ctx context.Context, organizerID uuid.UUID, limit, offset int, callerID uuid.UUID) ([]dto.TourResponse, error) {
	if limit <= 0 || limit > 100 { limit = 20 }
	tours, err := u.repo.ListByOrganizer(ctx, organizerID, limit, offset)
	if err != nil { return nil, err }
	return u.enrich(ctx, tours, callerID), nil
}

func (u *tourUsecase) Update(ctx context.Context, id, callerID uuid.UUID, req dto.CreateTourRequest) (dto.TourResponse, error) {
	t, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) { return dto.TourResponse{}, entity.ErrNotFound }
		return dto.TourResponse{}, err
	}
	if t.OrganizerID != callerID { return dto.TourResponse{}, entity.ErrForbidden }
	t.Title = req.Title; t.Description = req.Description
	t.CoverURL = req.CoverURL; t.Region = req.Region; t.Country = req.Country
	t.StartDate = req.StartDate; t.EndDate = req.EndDate; t.PriceUSD = req.PriceUSD
	t.SpotsTotal = req.SpotsTotal; t.Difficulty = req.Difficulty
	t.ContactEmail = req.ContactEmail; t.ContactPhone = req.ContactPhone
	t.WebsiteURL = req.WebsiteURL; t.UpdatedAt = time.Now().UTC()
	if err := u.repo.Update(ctx, t); err != nil { return dto.TourResponse{}, err }
	return dto.ToTourResponse(t), nil
}

func (u *tourUsecase) Delete(ctx context.Context, id, callerID uuid.UUID) error {
	t, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) { return entity.ErrNotFound }
		return err
	}
	if t.OrganizerID != callerID { return entity.ErrForbidden }
	return u.repo.Delete(ctx, id)
}

func (u *tourUsecase) ToggleRegister(ctx context.Context, tourID, userID uuid.UUID) (bool, error) {
	ok, err := u.repo.IsRegistered(ctx, tourID, userID)
	if err != nil { return false, err }
	if ok {
		return false, u.repo.Unregister(ctx, tourID, userID)
	}
	return true, u.repo.Register(ctx, tourID, userID)
}
