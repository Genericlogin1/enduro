package middleware

import (
	"errors"

	"github.com/gofiber/fiber/v2"

	"github.com/Genericlogin1/enduro/backend/internal/domain"
)

// ErrorResponse is the standard error response format
type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

// ErrorDetail contains error code and message
type ErrorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// ErrorHandler is the global Fiber error handler
func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	errCode := "INTERNAL_ERROR"
	message := "internal server error"

	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		code = fiberErr.Code
		message = fiberErr.Message
		switch code {
		case 400:
			errCode = "BAD_REQUEST"
		case 401:
			errCode = "UNAUTHORIZED"
		case 403:
			errCode = "FORBIDDEN"
		case 404:
			errCode = "NOT_FOUND"
		case 422:
			errCode = "UNPROCESSABLE_ENTITY"
		}
	}

	var domainErr *domain.DomainError
	if errors.As(err, &domainErr) {
		code = domainErrorToHTTP(domainErr.Err)
		errCode = domainErr.Code
		message = domainErr.Message
	}

	return c.Status(code).JSON(ErrorResponse{
		Error: ErrorDetail{Code: errCode, Message: message},
	})
}

// MapDomainError converts domain errors to Fiber errors
func MapDomainError(err error) error {
	var domainErr *domain.DomainError
	if errors.As(err, &domainErr) {
		return domainErr
	}

	if errors.Is(err, domain.ErrNotFound) {
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	}
	if errors.Is(err, domain.ErrAlreadyExists) {
		return fiber.NewError(fiber.StatusConflict, err.Error())
	}
	if errors.Is(err, domain.ErrUnauthorized) {
		return fiber.NewError(fiber.StatusUnauthorized, err.Error())
	}
	if errors.Is(err, domain.ErrForbidden) {
		return fiber.NewError(fiber.StatusForbidden, err.Error())
	}
	if errors.Is(err, domain.ErrInvalidInput) {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return fiber.NewError(fiber.StatusInternalServerError, "internal server error")
}

func domainErrorToHTTP(err error) int {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		return fiber.StatusNotFound
	case errors.Is(err, domain.ErrAlreadyExists):
		return fiber.StatusConflict
	case errors.Is(err, domain.ErrUnauthorized):
		return fiber.StatusUnauthorized
	case errors.Is(err, domain.ErrForbidden):
		return fiber.StatusForbidden
	case errors.Is(err, domain.ErrInvalidInput):
		return fiber.StatusBadRequest
	default:
		return fiber.StatusInternalServerError
	}
}
