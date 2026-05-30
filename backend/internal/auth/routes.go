package auth

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/auth/handler"
)

func RegisterRoutes(router fiber.Router, h *handler.AuthHandler) {
	auth := router.Group("/auth")
	auth.Post("/register", h.Register)
	auth.Post("/login", h.Login)
}
