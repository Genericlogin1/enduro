package route_module

import (
	"log/slog"

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

type CreateRouteRequest struct {
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Points      []RoutePoint `json:"points"`
	DistanceKm  float64      `json:"distance_km"`
	Difficulty  string       `json:"difficulty"`
	Country     string       `json:"country"`
	Region      string       `json:"region"`
}

type UpdateRouteRequest struct {
	Name        *string      `json:"name"`
	Description *string      `json:"description"`
	Points      []RoutePoint `json:"points"`
	DistanceKm  *float64     `json:"distance_km"`
	Difficulty  *string      `json:"difficulty"`
	Country     *string      `json:"country"`
	Region      *string      `json:"region"`
}

type RouteResponse struct {
	ID          string       `json:"id"`
	UserID      string       `json:"user_id"`
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Points      []RoutePoint `json:"points"`
	DistanceKm  float64      `json:"distance_km"`
	Difficulty  string       `json:"difficulty"`
	Country     string       `json:"country"`
	Region      string       `json:"region"`
	CreatedAt   string       `json:"created_at"`
}

func toRouteResponse(r *Route) *RouteResponse {
	return &RouteResponse{
		ID:          r.ID.String(),
		UserID:      r.UserID.String(),
		Name:        r.Name,
		Description: r.Description,
		Points:      r.Points,
		DistanceKm:  r.DistanceKm,
		Difficulty:  r.Difficulty,
		Country:     r.Country,
		Region:      r.Region,
		CreatedAt:   r.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func (h *Handler) Create(c *fiber.Ctx) error {
	userIDStr := middleware.GetUserID(c)
	userID, _ := uuid.Parse(userIDStr)
	var req CreateRouteRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	r, err := h.useCase.Create(c.UserContext(), CreateInput{
		UserID: userID, Name: req.Name, Description: req.Description,
		Points: req.Points, DistanceKm: req.DistanceKm,
		Difficulty: req.Difficulty, Country: req.Country, Region: req.Region,
	})
	if err != nil {
		return middleware.MapDomainError(err)
	}
	return c.Status(fiber.StatusCreated).JSON(toRouteResponse(r))
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid route id")
	}
	r, err := h.useCase.GetByID(c.UserContext(), id)
	if err != nil {
		return middleware.MapDomainError(err)
	}
	return c.JSON(toRouteResponse(r))
}

func (h *Handler) List(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	offset := c.QueryInt("offset", 0)
	country := c.Query("country")
	difficulty := c.Query("difficulty")
	routes, err := h.useCase.List(c.UserContext(), limit, offset, country, difficulty)
	if err != nil {
		return middleware.MapDomainError(err)
	}
	resp := make([]*RouteResponse, 0, len(routes))
	for _, r := range routes {
		resp = append(resp, toRouteResponse(r))
	}
	return c.JSON(fiber.Map{"data": resp, "limit": limit, "offset": offset})
}

func (h *Handler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid route id")
	}
	userIDStr := middleware.GetUserID(c)
	userID, _ := uuid.Parse(userIDStr)
	var req UpdateRouteRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	r, err := h.useCase.Update(c.UserContext(), id, userID, UpdateInput{
		Name: req.Name, Description: req.Description, Points: req.Points,
		DistanceKm: req.DistanceKm, Difficulty: req.Difficulty,
		Country: req.Country, Region: req.Region,
	})
	if err != nil {
		return middleware.MapDomainError(err)
	}
	return c.JSON(toRouteResponse(r))
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid route id")
	}
	userIDStr := middleware.GetUserID(c)
	userID, _ := uuid.Parse(userIDStr)
	if err := h.useCase.Delete(c.UserContext(), id, userID); err != nil {
		return middleware.MapDomainError(err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}
