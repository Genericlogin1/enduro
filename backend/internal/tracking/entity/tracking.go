package entity

import (
	"time"

	"github.com/google/uuid"
)

type TrackSession struct {
	ID         uuid.UUID
	UserID     uuid.UUID
	RouteID    *uuid.UUID
	Name       string
	Status     string
	StartedAt  time.Time
	FinishedAt *time.Time
	CreatedAt  time.Time
}

type TrackPoint struct {
	ID         uuid.UUID
	SessionID  uuid.UUID
	Lat        float64
	Lng        float64
	Altitude   float64
	Speed      float64
	RecordedAt time.Time
}

const (
	StatusActive   = "active"
	StatusFinished = "finished"
)
