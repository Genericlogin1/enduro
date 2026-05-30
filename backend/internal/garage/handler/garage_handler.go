package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"enduro/internal/garage/dto"
	"enduro/internal/garage/usecase"
	"enduro/pkg/middleware"
	"enduro/pkg/response"
)

type GarageHandler struct {
	uc usecase.GarageUsecase
}

func NewGarageHandler(uc usecase.GarageUsecase) *GarageHandler {
	return &GarageHandler{uc: uc}
}

func (h *GarageHandler) AddBike(c *fiber.Ctx) error {
	callerID, _ := middleware.UserIDFromCtx(c)
	var req dto.AddBikeRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	if req.Make == "" || req.Model == "" {
		return response.Error(c, fiber.ErrBadRequest)
	}
	resp, err := h.uc.AddBike(c.UserContext(), callerID, req)
	if err != nil {
		return response.Error(c, err)
	}
	return response.Created(c, resp)
}

func (h *GarageHandler) ListBikes(c *fiber.Ctx) error {
	callerID, _ := middleware.UserIDFromCtx(c)
	bikes, err := h.uc.ListBikes(c.UserContext(), callerID)
	if err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, fiber.Map{"bikes": bikes})
}

func (h *GarageHandler) DeleteBike(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	callerID, _ := middleware.UserIDFromCtx(c)
	if err := h.uc.DeleteBike(c.UserContext(), id, callerID); err != nil {
		return response.Error(c, err)
	}
	return response.NoContent(c)
}
