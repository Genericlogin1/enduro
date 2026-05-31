package post

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/post/handler"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/middleware"
)

func RegisterRoutes(router fiber.Router, h *handler.PostHandler, jwtManager *jwtutil.Manager) {
	auth := middleware.Auth(jwtManager)
	optAuth := middleware.OptionalAuth(jwtManager)

	// Public — but with optional auth to populate liked_by_me
	router.Get("/posts", optAuth, h.List)
	router.Get("/posts/:id", optAuth, h.GetByID)

	// Protected — per-route to avoid Fiber Group middleware leak
	router.Post("/posts", auth, h.Create)
	router.Patch("/posts/:id", auth, h.Update)
	router.Delete("/posts/:id", auth, h.Delete)
	router.Post("/posts/:id/like", auth, h.ToggleLike)
}
