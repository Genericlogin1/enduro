package middleware

import (
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v2"
)

func Logger(log *slog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		log.Info("request",
			"method", c.Method(),
			"path", c.Path(),
			"status", c.Response().StatusCode(),
			"latency", time.Since(start).String(),
			"request_id", c.Locals("request_id"),
			"ip", c.IP(),
		)
		return err
	}
}
