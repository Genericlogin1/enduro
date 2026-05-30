package dto

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"

	"enduro/internal/route/entity"
)

type CreateRouteRequest struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Difficulty  string          `json:"difficulty"`
	Country     string          `json:"country"`
	DistanceKm  float64         `json:"distance_km"`
	GeoJSON     json.RawMessage `json:"geojson"`
	StartLat    float64         `json:"start_lat"`
	StartLng    float64         `json:"start_lng"`
}

type UpdateRouteRequest struct {
	Name        *string          `json:"name"`
	Description *string          `json:"description"`
	Difficulty  *string          `json:"difficulty"`
	Country     *string          `json:"country"`
	DistanceKm  *float64         `json:"distance_km"`
	GeoJSON     *json.RawMessage `json:"geojson"`
}

type ListRoutesFilter struct {
	Difficulty *string
	Country    *string
	AuthorID   *uuid.UUID
	Search     string
	Limit      int
	Offset     int
}

type RouteResponse struct {
	ID          uuid.UUID       `json:"id"`
	AuthorID    uuid.UUID       `json:"author_id"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Difficulty  string          `json:"difficulty"`
	Country     string          `json:"country"`
	DistanceKm  float64         `json:"distance_km"`
	GeoJSON     json.RawMessage `json:"geojson"`
	StartLat    float64         `json:"start_lat"`
	StartLng    float64         `json:"start_lng"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

func ToRouteResponse(r *entity.Route) RouteResponse {
	return RouteResponse{
		ID: r.ID, AuthorID: r.AuthorID, Name: r.Name,
		Description: r.Description, Difficulty: r.Difficulty,
		Country: r.Country, DistanceKm: r.DistanceKm, GeoJSON: r.GeoJSON,
		StartLat: r.StartLat, StartLng: r.StartLng,
		CreatedAt: r.CreatedAt, UpdatedAt: r.UpdatedAt,
	}
}
