package middleware

import (
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v2"
)

// RequestLogger returns a Fiber middleware that logs each request
func RequestLogger(logger *slog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		err := c.Next()

		duration := time.Since(start)
		status := c.Response().StatusCode()

		logFn := logger.Info
		if status >= 500 {
			logFn = logger.Error
		} else if status >= 400 {
			logFn = logger.Warn
		}

		logFn("request",
			"method", c.Method(),
			"path", c.Path(),
			"status", status,
			"duration", duration,
			"request_id", c.GetRespHeader("X-Request-ID"),
			"ip", c.IP(),
		)

		return err
	}
}
