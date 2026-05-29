package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/Genericlogin1/enduro/backend/internal/app"
	"github.com/Genericlogin1/enduro/backend/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: cfg.LogLevel(),
	}))
	slog.SetDefault(logger)

	slog.Info("starting Enduro World API", "env", cfg.AppEnv, "port", cfg.HTTPPort)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	application, err := app.New(ctx, cfg, logger)
	if err != nil {
		slog.Error("failed to initialize application", "error", err)
		os.Exit(1)
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := application.Run(); err != nil {
			slog.Error("server error", "error", err)
			quit <- syscall.SIGTERM
		}
	}()

	<-quit
	slog.Info("shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer shutdownCancel()

	if err := application.Shutdown(shutdownCtx); err != nil {
		slog.Error("graceful shutdown failed", "error", err)
	}

	slog.Info("server stopped")
}
