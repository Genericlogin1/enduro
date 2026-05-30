package report

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/report/handler"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/middleware"
)

func RegisterRoutes(app *fiber.App, h *handler.ReportHandler, jwtManager *jwtutil.Manager) {
	rg := app.Group("/api/v1/reports")
	rg.Get("/", h.List)
	rg.Get("/:id", h.GetByID)
	rg.Post("/", middleware.Auth(jwtManager), h.Create)
	rg.Patch("/:id", middleware.Auth(jwtManager), h.Update)
	rg.Delete("/:id", middleware.Auth(jwtManager), h.Delete)
	rg.Post("/:id/like", middleware.Auth(jwtManager), h.ToggleLike)
}
