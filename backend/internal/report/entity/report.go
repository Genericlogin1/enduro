package entity

import (
	"time"

	"github.com/google/uuid"
)

type Report struct {
	ID          uuid.UUID
	AuthorID    uuid.UUID
	AuthorName  string
	Title       string
	Body        string
	CoverURL    *string
	PhotoURLs   []string
	TrackID     *uuid.UUID
	BikeID      *uuid.UUID
	BikeName    string // make + model, joined
	Region      *string
	RidingDate  *time.Time
	Difficulty  *string
	DistanceKm  *float64
	DurationMin *int
	LikesCount  int
	ViewsCount  int
	LikedByMe   bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
