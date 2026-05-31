package ride

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/ride/handler"
	"enduro/pkg/middleware"
	jwtutil "enduro/pkg/jwt"
)

func RegisterRoutes(r fiber.Router, h *handler.RideHandler, jwtManager *jwtutil.Manager) {
	auth := middleware.Auth(jwtManager)
	optAuth := middleware.OptionalAuth(jwtManager)

	r.Get("/rides", optAuth, h.List)
	r.Post("/rides", auth, h.Create)
	r.Get("/rides/:id", optAuth, h.GetByID)
	r.Delete("/rides/:id", auth, h.Delete)
	r.Post("/rides/:id/join", auth, h.Join)
	r.Post("/rides/:id/leave", auth, h.Leave)
	r.Get("/rides/:id/participants", h.Participants)
}
