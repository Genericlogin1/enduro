package post

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/post/handler"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/middleware"
)

func RegisterRoutes(router fiber.Router, h *handler.PostHandler, jwtManager *jwtutil.Manager) {
	posts := router.Group("/posts")
	posts.Get("/", h.List)
	posts.Get("/:id", h.GetByID)

	auth := posts.Group("/", middleware.Auth(jwtManager))
	auth.Post("/", h.Create)
	auth.Patch("/:id", h.Update)
	auth.Delete("/:id", h.Delete)
	auth.Post("/:id/like", h.ToggleLike)
}
