package tour

import (
	"github.com/gofiber/fiber/v2"
	"enduro/internal/tour/handler"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/middleware"
)

func RegisterRoutes(app *fiber.App, h *handler.TourHandler, jwtManager *jwtutil.Manager) {
	auth := middleware.Auth(jwtManager)
	optAuth := middleware.OptionalAuth(jwtManager)

	g := app.Group("/api/v1/tours")
	g.Get("/", optAuth, h.List)
	g.Get("/:id", optAuth, h.GetByID)
	g.Post("/", auth, h.Create)
	g.Patch("/:id", auth, h.Update)
	g.Delete("/:id", auth, h.Delete)
	g.Post("/:id/register", auth, h.Register)
	g.Post("/:id/book", optAuth, h.BookTour)   // Public — no auth required to send inquiry

	// Organizer dashboard
	app.Get("/api/v1/bookings", auth, h.ListBookings)
}
