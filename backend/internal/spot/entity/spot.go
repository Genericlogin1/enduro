package entity

import (
	"time"

	"github.com/google/uuid"
)

const (
	KindDanger = "danger"
	KindView   = "view"
	KindFuel   = "fuel"
	KindCamp   = "camp"
	KindTech   = "tech"
	KindMud    = "mud"
)

var ValidKinds = map[string]bool{
	KindDanger: true,
	KindView:   true,
	KindFuel:   true,
	KindCamp:   true,
	KindTech:   true,
	KindMud:    true,
}

type Spot struct {
	ID          uuid.UUID
	AuthorID    uuid.UUID
	AuthorName  string
	Title       string
	Description string
	Kind        string
	Lat         float64
	Lng         float64
	Country     string
	Upvotes     int
	MyVote      int // -1, 0, 1 — filled per-request
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
