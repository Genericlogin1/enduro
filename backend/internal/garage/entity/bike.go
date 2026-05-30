package entity

import (
	"time"

	"github.com/google/uuid"
)

type Bike struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Make      string    `json:"make"`
	Model     string    `json:"model"`
	Year      int       `json:"year"`
	EngineCC  int       `json:"engine_cc"`
	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
}
