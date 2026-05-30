package dto

import (
	"time"
	"github.com/google/uuid"
	"enduro/internal/tour/entity"
)

type CreateTourRequest struct {
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	CoverURL     *string    `json:"cover_url"`
	Region       *string    `json:"region"`
	Country      *string    `json:"country"`
	StartDate    *time.Time `json:"start_date"`
	EndDate      *time.Time `json:"end_date"`
	PriceUSD     *float64   `json:"price_usd"`
	SpotsTotal   *int       `json:"spots_total"`
	Difficulty   *string    `json:"difficulty"`
	RouteID      *uuid.UUID `json:"route_id"`
	ContactEmail *string    `json:"contact_email"`
	ContactPhone *string    `json:"contact_phone"`
	WebsiteURL   *string    `json:"website_url"`
	Telegram     *string    `json:"telegram"`
	WhatsApp     *string    `json:"whatsapp"`
	Instagram    *string    `json:"instagram"`
}

type TourResponse struct {
	ID             uuid.UUID  `json:"id"`
	OrganizerID    uuid.UUID  `json:"organizer_id"`
	OrganizerName  string     `json:"organizer_name"`
	IsVerified     bool       `json:"is_verified"`
	BusinessName   string     `json:"business_name"`
	Title          string     `json:"title"`
	Description    string     `json:"description"`
	CoverURL       *string    `json:"cover_url"`
	Region         *string    `json:"region"`
	Country        *string    `json:"country"`
	StartDate      *time.Time `json:"start_date"`
	EndDate        *time.Time `json:"end_date"`
	PriceUSD       *float64   `json:"price_usd"`
	Currency       string     `json:"currency"`
	SpotsTotal     *int       `json:"spots_total"`
	SpotsLeft      *int       `json:"spots_left"`
	Difficulty     *string    `json:"difficulty"`
	RouteID        *uuid.UUID `json:"route_id"`
	ContactEmail   *string    `json:"contact_email"`
	ContactPhone   *string    `json:"contact_phone"`
	WebsiteURL     *string    `json:"website_url"`
	Telegram       *string    `json:"telegram"`
	WhatsApp       *string    `json:"whatsapp"`
	Instagram      *string    `json:"instagram"`
	Status         string     `json:"status"`
	RegisteredByMe bool       `json:"registered_by_me"`
	RegsCount      int        `json:"regs_count"`
	CreatedAt      time.Time  `json:"created_at"`
}

func ToTourResponse(t *entity.Tour) TourResponse {
	return TourResponse{
		ID: t.ID, OrganizerID: t.OrganizerID, OrganizerName: t.OrganizerName,
		IsVerified: t.IsVerified, BusinessName: t.BusinessName,
		Title: t.Title, Description: t.Description, CoverURL: t.CoverURL,
		Region: t.Region, Country: t.Country,
		StartDate: t.StartDate, EndDate: t.EndDate,
		PriceUSD: t.PriceUSD, Currency: t.Currency,
		SpotsTotal: t.SpotsTotal, SpotsLeft: t.SpotsLeft,
		Difficulty: t.Difficulty, RouteID: t.RouteID,
		ContactEmail: t.ContactEmail, ContactPhone: t.ContactPhone,
		WebsiteURL: t.WebsiteURL, Telegram: t.Telegram,
		WhatsApp: t.WhatsApp, Instagram: t.Instagram,
		Status: t.Status,
		RegisteredByMe: t.RegisteredByMe, RegsCount: t.RegsCount,
		CreatedAt: t.CreatedAt,
	}
}
