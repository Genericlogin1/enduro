package tracking

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/tracking/handler"
	"enduro/pkg/middleware"
	jwtutil "enduro/pkg/jwt"
)

func RegisterRoutes(router fiber.Router, h *handler.TrackingHandler, jwtManager *jwtutil.Manager) {
	auth := middleware.Auth(jwtManager)

	// Protected routes — require JWT
	router.Get("/tracking/sessions", auth, h.ListSessions)
	router.Post("/tracking/sessions", auth, h.StartSession)
	router.Patch("/tracking/sessions/:id/finish", auth, h.FinishSession)
	router.Get("/tracking/sessions/:id", auth, h.GetSession)
	router.Get("/tracking/sessions/:id/gpx", auth, h.ExportGPX)
	router.Post("/tracking/sessions/:id/points", auth, h.AddPoints)

	// WebSocket — auth via ?token= query param
	router.Get("/tracking/ws", h.WSUpgrade, h.WSHandler())

	// Public: live view by share token (no auth required)
	router.Get("/tracking/live/:token", h.LiveSession)
}
