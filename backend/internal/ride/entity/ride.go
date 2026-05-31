package entity

import (
	"time"

	"github.com/google/uuid"
)

type Ride struct {
	ID              uuid.UUID
	OrganizerID     uuid.UUID
	OrganizerName   string
	Title           string
	Description     string
	Location        string
	RideDate        time.Time
	RouteID         *uuid.UUID
	MaxParticipants *int
	Status          string
	ParticipantCount int
	IsJoined        bool
	CreatedAt       time.Time
}

type Participant struct {
	UserID   uuid.UUID
	UserName string
	JoinedAt time.Time
}
