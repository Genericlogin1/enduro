package bikecat

import (
	"github.com/gofiber/fiber/v2"
	"enduro/internal/bikecat/handler"
)

func RegisterRoutes(router fiber.Router, h *handler.BikeCatalogHandler) {
	router.Get("/bike-brands", h.ListBrands)
	router.Get("/bike-models", h.ListModels)
}
