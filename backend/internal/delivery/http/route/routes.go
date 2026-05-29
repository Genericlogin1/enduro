package route

import (
	"log/slog"

	"github.com/gofiber/fiber/v2"

	"github.com/Genericlogin1/enduro/backend/internal/auth"
	"github.com/Genericlogin1/enduro/backend/internal/delivery/http/middleware"
	"github.com/Genericlogin1/enduro/backend/internal/post"
	"github.com/Genericlogin1/enduro/backend/internal/route_module"
	"github.com/Genericlogin1/enduro/backend/internal/tour"
	"github.com/Genericlogin1/enduro/backend/internal/user"
)

// Dependencies holds all use cases needed for routing
type Dependencies struct {
	Logger  *slog.Logger
	JWTKey  []byte
	UserUC  *user.UseCase
	AuthUC  *auth.UseCase
	PostUC  *post.UseCase
	RouteUC *route_module.UseCase
	TourUC  *tour.UseCase
}

// Register sets up all routes
func Register(app *fiber.App, deps *Dependencies) {
	// Health check
	app.Get("/health", healthHandler(deps))

	api := app.Group("/api/v1")

	// Auth routes (public)
	authHandler := auth.NewHandler(deps.AuthUC, deps.Logger)
	authGroup := api.Group("/auth")
	authGroup.Post("/register", authHandler.Register)
	authGroup.Post("/login", authHandler.Login)

	// Protected routes
	jwtMW := middleware.JWTMiddleware(deps.JWTKey)

	// User routes
	userHandler := user.NewHandler(deps.UserUC, deps.Logger)
	userGroup := api.Group("/users", jwtMW)
	userGroup.Post("/", userHandler.Create)
	userGroup.Get("/", userHandler.List)
	userGroup.Get("/:id", userHandler.GetByID)
	userGroup.Patch("/:id", userHandler.Update)
	userGroup.Delete("/:id", userHandler.Delete)

	// Post routes
	postHandler := post.NewHandler(deps.PostUC, deps.Logger)
	postGroup := api.Group("/posts")
	postGroup.Get("/", postHandler.List)
	postGroup.Get("/:id", postHandler.GetByID)
	postGroup.Post("/", jwtMW, postHandler.Create)
	postGroup.Patch("/:id", jwtMW, postHandler.Update)
	postGroup.Delete("/:id", jwtMW, postHandler.Delete)
	postGroup.Post("/:id/like", jwtMW, postHandler.Like)

	// Route (trail) routes
	routeHandler := route_module.NewHandler(deps.RouteUC, deps.Logger)
	routeGroup := api.Group("/routes")
	routeGroup.Get("/", routeHandler.List)
	routeGroup.Get("/:id", routeHandler.GetByID)
	routeGroup.Post("/", jwtMW, routeHandler.Create)
	routeGroup.Patch("/:id", jwtMW, routeHandler.Update)
	routeGroup.Delete("/:id", jwtMW, routeHandler.Delete)

	// Tour routes
	tourHandler := tour.NewHandler(deps.TourUC, deps.Logger)
	tourGroup := api.Group("/tours")
	tourGroup.Get("/", tourHandler.List)
	tourGroup.Get("/:id", tourHandler.GetByID)
	tourGroup.Post("/", jwtMW, tourHandler.Create)
	tourGroup.Patch("/:id", jwtMW, tourHandler.Update)
	tourGroup.Delete("/:id", jwtMW, tourHandler.Delete)
}

func healthHandler(deps *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "enduro-world-api",
		})
	}
}
