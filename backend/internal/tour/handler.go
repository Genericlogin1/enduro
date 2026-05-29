package tour

import (
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/Genericlogin1/enduro/backend/internal/delivery/http/middleware"
)

type Handler struct {
	useCase *UseCase
	logger  *slog.Logger
}

func NewHandler(useCase *UseCase, logger *slog.Logger) *Handler {
	return &Handler{useCase: useCase, logger: logger}
}

type CreateTourRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	Location    string `json:"location"`
	MaxRiders   int    `json:"max_riders"`
}

type UpdateTourRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	StartDate   *string `json:"start_date"`
	EndDate     *string `json:"end_date"`
	Location    *string `json:"location"`
	MaxRiders   *int    `json:"max_riders"`
	Status      *string `json:"status"`
}

type TourResponse struct {
	ID           string `json:"id"`
	OrganizerID  string `json:"organizer_id"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	StartDate    string `json:"start_date"`
	EndDate      string `json:"end_date"`
	Location     string `json:"location"`
	MaxRiders    int    `json:"max_riders"`
	CurrentCount int    `json:"current_count"`
	Status       string `json:"status"`
	CreatedAt    string `json:"created_at"`
}

func toTourResponse(t *Tour) *TourResponse {
	return &TourResponse{
		ID:           t.ID.String(),
		OrganizerID:  t.OrganizerID.String(),
		Title:        t.Title,
		Description:  t.Description,
		StartDate:    t.StartDate.Format("2006-01-02T15:04:05Z"),
		EndDate:      t.EndDate.Format("2006-01-02T15:04:05Z"),
		Location:     t.Location,
		MaxRiders:    t.MaxRiders,
		CurrentCount: t.CurrentCount,
		Status:       t.Status,
		CreatedAt:    t.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func (h *Handler) Create(c *fiber.Ctx) error {
	userIDStr := middleware.GetUserID(c)
	userID, _ := uuid.Parse(userIDStr)
	var req CreateTourRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	startDate, err := time.Parse("2006-01-02T15:04:05Z", req.StartDate)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid start_date format")
	}
	var endDate time.Time
	if req.EndDate != "" {
		endDate, _ = time.Parse("2006-01-02T15:04:05Z", req.EndDate)
	}
	t, err := h.useCase.Create(c.UserContext(), CreateInput{
		OrganizerID: userID, Title: req.Title, Description: req.Description,
		StartDate: startDate, EndDate: endDate, Location: req.Location, MaxRiders: req.MaxRiders,
	})
	if err != nil {
		return middleware.MapDomainError(err)
	}
	return c.Status(fiber.StatusCreated).JSON(toTourResponse(t))
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid tour id")
	}
	t, err := h.useCase.GetByID(c.UserContext(), id)
	if err != nil {
		return middleware.MapDomainError(err)
	}
	return c.JSON(toTourResponse(t))
}

func (h *Handler) List(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	offset := c.QueryInt("offset", 0)
	tours, err := h.useCase.List(c.UserContext(), limit, offset)
	if err != nil {
		return middleware.MapDomainError(err)
	}
	resp := make([]*TourResponse, 0, len(tours))
	for _, t := range tours {
		resp = append(resp, toTourResponse(t))
	}
	return c.JSON(fiber.Map{"data": resp, "limit": limit, "offset": offset})
}

func (h *Handler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid tour id")
	}
	userIDStr := middleware.GetUserID(c)
	userID, _ := uuid.Parse(userIDStr)
	var req UpdateTourRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	input := UpdateInput{Title: req.Title, Description: req.Description, Location: req.Location, MaxRiders: req.MaxRiders, Status: req.Status}
	if req.StartDate != nil {
		sd, e := time.Parse("2006-01-02T15:04:05Z", *req.StartDate)
		if e == nil { input.StartDate = &sd }
	}
	if req.EndDate != nil {
		ed, e := time.Parse("2006-01-02T15:04:05Z", *req.EndDate)
		if e == nil { input.EndDate = &ed }
	}
	t, err := h.useCase.Update(c.UserContext(), id, userID, input)
	if err != nil {
		return middleware.MapDomainError(err)
	}
	return c.JSON(toTourResponse(t))
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid tour id")
	}
	userIDStr := middleware.GetUserID(c)
	userID, _ := uuid.Parse(userIDStr)
	if err := h.useCase.Delete(c.UserContext(), id, userID); err != nil {
		return middleware.MapDomainError(err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}
