package dto

import (
	"time"

	"github.com/google/uuid"

	"enduro/internal/report/entity"
)

type CreateReportRequest struct {
	Title       string     `json:"title"`
	Body        string     `json:"body"`
	CoverURL    *string    `json:"cover_url"`
	PhotoURLs   []string   `json:"photo_urls"`
	TrackID     *uuid.UUID `json:"track_id"`
	BikeID      *uuid.UUID `json:"bike_id"`
	Region      *string    `json:"region"`
	RidingDate  *time.Time `json:"riding_date"`
	Difficulty  *string    `json:"difficulty"`
	DistanceKm  *float64   `json:"distance_km"`
	DurationMin *int       `json:"duration_min"`
}

type UpdateReportRequest struct {
	Title       *string    `json:"title"`
	Body        *string    `json:"body"`
	CoverURL    *string    `json:"cover_url"`
	PhotoURLs   []string   `json:"photo_urls"`
	Region      *string    `json:"region"`
	RidingDate  *time.Time `json:"riding_date"`
	Difficulty  *string    `json:"difficulty"`
	DistanceKm  *float64   `json:"distance_km"`
	DurationMin *int       `json:"duration_min"`
}

type ReportResponse struct {
	ID          uuid.UUID  `json:"id"`
	AuthorID    uuid.UUID  `json:"author_id"`
	AuthorName  string     `json:"author_name"`
	Title       string     `json:"title"`
	Body        string     `json:"body"`
	CoverURL    *string    `json:"cover_url"`
	PhotoURLs   []string   `json:"photo_urls"`
	TrackID     *uuid.UUID `json:"track_id"`
	BikeID      *uuid.UUID `json:"bike_id"`
	BikeName    string     `json:"bike_name"`
	Region      *string    `json:"region"`
	RidingDate  *time.Time `json:"riding_date"`
	Difficulty  *string    `json:"difficulty"`
	DistanceKm  *float64   `json:"distance_km"`
	DurationMin *int       `json:"duration_min"`
	LikesCount  int        `json:"likes_count"`
	ViewsCount  int        `json:"views_count"`
	LikedByMe   bool       `json:"liked_by_me"`
	CreatedAt   time.Time  `json:"created_at"`
}

func ToReportResponse(r *entity.Report) ReportResponse {
	urls := r.PhotoURLs
	if urls == nil {
		urls = []string{}
	}
	return ReportResponse{
		ID: r.ID, AuthorID: r.AuthorID, AuthorName: r.AuthorName,
		Title: r.Title, Body: r.Body, CoverURL: r.CoverURL,
		PhotoURLs: urls, TrackID: r.TrackID, BikeID: r.BikeID,
		BikeName: r.BikeName, Region: r.Region, RidingDate: r.RidingDate,
		Difficulty: r.Difficulty, DistanceKm: r.DistanceKm, DurationMin: r.DurationMin,
		LikesCount: r.LikesCount, ViewsCount: r.ViewsCount, LikedByMe: r.LikedByMe,
		CreatedAt: r.CreatedAt,
	}
}
