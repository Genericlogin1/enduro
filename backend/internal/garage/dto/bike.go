package dto

import (
	"time"

	"github.com/google/uuid"

	"enduro/internal/garage/entity"
)

type AddBikeRequest struct {
	Make     string `json:"make"`
	Model    string `json:"model"`
	Year     int    `json:"year"`
	EngineCC int    `json:"engine_cc"`
	Notes    string `json:"notes"`
}

type BikeResponse struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Make      string    `json:"make"`
	Model     string    `json:"model"`
	Year      int       `json:"year"`
	EngineCC  int       `json:"engine_cc"`
	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
}

func ToBikeResponse(b *entity.Bike) BikeResponse {
	return BikeResponse{
		ID: b.ID, UserID: b.UserID,
		Make: b.Make, Model: b.Model,
		Year: b.Year, EngineCC: b.EngineCC,
		Notes: b.Notes, CreatedAt: b.CreatedAt,
	}
}
