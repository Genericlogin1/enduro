package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"

	"enduro/internal/report/dto"
	"enduro/internal/report/entity"
	repo "enduro/internal/report/repository"
	"enduro/pkg/apperrors"
)

type ReportUsecase interface {
	Create(ctx context.Context, authorID uuid.UUID, req dto.CreateReportRequest) (dto.ReportResponse, error)
	GetByID(ctx context.Context, id uuid.UUID, callerID uuid.UUID) (dto.ReportResponse, error)
	List(ctx context.Context, limit, offset int, callerID uuid.UUID) ([]dto.ReportResponse, error)
	ListByAuthor(ctx context.Context, authorID uuid.UUID, limit, offset int, callerID uuid.UUID) ([]dto.ReportResponse, error)
	Update(ctx context.Context, id, callerID uuid.UUID, req dto.UpdateReportRequest) (dto.ReportResponse, error)
	Delete(ctx context.Context, id, callerID uuid.UUID) error
	ToggleLike(ctx context.Context, reportID, userID uuid.UUID) error
}

type reportUsecase struct{ repo repo.ReportRepository }

func NewReportUsecase(r repo.ReportRepository) ReportUsecase {
	return &reportUsecase{repo: r}
}

func (u *reportUsecase) Create(ctx context.Context, authorID uuid.UUID, req dto.CreateReportRequest) (dto.ReportResponse, error) {
	if req.Title == "" {
		return dto.ReportResponse{}, apperrors.New(apperrors.ErrInvalidInput, "INVALID_INPUT", "title is required")
	}
	now := time.Now().UTC()
	urls := req.PhotoURLs
	if urls == nil {
		urls = []string{}
	}
	r := &entity.Report{
		ID: uuid.New(), AuthorID: authorID,
		Title: req.Title, Body: req.Body,
		CoverURL: req.CoverURL, PhotoURLs: urls,
		TrackID: req.TrackID, BikeID: req.BikeID,
		Region: req.Region, RidingDate: req.RidingDate,
		Difficulty: req.Difficulty, DistanceKm: req.DistanceKm,
		DurationMin: req.DurationMin,
		CreatedAt: now, UpdatedAt: now,
	}
	if err := u.repo.Create(ctx, r); err != nil {
		return dto.ReportResponse{}, err
	}
	return dto.ToReportResponse(r), nil
}

func (u *reportUsecase) GetByID(ctx context.Context, id uuid.UUID, callerID uuid.UUID) (dto.ReportResponse, error) {
	r, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) {
			return dto.ReportResponse{}, entity.ErrNotFound
		}
		return dto.ReportResponse{}, err
	}
	go u.repo.IncrementViews(context.Background(), id) //nolint
	if callerID != uuid.Nil {
		r.LikedByMe, _ = u.repo.IsLiked(ctx, id, callerID)
	}
	return dto.ToReportResponse(r), nil
}

func (u *reportUsecase) list(ctx context.Context, reports []*entity.Report, callerID uuid.UUID) []dto.ReportResponse {
	result := make([]dto.ReportResponse, len(reports))
	for i, r := range reports {
		if callerID != uuid.Nil {
			r.LikedByMe, _ = u.repo.IsLiked(ctx, r.ID, callerID)
		}
		result[i] = dto.ToReportResponse(r)
	}
	return result
}

func (u *reportUsecase) List(ctx context.Context, limit, offset int, callerID uuid.UUID) ([]dto.ReportResponse, error) {
	if limit <= 0 || limit > 100 { limit = 20 }
	reports, err := u.repo.List(ctx, limit, offset)
	if err != nil { return nil, err }
	return u.list(ctx, reports, callerID), nil
}

func (u *reportUsecase) ListByAuthor(ctx context.Context, authorID uuid.UUID, limit, offset int, callerID uuid.UUID) ([]dto.ReportResponse, error) {
	if limit <= 0 || limit > 100 { limit = 20 }
	reports, err := u.repo.ListByAuthor(ctx, authorID, limit, offset)
	if err != nil { return nil, err }
	return u.list(ctx, reports, callerID), nil
}

func (u *reportUsecase) Update(ctx context.Context, id, callerID uuid.UUID, req dto.UpdateReportRequest) (dto.ReportResponse, error) {
	r, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) { return dto.ReportResponse{}, entity.ErrNotFound }
		return dto.ReportResponse{}, err
	}
	if r.AuthorID != callerID { return dto.ReportResponse{}, entity.ErrForbidden }
	if req.Title != nil { r.Title = *req.Title }
	if req.Body != nil { r.Body = *req.Body }
	if req.CoverURL != nil { r.CoverURL = req.CoverURL }
	if req.PhotoURLs != nil { r.PhotoURLs = req.PhotoURLs }
	if req.Region != nil { r.Region = req.Region }
	if req.RidingDate != nil { r.RidingDate = req.RidingDate }
	if req.Difficulty != nil { r.Difficulty = req.Difficulty }
	if req.DistanceKm != nil { r.DistanceKm = req.DistanceKm }
	if req.DurationMin != nil { r.DurationMin = req.DurationMin }
	r.UpdatedAt = time.Now().UTC()
	if err := u.repo.Update(ctx, r); err != nil { return dto.ReportResponse{}, err }
	return dto.ToReportResponse(r), nil
}

func (u *reportUsecase) Delete(ctx context.Context, id, callerID uuid.UUID) error {
	r, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) { return entity.ErrNotFound }
		return err
	}
	if r.AuthorID != callerID { return entity.ErrForbidden }
	return u.repo.Delete(ctx, id)
}

func (u *reportUsecase) ToggleLike(ctx context.Context, reportID, userID uuid.UUID) error {
	if _, err := u.repo.GetByID(ctx, reportID); err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) { return entity.ErrNotFound }
		return err
	}
	liked, err := u.repo.IsLiked(ctx, reportID, userID)
	if err != nil { return err }
	if liked { return u.repo.RemoveLike(ctx, reportID, userID) }
	return u.repo.AddLike(ctx, reportID, userID)
}
