package activity

import (
	"github.com/gofiber/fiber/v2"
	"enduro/internal/activity/handler"
)

func RegisterRoutes(r fiber.Router, h *handler.ActivityHandler) {
	r.Get("/activity", h.List)
}
