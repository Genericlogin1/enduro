package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const HeaderRequestID = "X-Request-ID"

func RequestID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		id := c.Get(HeaderRequestID)
		if id == "" {
			id = uuid.New().String()
		}
		c.Set(HeaderRequestID, id)
		c.Locals("request_id", id)
		return c.Next()
	}
}
