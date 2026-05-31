package user

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/user/handler"
	"enduro/pkg/middleware"
	jwtutil "enduro/pkg/jwt"
)

func RegisterRoutes(router fiber.Router, h *handler.UserHandler, jwtManager *jwtutil.Manager) {
	auth := middleware.Auth(jwtManager)

	// /users/me MUST be registered before /users/:id — Fiber matches :id first otherwise
	router.Get("/users/me", auth, h.GetMe)

	// Public read
	router.Get("/users", h.List)
	router.Get("/users/:id", h.GetByID)
	router.Post("/users", auth, h.Create)
	router.Patch("/users/:id", auth, h.Update)
	router.Delete("/users/:id", auth, h.Delete)
}
