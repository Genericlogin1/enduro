package apperrors

import "errors"

var (
	ErrNotFound     = errors.New("not found")
	ErrAlreadyExists = errors.New("already exists")
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
	ErrInvalidInput = errors.New("invalid input")
	ErrInternal     = errors.New("internal error")
)

// AppError wraps a sentinel error with a human-readable message and optional code.
type AppError struct {
	Code    string
	Message string
	Err     error
}

func (e *AppError) Error() string { return e.Message }
func (e *AppError) Unwrap() error  { return e.Err }

func New(sentinel error, code, message string) *AppError {
	return &AppError{Err: sentinel, Code: code, Message: message}
}

func Is(err, target error) bool { return errors.Is(err, target) }
