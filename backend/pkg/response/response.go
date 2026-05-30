package response

import (
	"errors"

	"github.com/gofiber/fiber/v2"

	"enduro/pkg/apperrors"
)

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type errorResponse struct {
	Error errorBody `json:"error"`
}

func OK(c *fiber.Ctx, data any) error {
	return c.Status(fiber.StatusOK).JSON(data)
}

func Created(c *fiber.Ctx, data any) error {
	return c.Status(fiber.StatusCreated).JSON(data)
}

func NoContent(c *fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
}

func Error(c *fiber.Ctx, err error) error {
	var appErr *apperrors.AppError
	if errors.As(err, &appErr) {
		status := statusFromSentinel(appErr.Err)
		return c.Status(status).JSON(errorResponse{
			Error: errorBody{Code: appErr.Code, Message: appErr.Message},
		})
	}

	// fallback for sentinel errors without wrapper
	status := statusFromSentinel(err)
	return c.Status(status).JSON(errorResponse{
		Error: errorBody{Code: "INTERNAL_ERROR", Message: "internal server error"},
	})
}

func statusFromSentinel(err error) int {
	switch {
	case errors.Is(err, apperrors.ErrNotFound):
		return fiber.StatusNotFound
	case errors.Is(err, apperrors.ErrAlreadyExists):
		return fiber.StatusConflict
	case errors.Is(err, apperrors.ErrUnauthorized):
		return fiber.StatusUnauthorized
	case errors.Is(err, apperrors.ErrForbidden):
		return fiber.StatusForbidden
	case errors.Is(err, apperrors.ErrInvalidInput):
		return fiber.StatusUnprocessableEntity
	default:
		return fiber.StatusInternalServerError
	}
}
