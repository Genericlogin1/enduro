package route

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/route/handler"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/middleware"
)

func RegisterRoutes(router fiber.Router, h *handler.RouteHandler, jwtManager *jwtutil.Manager) {
	routes := router.Group("/routes")
	routes.Get("/", h.List)
	routes.Get("/:id", h.GetByID)

	auth := routes.Group("/", middleware.Auth(jwtManager))
	auth.Post("/", h.Create)
	auth.Patch("/:id", h.Update)
	auth.Delete("/:id", h.Delete)
}
