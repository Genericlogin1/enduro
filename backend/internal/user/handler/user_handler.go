package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"enduro/internal/user/dto"
	"enduro/internal/user/usecase"
	"enduro/pkg/middleware"
	"enduro/pkg/response"
)

type UserHandler struct {
	uc usecase.UserUsecase
}

func NewUserHandler(uc usecase.UserUsecase) *UserHandler {
	return &UserHandler{uc: uc}
}

func (h *UserHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	resp, err := h.uc.Create(c.UserContext(), req)
	if err != nil {
		return response.Error(c, err)
	}
	return response.Created(c, resp)
}

func (h *UserHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	resp, err := h.uc.GetByID(c.UserContext(), id)
	if err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, resp)
}

func (h *UserHandler) List(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	offset := c.QueryInt("offset", 0)
	q := c.Query("search")
	if q != "" {
		resp, err := h.uc.Search(c.UserContext(), q, limit)
		if err != nil { return response.Error(c, err) }
		return response.OK(c, fiber.Map{"users": resp})
	}
	resp, err := h.uc.List(c.UserContext(), limit, offset)
	if err != nil { return response.Error(c, err) }
	return response.OK(c, fiber.Map{"users": resp})
}

func (h *UserHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}

	callerID, ok := middleware.UserIDFromCtx(c)
	if !ok || callerID != id {
		return response.Error(c, fiber.ErrForbidden)
	}

	var req dto.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	resp, err := h.uc.Update(c.UserContext(), id, req)
	if err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, resp)
}

func (h *UserHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}

	callerID, ok := middleware.UserIDFromCtx(c)
	if !ok || callerID != id {
		return response.Error(c, fiber.ErrForbidden)
	}

	if err := h.uc.Delete(c.UserContext(), id); err != nil {
		return response.Error(c, err)
	}
	return response.NoContent(c)
}
