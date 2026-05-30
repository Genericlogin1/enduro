package user

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/user/handler"
	"enduro/pkg/middleware"
	jwtutil "enduro/pkg/jwt"
)

func RegisterRoutes(router fiber.Router, h *handler.UserHandler, jwtManager *jwtutil.Manager) {
	users := router.Group("/users", middleware.Auth(jwtManager))
	users.Post("/", h.Create)
	users.Get("/", h.List)
	users.Get("/:id", h.GetByID)
	users.Patch("/:id", h.Update)
	users.Delete("/:id", h.Delete)
}
