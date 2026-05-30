package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"enduro/internal/tour/dto"
	"enduro/internal/tour/usecase"
	"enduro/pkg/middleware"
	"enduro/pkg/response"
)

type TourHandler struct{ uc usecase.TourUsecase }

func NewTourHandler(uc usecase.TourUsecase) *TourHandler { return &TourHandler{uc: uc} }

func (h *TourHandler) Create(c *fiber.Ctx) error {
	callerID, _ := middleware.UserIDFromCtx(c)
	var req dto.CreateTourRequest
	if err := c.BodyParser(&req); err != nil { return response.Error(c, fiber.ErrBadRequest) }
	resp, err := h.uc.Create(c.UserContext(), callerID, req)
	if err != nil { return response.Error(c, err) }
	return response.Created(c, resp)
}

func (h *TourHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil { return response.Error(c, fiber.ErrBadRequest) }
	callerID, _ := middleware.UserIDFromCtx(c)
	resp, err := h.uc.GetByID(c.UserContext(), id, callerID)
	if err != nil { return response.Error(c, err) }
	return response.OK(c, resp)
}

func (h *TourHandler) List(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	offset := c.QueryInt("offset", 0)
	callerID, _ := middleware.UserIDFromCtx(c)

	if orgStr := c.Query("organizer_id"); orgStr != "" {
		orgID, err := uuid.Parse(orgStr)
		if err != nil { return response.Error(c, fiber.ErrBadRequest) }
		resp, err := h.uc.ListByOrganizer(c.UserContext(), orgID, limit, offset, callerID)
		if err != nil { return response.Error(c, err) }
		return response.OK(c, fiber.Map{"tours": resp})
	}

	resp, err := h.uc.List(c.UserContext(), limit, offset, callerID)
	if err != nil { return response.Error(c, err) }
	return response.OK(c, fiber.Map{"tours": resp})
}

func (h *TourHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil { return response.Error(c, fiber.ErrBadRequest) }
	callerID, _ := middleware.UserIDFromCtx(c)
	var req dto.CreateTourRequest
	if err := c.BodyParser(&req); err != nil { return response.Error(c, fiber.ErrBadRequest) }
	resp, err := h.uc.Update(c.UserContext(), id, callerID, req)
	if err != nil { return response.Error(c, err) }
	return response.OK(c, resp)
}

func (h *TourHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil { return response.Error(c, fiber.ErrBadRequest) }
	callerID, _ := middleware.UserIDFromCtx(c)
	if err := h.uc.Delete(c.UserContext(), id, callerID); err != nil { return response.Error(c, err) }
	return response.NoContent(c)
}

func (h *TourHandler) Register(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil { return response.Error(c, fiber.ErrBadRequest) }
	callerID, _ := middleware.UserIDFromCtx(c)
	registered, err := h.uc.ToggleRegister(c.UserContext(), id, callerID)
	if err != nil { return response.Error(c, err) }
	return response.OK(c, fiber.Map{"registered": registered})
}
