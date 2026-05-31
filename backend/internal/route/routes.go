package route

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/route/handler"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/middleware"
)

func RegisterRoutes(router fiber.Router, h *handler.RouteHandler, jwtManager *jwtutil.Manager) {
	auth    := middleware.Auth(jwtManager)
	optAuth := middleware.OptionalAuth(jwtManager)

	router.Get("/routes", h.List)
	router.Get("/routes/:id", optAuth, h.GetByID)

	router.Post("/routes", auth, h.Create)
	router.Patch("/routes/:id", auth, h.Update)
	router.Delete("/routes/:id", auth, h.Delete)
	router.Post("/routes/:id/rate", auth, h.Rate)
}
