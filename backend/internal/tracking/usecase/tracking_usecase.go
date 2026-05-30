package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"

	"enduro/internal/tracking/dto"
	"enduro/internal/tracking/entity"
	trackrepo "enduro/internal/tracking/repository"
	"enduro/pkg/apperrors"
)

type TrackingUsecase interface {
	StartSession(ctx context.Context, userID uuid.UUID, req dto.StartSessionRequest) (dto.SessionResponse, error)
	FinishSession(ctx context.Context, sessionID, callerID uuid.UUID) (dto.SessionResponse, error)
	GetSession(ctx context.Context, sessionID, callerID uuid.UUID) (dto.SessionResponse, error)
	AddPoint(ctx context.Context, inp dto.TrackPointInput) (dto.TrackPointResponse, error)
}

type trackingUsecase struct {
	repo trackrepo.TrackingRepository
}

func NewTrackingUsecase(repo trackrepo.TrackingRepository) TrackingUsecase {
	return &trackingUsecase{repo: repo}
}

func (u *trackingUsecase) StartSession(ctx context.Context, userID uuid.UUID, req dto.StartSessionRequest) (dto.SessionResponse, error) {
	now := time.Now().UTC()
	s := &entity.TrackSession{
		ID: uuid.New(), UserID: userID, RouteID: req.RouteID,
		Name: req.Name, Status: entity.StatusActive,
		StartedAt: now, CreatedAt: now,
	}
	if err := u.repo.CreateSession(ctx, s); err != nil {
		return dto.SessionResponse{}, err
	}
	return dto.ToSessionResponse(s, nil), nil
}

func (u *trackingUsecase) FinishSession(ctx context.Context, sessionID, callerID uuid.UUID) (dto.SessionResponse, error) {
	s, err := u.repo.GetSession(ctx, sessionID)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) {
			return dto.SessionResponse{}, entity.ErrSessionNotFound
		}
		return dto.SessionResponse{}, err
	}
	if s.UserID != callerID {
		return dto.SessionResponse{}, entity.ErrNotOwner
	}
	if s.Status == entity.StatusFinished {
		return dto.SessionResponse{}, entity.ErrSessionAlreadyFinished
	}
	now := time.Now().UTC()
	if err := u.repo.FinishSession(ctx, sessionID, now); err != nil {
		return dto.SessionResponse{}, err
	}
	s.Status = entity.StatusFinished
	s.FinishedAt = &now
	points, _ := u.repo.ListPoints(ctx, sessionID)
	return dto.ToSessionResponse(s, points), nil
}

func (u *trackingUsecase) GetSession(ctx context.Context, sessionID, callerID uuid.UUID) (dto.SessionResponse, error) {
	s, err := u.repo.GetSession(ctx, sessionID)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) {
			return dto.SessionResponse{}, entity.ErrSessionNotFound
		}
		return dto.SessionResponse{}, err
	}
	if s.UserID != callerID {
		return dto.SessionResponse{}, entity.ErrNotOwner
	}
	points, _ := u.repo.ListPoints(ctx, sessionID)
	return dto.ToSessionResponse(s, points), nil
}

func (u *trackingUsecase) AddPoint(ctx context.Context, inp dto.TrackPointInput) (dto.TrackPointResponse, error) {
	recordedAt := time.Now().UTC()
	if inp.RecordedAt != nil {
		recordedAt = *inp.RecordedAt
	}
	p := &entity.TrackPoint{
		ID: uuid.New(), SessionID: inp.SessionID,
		Lat: inp.Lat, Lng: inp.Lng, Altitude: inp.Altitude,
		Speed: inp.Speed, RecordedAt: recordedAt,
	}
	if err := u.repo.AddPoint(ctx, p); err != nil {
		return dto.TrackPointResponse{}, err
	}
	return dto.TrackPointResponse{
		ID: p.ID, SessionID: p.SessionID,
		Lat: p.Lat, Lng: p.Lng, Altitude: p.Altitude,
		Speed: p.Speed, RecordedAt: p.RecordedAt,
	}, nil
}
