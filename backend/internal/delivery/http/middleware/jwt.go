package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

const UserIDKey = "user_id"

// JWTMiddleware validates JWT and injects user_id into context
func JWTMiddleware(jwtKey []byte) fiber.Handler {
	return func(c *fiber.Ctx) error {
		auth := c.Get("Authorization")
		if auth == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "authorization header required")
		}

		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid authorization format")
		}

		tokenStr := parts[1]

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "invalid signing method")
			}
			return jwtKey, nil
		})
		if err != nil || !token.Valid {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid or expired token")
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid token claims")
		}

		userID, ok := claims["user_id"].(string)
		if !ok || userID == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid user_id in token")
		}

		c.Locals(UserIDKey, userID)
		return c.Next()
	}
}

// GetUserID extracts user_id from Fiber context locals
func GetUserID(c *fiber.Ctx) string {
	id, _ := c.Locals(UserIDKey).(string)
	return id
}
