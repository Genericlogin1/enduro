package stats

import (
	"github.com/gofiber/fiber/v2"
	"enduro/internal/stats/handler"
)

func RegisterRoutes(r fiber.Router, h *handler.StatsHandler) {
	r.Get("/users/:id/stats", h.GetUserStats)
}
