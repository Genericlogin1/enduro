package garage

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/garage/handler"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/middleware"
)

func RegisterRoutes(router fiber.Router, h *handler.GarageHandler, jwtManager *jwtutil.Manager) {
	g := router.Group("/garage", middleware.Auth(jwtManager))
	g.Get("/", h.ListBikes)
	g.Post("/", h.AddBike)
	g.Delete("/:id", h.DeleteBike)
}
