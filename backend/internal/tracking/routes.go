package tracking

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/tracking/handler"
	"enduro/pkg/middleware"
	jwtutil "enduro/pkg/jwt"
)

func RegisterRoutes(router fiber.Router, h *handler.TrackingHandler, jwtManager *jwtutil.Manager) {
	tr := router.Group("/tracking", middleware.Auth(jwtManager))
	tr.Get("/sessions", h.ListSessions)
	tr.Post("/sessions", h.StartSession)
	tr.Patch("/sessions/:id/finish", h.FinishSession)
	tr.Get("/sessions/:id", h.GetSession)
	tr.Post("/sessions/:id/points", h.AddPoints)

	// WebSocket — auth via ?token= query param
	router.Get("/tracking/ws", h.WSUpgrade, h.WSHandler())
}
