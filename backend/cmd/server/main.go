package main

import (
	"log/slog"
	"os"

	"github.com/joho/godotenv"

	"enduro/configs"
	"enduro/internal/app/bootstrap"
)

func main() {
	_ = godotenv.Load()

	cfg, err := configs.Load()
	if err != nil {
		slog.Error("config load failed", "error", err)
		os.Exit(1)
	}

	level := slog.LevelInfo
	if cfg.Log.Level == "debug" {
		level = slog.LevelDebug
	}
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level}))
	slog.SetDefault(log)

	if err := bootstrap.Run(cfg, log); err != nil {
		log.Error("startup failed", "error", err)
		os.Exit(1)
	}
}
