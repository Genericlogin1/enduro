package configs

import (
	"os"
	"time"
)

type Config struct {
	App      AppConfig
	HTTP     HTTPConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Log      LogConfig
}

type AppConfig struct {
	Env string
}

type HTTPConfig struct {
	Port string
}

type DatabaseConfig struct {
	URL string
}

type JWTConfig struct {
	Secret    string
	AccessTTL time.Duration
}

type LogConfig struct {
	Level string
}

func Load() (*Config, error) {
	accessTTL, err := time.ParseDuration(getEnv("JWT_ACCESS_TTL", "24h"))
	if err != nil {
		accessTTL = 24 * time.Hour
	}

	return &Config{
		App: AppConfig{
			Env: getEnv("APP_ENV", "development"),
		},
		HTTP: HTTPConfig{
			Port: getEnv("HTTP_PORT", "8080"),
		},
		Database: DatabaseConfig{
			URL: mustEnv("DATABASE_URL"),
		},
		JWT: JWTConfig{
			Secret:    mustEnv("JWT_SECRET"),
			AccessTTL: accessTTL,
		},
		Log: LogConfig{
			Level: getEnv("LOG_LEVEL", "info"),
		},
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic("required env variable not set: " + key)
	}
	return v
}
