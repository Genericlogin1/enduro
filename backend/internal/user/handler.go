package user

import (
	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/Genericlogin1/enduro/backend/internal/delivery/http/middleware"
)

// Handler handles HTTP requests for user endpoints
type Handler struct {
	useCase *UseCase
	logger  *slog.Logger
}

func NewHandler(useCase *UseCase, logger *slog.Logger) *Handler {
	return &Handler{useCase: useCase, logger: logger}
}

// CreateUserRequest is the request DTO
type CreateUserRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Name     string `json:"name" validate:"required"`
}

// UpdateUserRequest is the PATCH request DTO
type UpdateUserRequest struct {
	Name      *string `json:"name"`
	Bio       *string `json:"bio"`
	AvatarURL *string `json:"avatar_url"`
}

// UserResponse is the response DTO
type UserResponse struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Bio       string `json:"bio"`
	AvatarURL string `json:"avatar_url"`
	CreatedAt string `json:"created_at"`
}

func toUserResponse(u *User) *UserResponse {
	return &UserResponse{
		ID:        u.ID.String(),
		Email:     u.Email,
		Name:      u.Name,
		Bio:       u.Bio,
		AvatarURL: u.AvatarURL,
		CreatedAt: u.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

// Create POST /api/v1/users
func (h *Handler) Create(c *fiber.Ctx) error {
	var req CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	u, err := h.useCase.Create(c.UserContext(), CreateInput{
		Email:    req.Email,
		Password: req.Password,
		Name:     req.Name,
	})
	if err != nil {
		return middleware.MapDomainError(err)
	}

	return c.Status(fiber.StatusCreated).JSON(toUserResponse(u))
}

// GetByID GET /api/v1/users/:id
func (h *Handler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid user id")
	}

	u, err := h.useCase.GetByID(c.UserContext(), id)
	if err != nil {
		return middleware.MapDomainError(err)
	}

	return c.JSON(toUserResponse(u))
}

// List GET /api/v1/users
func (h *Handler) List(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	offset := c.QueryInt("offset", 0)

	users, err := h.useCase.List(c.UserContext(), limit, offset)
	if err != nil {
		return middleware.MapDomainError(err)
	}

	resp := make([]*UserResponse, 0, len(users))
	for _, u := range users {
		resp = append(resp, toUserResponse(u))
	}

	return c.JSON(fiber.Map{"data": resp, "limit": limit, "offset": offset})
}

// Update PATCH /api/v1/users/:id
func (h *Handler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid user id")
	}

	var req UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	u, err := h.useCase.Update(c.UserContext(), id, UpdateInput{
		Name:      req.Name,
		Bio:       req.Bio,
		AvatarURL: req.AvatarURL,
	})
	if err != nil {
		return middleware.MapDomainError(err)
	}

	return c.JSON(toUserResponse(u))
}

// Delete DELETE /api/v1/users/:id
func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid user id")
	}

	if err := h.useCase.Delete(c.UserContext(), id); err != nil {
		return middleware.MapDomainError(err)
	}

	return c.SendStatus(fiber.StatusNoContent)
}
