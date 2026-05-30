package entity

import (
	"time"
	"github.com/google/uuid"
)

type Tour struct {
	ID             uuid.UUID
	OrganizerID    uuid.UUID
	OrganizerName  string
	IsVerified     bool
	BusinessName   string
	Title          string
	Description    string
	CoverURL       *string
	Region         *string
	Country        *string
	StartDate      *time.Time
	EndDate        *time.Time
	PriceUSD       *float64
	Currency       string
	SpotsTotal     *int
	SpotsLeft      *int
	Difficulty     *string
	RouteID        *uuid.UUID
	ContactEmail   *string
	ContactPhone   *string
	WebsiteURL     *string
	Status         string
	RegisteredByMe bool
	RegsCount      int
	CreatedAt      time.Time
	UpdatedAt      time.Time
}
