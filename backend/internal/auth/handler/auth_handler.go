package handler

import (
	"github.com/gofiber/fiber/v2"

	authdto "enduro/internal/auth/dto"
	"enduro/internal/auth/usecase"
	"enduro/pkg/response"
)

type AuthHandler struct {
	uc usecase.AuthUsecase
}

func NewAuthHandler(uc usecase.AuthUsecase) *AuthHandler {
	return &AuthHandler{uc: uc}
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req authdto.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	resp, err := h.uc.Register(c.UserContext(), req)
	if err != nil {
		return response.Error(c, err)
	}
	return response.Created(c, resp)
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req authdto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.ErrBadRequest)
	}
	resp, err := h.uc.Login(c.UserContext(), req)
	if err != nil {
		return response.Error(c, err)
	}
	return response.OK(c, resp)
}
