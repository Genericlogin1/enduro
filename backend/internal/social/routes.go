package social

import (
	"github.com/gofiber/fiber/v2"

	"enduro/internal/social/handler"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/middleware"
)

func RegisterRoutes(router fiber.Router, h *handler.SocialHandler, jwtManager *jwtutil.Manager) {
	// Follow / unfollow
	users := router.Group("/users")
	users.Get("/:id/followers", h.GetFollowers)
	users.Get("/:id/following", h.GetFollowing)
	users.Post("/:id/follow", middleware.Auth(jwtManager), h.Follow)
	users.Delete("/:id/follow", middleware.Auth(jwtManager), h.Unfollow)
	users.Get("/:id/is-following", middleware.Auth(jwtManager), h.IsFollowing)

	// Comments on posts
	posts := router.Group("/posts")
	posts.Get("/:id/comments", h.ListComments)
	posts.Post("/:id/comments", middleware.Auth(jwtManager), h.AddComment)
	posts.Delete("/:id/comments/:comment_id", middleware.Auth(jwtManager), h.DeleteComment)
}
