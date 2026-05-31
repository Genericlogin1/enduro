package entity

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Route struct {
	ID           uuid.UUID
	AuthorID     uuid.UUID
	Name         string
	Description  string
	Difficulty   string
	Country      string
	DistanceKm   float64
	GeoJSON      json.RawMessage
	StartLat     float64
	StartLng     float64
	AvgRating    float64
	RatingCount  int
	MyRating     int
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
