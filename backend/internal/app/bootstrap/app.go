package bootstrap

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"

	"enduro/configs"
	authdomain "enduro/internal/auth"
	authhandler "enduro/internal/auth/handler"
	authusecase "enduro/internal/auth/usecase"
	postdomain "enduro/internal/post"
	posthandler "enduro/internal/post/handler"
	postrepo "enduro/internal/post/repository/postgres"
	postusecase "enduro/internal/post/usecase"
	routedomain "enduro/internal/route"
	routehandler "enduro/internal/route/handler"
	routerepo "enduro/internal/route/repository/postgres"
	routeusecase "enduro/internal/route/usecase"
	socialdomain "enduro/internal/social"
	socialhandler "enduro/internal/social/handler"
	socialrepo "enduro/internal/social/repository/postgres"
	socialusecase "enduro/internal/social/usecase"
	garagedomain "enduro/internal/garage"
	garagehandler "enduro/internal/garage/handler"
	garagerepo "enduro/internal/garage/repository/postgres"
	garageusecase "enduro/internal/garage/usecase"
	reportdomain "enduro/internal/report"
	reporthandler "enduro/internal/report/handler"
	reportrepo "enduro/internal/report/repository/postgres"
	reportusecase "enduro/internal/report/usecase"
	activity "enduro/internal/activity"
	activityhandler "enduro/internal/activity/handler"
	bikecat "enduro/internal/bikecat"
	bikecathandler "enduro/internal/bikecat/handler"
	spotdomain "enduro/internal/spot"
	spothandler "enduro/internal/spot/handler"
	spotrepo "enduro/internal/spot/repository/postgres"
	spotusecase "enduro/internal/spot/usecase"
	tourdomain "enduro/internal/tour"
	tourhandler "enduro/internal/tour/handler"
	tourrepo "enduro/internal/tour/repository/postgres"
	tourusecase "enduro/internal/tour/usecase"
	trackingdomain "enduro/internal/tracking"
	trackinghandler "enduro/internal/tracking/handler"
	trackingrepo "enduro/internal/tracking/repository/postgres"
	trackingusecase "enduro/internal/tracking/usecase"
	userdomain "enduro/internal/user"
	userhandler "enduro/internal/user/handler"
	userrepo "enduro/internal/user/repository/postgres"
	userusecase "enduro/internal/user/usecase"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/middleware"
)

func Run(cfg *configs.Config, log *slog.Logger) error {
	// ── Database ─────────────────────────────────────────────────────────────
	pool, err := pgxpool.New(context.Background(), cfg.Database.URL)
	if err != nil {
		return fmt.Errorf("db connect: %w", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		return fmt.Errorf("db ping: %w", err)
	}
	log.Info("database connected")

	// ── JWT ───────────────────────────────────────────────────────────────────
	jwtManager := jwtutil.NewManager(cfg.JWT.Secret, cfg.JWT.AccessTTL)

	// ── Repositories ─────────────────────────────────────────────────────────
	userRepository     := userrepo.NewUserRepository(pool)
	postRepository     := postrepo.NewPostRepository(pool)
	routeRepository    := routerepo.NewRouteRepository(pool)
	socialRepository   := socialrepo.NewSocialRepository(pool)
	trackingRepository := trackingrepo.NewTrackingRepository(pool)
	garageRepository   := garagerepo.NewGarageRepository(pool)
	reportRepository   := reportrepo.NewReportRepository(pool)
	tourRepository     := tourrepo.NewTourRepository(pool)
	spotRepository     := spotrepo.NewSpotRepository(pool)

	// ── Usecases ─────────────────────────────────────────────────────────────
	authUC     := authusecase.NewAuthUsecase(userRepository, jwtManager)
	userUC     := userusecase.NewUserUsecase(userRepository)
	postUC     := postusecase.NewPostUsecase(postRepository)
	routeUC    := routeusecase.NewRouteUsecase(routeRepository)
	socialUC   := socialusecase.NewSocialUsecase(socialRepository)
	trackingUC := trackingusecase.NewTrackingUsecase(trackingRepository)
	garageUC   := garageusecase.NewGarageUsecase(garageRepository)
	reportUC   := reportusecase.NewReportUsecase(reportRepository)
	tourUC     := tourusecase.NewTourUsecase(tourRepository)
	spotUC     := spotusecase.NewSpotUsecase(spotRepository)

	// ── Handlers ─────────────────────────────────────────────────────────────
	authH     := authhandler.NewAuthHandler(authUC)
	userH     := userhandler.NewUserHandler(userUC)
	postH     := posthandler.NewPostHandler(postUC)
	routeH    := routehandler.NewRouteHandler(routeUC)
	socialH   := socialhandler.NewSocialHandler(socialUC)
	trackingH := trackinghandler.NewTrackingHandler(trackingUC, jwtManager, log)
	garageH   := garagehandler.NewGarageHandler(garageUC)
	reportH   := reporthandler.NewReportHandler(reportUC)
	tourH     := tourhandler.NewTourHandler(tourUC, pool)
	spotH     := spothandler.NewSpotHandler(spotUC)

	// ── Fiber ─────────────────────────────────────────────────────────────────
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			log.Error("unhandled error", "error", err, "path", c.Path())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": fiber.Map{"code": "INTERNAL_ERROR", "message": "internal server error"},
			})
		},
	})

	app.Use(recover.New())
	app.Use(middleware.RequestID())
	app.Use(middleware.Logger(log))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET,POST,PATCH,DELETE,OPTIONS",
	}))

	// ── Health ────────────────────────────────────────────────────────────────
	app.Get("/health", func(c *fiber.Ctx) error {
		if err := pool.Ping(c.UserContext()); err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"status": "unhealthy", "db": "unreachable",
			})
		}
		return c.JSON(fiber.Map{"status": "ok", "db": "reachable"})
	})

	// ── Routes ────────────────────────────────────────────────────────────────
	v1 := app.Group("/api/v1")
	authdomain.RegisterRoutes(v1, authH)
	userdomain.RegisterRoutes(v1, userH, jwtManager)
	postdomain.RegisterRoutes(v1, postH, jwtManager)
	routedomain.RegisterRoutes(v1, routeH, jwtManager)
	socialdomain.RegisterRoutes(v1, socialH, jwtManager)
	trackingdomain.RegisterRoutes(v1, trackingH, jwtManager)
	garagedomain.RegisterRoutes(v1, garageH, jwtManager)
	reportdomain.RegisterRoutes(app, reportH, jwtManager)
	tourdomain.RegisterRoutes(app, tourH, jwtManager)

	bikecatH := bikecathandler.NewBikeCatalogHandler(pool)
	bikecat.RegisterRoutes(v1, bikecatH)
	spotdomain.RegisterRoutes(v1, spotH, jwtManager)

	activityH := activityhandler.NewActivityHandler(pool)
	activity.RegisterRoutes(v1, activityH)

	// ── Graceful shutdown ─────────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		addr := ":" + cfg.HTTP.Port
		log.Info("server starting", "addr", addr)
		if err := app.Listen(addr); err != nil {
			log.Error("server error", "error", err)
		}
	}()

	<-quit
	log.Info("shutting down")
	if err := app.Shutdown(); err != nil {
		log.Error("shutdown error", "error", err)
	}
	pool.Close()
	log.Info("shutdown complete")
	return nil
}
