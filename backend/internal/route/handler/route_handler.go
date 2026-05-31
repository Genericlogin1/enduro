package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"enduro/internal/route/dto"
	"enduro/internal/route/usecase"
	"enduro/pkg/middleware"
	"enduro/pkg/response"
)

type RouteHandler struct {
	uc usecase.RouteUsecase
}

func NewRouteHandler(uc usecase.RouteUsecase) *RouteHandler {
	return &RouteHandler{uc: uc}
}

func (h *RouteHandler) Create(c *fiber.Ctx) error {
	callerID, _ := middleware.UserIDFromCtx(c)
	var req dto.CreateRouteRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	resp, err := h.uc.Create(c.UserContext(), callerID, req)
	if err != nil {
		return response.Error(c, err)
	}
	return response.Created(c, resp)
}

func (h *RouteHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	callerID, ok := middleware.UserIDFromCtx(c)
	var resp dto.RouteResponse
	if ok {
		resp, err = h.uc.GetByIDForUser(c.UserContext(), id, callerID)
	} else {
		resp, err = h.uc.GetByID(c.UserContext(), id)
	}
	if err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, resp)
}

func (h *RouteHandler) List(c *fiber.Ctx) error {
	filter := dto.ListRoutesFilter{
		Limit:  c.QueryInt("limit", 20),
		Offset: c.QueryInt("offset", 0),
		Search: c.Query("search"),
		SortBy: c.Query("sort_by"),
	}
	if d := c.Query("difficulty"); d != "" {
		filter.Difficulty = &d
	}
	if ct := c.Query("country"); ct != "" {
		filter.Country = &ct
	}
	if a := c.Query("author_id"); a != "" {
		if id, err := uuid.Parse(a); err == nil {
			filter.AuthorID = &id
		}
	}
	resp, err := h.uc.List(c.UserContext(), filter)
	if err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, fiber.Map{"routes": resp})
}

func (h *RouteHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	callerID, _ := middleware.UserIDFromCtx(c)
	var req dto.UpdateRouteRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	resp, err := h.uc.Update(c.UserContext(), id, callerID, req)
	if err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, resp)
}

func (h *RouteHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	callerID, _ := middleware.UserIDFromCtx(c)
	if err := h.uc.Delete(c.UserContext(), id, callerID); err != nil {
		return response.Error(c, err)
	}
	return response.NoContent(c)
}

func (h *RouteHandler) Rate(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	callerID, _ := middleware.UserIDFromCtx(c)
	var body struct {
		Rating int `json:"rating"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	if err := h.uc.Rate(c.UserContext(), id, callerID, body.Rating); err != nil {
		return response.Error(c, err)
	}
	return c.JSON(fiber.Map{"ok": true})
}
