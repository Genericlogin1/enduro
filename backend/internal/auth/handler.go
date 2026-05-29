package auth

import (
	"log/slog"

	"github.com/gofiber/fiber/v2"

	"github.com/Genericlogin1/enduro/backend/internal/delivery/http/middleware"
	"github.com/Genericlogin1/enduro/backend/internal/user"
)

// Handler handles HTTP requests for auth endpoints
type Handler struct {
	useCase *UseCase
	logger  *slog.Logger
}

func NewHandler(useCase *UseCase, logger *slog.Logger) *Handler {
	return &Handler{useCase: useCase, logger: logger}
}

// RegisterRequest DTO
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

// LoginRequest DTO
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse DTO
type AuthResponse struct {
	AccessToken string            `json:"access_token"`
	User        *user.UserPublic  `json:"user"`
}

// Register POST /api/v1/auth/register
func (h *Handler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	result, err := h.useCase.Register(c.UserContext(), RegisterInput{
		Email:    req.Email,
		Password: req.Password,
		Name:     req.Name,
	})
	if err != nil {
		return middleware.MapDomainError(err)
	}

	return c.Status(fiber.StatusCreated).JSON(AuthResponse{
		AccessToken: result.AccessToken,
		User:        user.ToPublic(result.User),
	})
}

// Login POST /api/v1/auth/login
func (h *Handler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	result, err := h.useCase.Login(c.UserContext(), LoginInput{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		return middleware.MapDomainError(err)
	}

	return c.JSON(AuthResponse{
		AccessToken: result.AccessToken,
		User:        user.ToPublic(result.User),
	})
}
