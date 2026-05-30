package tour

import (
	"github.com/gofiber/fiber/v2"
	"enduro/internal/tour/handler"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/middleware"
)

func RegisterRoutes(app *fiber.App, h *handler.TourHandler, jwtManager *jwtutil.Manager) {
	g := app.Group("/api/v1/tours")
	g.Get("/", h.List)
	g.Get("/:id", h.GetByID)
	g.Post("/", middleware.Auth(jwtManager), h.Create)
	g.Patch("/:id", middleware.Auth(jwtManager), h.Update)
	g.Delete("/:id", middleware.Auth(jwtManager), h.Delete)
	g.Post("/:id/register", middleware.Auth(jwtManager), h.Register)
}
