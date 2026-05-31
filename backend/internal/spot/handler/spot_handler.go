package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"enduro/internal/spot/dto"
	"enduro/internal/spot/entity"
	"enduro/internal/spot/usecase"
	"enduro/pkg/middleware"
	"enduro/pkg/response"
)

type SpotHandler struct {
	uc *usecase.SpotUsecase
}

func NewSpotHandler(uc *usecase.SpotUsecase) *SpotHandler {
	return &SpotHandler{uc: uc}
}

func spotToResp(sp *entity.Spot) dto.SpotResponse {
	return dto.SpotResponse{
		ID:          sp.ID.String(),
		AuthorID:    sp.AuthorID.String(),
		AuthorName:  sp.AuthorName,
		Title:       sp.Title,
		Description: sp.Description,
		Kind:        sp.Kind,
		Lat:         sp.Lat,
		Lng:         sp.Lng,
		Country:     sp.Country,
		Upvotes:     sp.Upvotes,
		MyVote:      sp.MyVote,
		CreatedAt:   sp.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

// GET /spots?kind=danger&min_lat=&max_lat=&min_lng=&max_lng=&limit=&offset=
func (h *SpotHandler) List(c *fiber.Ctx) error {
	f := dto.ListSpotsFilter{Kind: c.Query("kind")}
	if v := c.Query("min_lat"); v != "" {
		f.MinLat, _ = strconv.ParseFloat(v, 64)
		f.MaxLat, _ = strconv.ParseFloat(c.Query("max_lat"), 64)
		f.MinLng, _ = strconv.ParseFloat(c.Query("min_lng"), 64)
		f.MaxLng, _ = strconv.ParseFloat(c.Query("max_lng"), 64)
		f.HasBbox = true
	}
	limit := c.QueryInt("limit", 200)
	offset := c.QueryInt("offset", 0)

	spots, err := h.uc.List(c.UserContext(), f, limit, offset)
	if err != nil {
		return response.Error(c, err)
	}
	out := make([]dto.SpotResponse, 0, len(spots))
	for _, sp := range spots {
		out = append(out, spotToResp(sp))
	}
	return response.OK(c, fiber.Map{"spots": out})
}

// POST /spots
func (h *SpotHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateSpotRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	if req.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fiber.Map{"code": "VALIDATION", "message": "title required"}})
	}
	authorID, ok := middleware.UserIDFromCtx(c)
	if !ok {
		return response.Error(c, fiber.ErrUnauthorized)
	}
	sp, err := h.uc.Create(c.UserContext(), req, authorID)
	if err != nil {
		return response.Error(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(spotToResp(sp))
}

// DELETE /spots/:id
func (h *SpotHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	authorID, ok := middleware.UserIDFromCtx(c)
	if !ok {
		return response.Error(c, fiber.ErrUnauthorized)
	}
	if err := h.uc.Delete(c.UserContext(), id, authorID); err != nil {
		return response.Error(c, err)
	}
	return response.NoContent(c)
}

// POST /spots/:id/vote   body: {"value": 1 | -1 | 0}
func (h *SpotHandler) Vote(c *fiber.Ctx) error {
	spotID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	userID, ok := middleware.UserIDFromCtx(c)
	if !ok {
		return response.Error(c, fiber.ErrUnauthorized)
	}
	var body struct {
		Value int `json:"value"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	if body.Value < -1 || body.Value > 1 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fiber.Map{"code": "VALIDATION", "message": "value must be -1, 0, or 1"}})
	}
	total, err := h.uc.Vote(c.UserContext(), spotID, userID, body.Value)
	if err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, fiber.Map{"upvotes": total, "my_vote": body.Value})
}
