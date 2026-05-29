package app

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Genericlogin1/enduro/backend/internal/auth"
	"github.com/Genericlogin1/enduro/backend/internal/config"
	"github.com/Genericlogin1/enduro/backend/internal/delivery/http/middleware"
	"github.com/Genericlogin1/enduro/backend/internal/delivery/http/route"
	"github.com/Genericlogin1/enduro/backend/internal/infrastructure/postgres"
	"github.com/Genericlogin1/enduro/backend/internal/post"
	"github.com/Genericlogin1/enduro/backend/internal/route_module"
	"github.com/Genericlogin1/enduro/backend/internal/tour"
	"github.com/Genericlogin1/enduro/backend/internal/user"
)

type App struct {
	fiber  *fiber.App
	db     *pgxpool.Pool
	logger *slog.Logger
	cfg    *config.Config
}

func New(ctx context.Context, cfg *config.Config, logger *slog.Logger) (*App, error) {
	// Database
	db, err := postgres.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("database connection: %w", err)
	}
	logger.Info("database connected")

	// Transaction manager
	txManager := postgres.NewTxManager(db)

	// Repositories
	userRepo := user.NewRepository(db)
	postRepo := post.NewRepository(db)
	routeRepo := route_module.NewRepository(db)
	tourRepo := tour.NewRepository(db)

	// Use cases
	userUC := user.NewUseCase(userRepo, txManager)
	authUC := auth.NewUseCase(userRepo, cfg.JWTSecret, cfg.JWTAccessTTL)
	postUC := post.NewUseCase(postRepo, txManager)
	routeUC := route_module.NewUseCase(routeRepo, txManager)
	tourUC := tour.NewUseCase(tourRepo, txManager)

	// Fiber app
	app := fiber.New(fiber.Config{
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
		ErrorHandler: middleware.ErrorHandler,
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(requestid.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))
	app.Use(middleware.RequestLogger(logger))

	// Routes
	route.Register(app, &route.Dependencies{
		Logger:   logger,
		JWTKey:   []byte(cfg.JWTSecret),
		UserUC:   userUC,
		AuthUC:   authUC,
		PostUC:   postUC,
		RouteUC:  routeUC,
		TourUC:   tourUC,
	})

	return &App{fiber: app, db: db, logger: logger, cfg: cfg}, nil
}

func (a *App) Run() error {
	a.logger.Info("HTTP server starting", "port", a.cfg.HTTPPort)
	return a.fiber.Listen(":" + a.cfg.HTTPPort)
}

func (a *App) Shutdown(ctx context.Context) error {
	if err := a.fiber.ShutdownWithContext(ctx); err != nil {
		return fmt.Errorf("http server shutdown: %w", err)
	}
	a.db.Close()
	a.logger.Info("database pool closed")
	return nil
}
