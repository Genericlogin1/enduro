package spot

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/spot/handler"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/middleware"
)

func RegisterRoutes(router fiber.Router, h *handler.SpotHandler, jwtManager *jwtutil.Manager) {
	auth := middleware.Auth(jwtManager)

	router.Get("/spots", h.List)
	router.Post("/spots", auth, h.Create)
	router.Delete("/spots/:id", auth, h.Delete)
	router.Post("/spots/:id/vote", auth, h.Vote)
}
