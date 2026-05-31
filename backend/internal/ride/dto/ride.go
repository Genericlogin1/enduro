package dto

import (
	"time"

	"github.com/google/uuid"

	"enduro/internal/ride/entity"
)

type CreateRideRequest struct {
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	Location        string     `json:"location"`
	RideDate        time.Time  `json:"ride_date"`
	RouteID         *uuid.UUID `json:"route_id"`
	MaxParticipants *int       `json:"max_participants"`
}

type RideResponse struct {
	ID               uuid.UUID  `json:"id"`
	OrganizerID      uuid.UUID  `json:"organizer_id"`
	OrganizerName    string     `json:"organizer_name"`
	Title            string     `json:"title"`
	Description      string     `json:"description"`
	Location         string     `json:"location"`
	RideDate         time.Time  `json:"ride_date"`
	RouteID          *uuid.UUID `json:"route_id"`
	MaxParticipants  *int       `json:"max_participants"`
	Status           string     `json:"status"`
	ParticipantCount int        `json:"participant_count"`
	IsJoined         bool       `json:"is_joined"`
	CreatedAt        time.Time  `json:"created_at"`
}

type ParticipantResponse struct {
	UserID   uuid.UUID `json:"user_id"`
	UserName string    `json:"user_name"`
	JoinedAt time.Time `json:"joined_at"`
}

func ToRideResponse(r *entity.Ride) RideResponse {
	return RideResponse{
		ID: r.ID, OrganizerID: r.OrganizerID, OrganizerName: r.OrganizerName,
		Title: r.Title, Description: r.Description, Location: r.Location,
		RideDate: r.RideDate, RouteID: r.RouteID, MaxParticipants: r.MaxParticipants,
		Status: r.Status, ParticipantCount: r.ParticipantCount, IsJoined: r.IsJoined,
		CreatedAt: r.CreatedAt,
	}
}
