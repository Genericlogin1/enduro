package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"enduro/pkg/apperrors"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/response"
)

const LocalsUserID = "user_id"

func Auth(jwtManager *jwtutil.Manager) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			return response.Error(c, apperrors.New(apperrors.ErrUnauthorized, "UNAUTHORIZED", "missing or invalid authorization header"))
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")

		claims, err := jwtManager.Parse(tokenStr)
		if err != nil {
			return response.Error(c, apperrors.New(apperrors.ErrUnauthorized, "INVALID_TOKEN", "invalid or expired token"))
		}

		c.Locals(LocalsUserID, claims.UserID)
		return c.Next()
	}
}

// UserIDFromCtx extracts the authenticated user ID from Fiber locals.
func UserIDFromCtx(c *fiber.Ctx) (uuid.UUID, bool) {
	id, ok := c.Locals(LocalsUserID).(uuid.UUID)
	return id, ok
}
