package dto

import (
	"time"

	"github.com/google/uuid"

	"enduro/internal/tracking/entity"
)

type StartSessionRequest struct {
	Name    string     `json:"name"`
	RouteID *uuid.UUID `json:"route_id"`
}

type TrackPointInput struct {
	SessionID  uuid.UUID `json:"session_id"`
	Lat        float64   `json:"lat"`
	Lng        float64   `json:"lng"`
	Altitude   float64   `json:"altitude"`
	Speed      float64   `json:"speed"`
	RecordedAt *time.Time `json:"recorded_at"`
}

type TrackPointResponse struct {
	ID         uuid.UUID `json:"id"`
	SessionID  uuid.UUID `json:"session_id"`
	Lat        float64   `json:"lat"`
	Lng        float64   `json:"lng"`
	Altitude   float64   `json:"altitude"`
	Speed      float64   `json:"speed"`
	RecordedAt time.Time `json:"recorded_at"`
}

type SessionResponse struct {
	ID         uuid.UUID            `json:"id"`
	UserID     uuid.UUID            `json:"user_id"`
	RouteID    *uuid.UUID           `json:"route_id"`
	Name       string               `json:"name"`
	Status     string               `json:"status"`
	StartedAt  time.Time            `json:"started_at"`
	FinishedAt *time.Time           `json:"finished_at"`
	CreatedAt  time.Time            `json:"created_at"`
	Points     []TrackPointResponse `json:"points,omitempty"`
}

func ToSessionResponse(s *entity.TrackSession, points []*entity.TrackPoint) SessionResponse {
	resp := SessionResponse{
		ID: s.ID, UserID: s.UserID, RouteID: s.RouteID,
		Name: s.Name, Status: s.Status,
		StartedAt: s.StartedAt, FinishedAt: s.FinishedAt, CreatedAt: s.CreatedAt,
	}
	for _, p := range points {
		resp.Points = append(resp.Points, TrackPointResponse{
			ID: p.ID, SessionID: p.SessionID,
			Lat: p.Lat, Lng: p.Lng, Altitude: p.Altitude,
			Speed: p.Speed, RecordedAt: p.RecordedAt,
		})
	}
	return resp
}
