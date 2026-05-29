package domain

import "errors"

// Sentinel errors for domain/usecase layer
var (
	ErrNotFound      = errors.New("not found")
	ErrAlreadyExists = errors.New("already exists")
	ErrUnauthorized  = errors.New("unauthorized")
	ErrForbidden     = errors.New("forbidden")
	ErrInvalidInput  = errors.New("invalid input")
	ErrInternal      = errors.New("internal error")
)

// DomainError wraps domain errors with context
type DomainError struct {
	Code    string
	Message string
	Err     error
}

func (e *DomainError) Error() string {
	if e.Err != nil {
		return e.Message + ": " + e.Err.Error()
	}
	return e.Message
}

func (e *DomainError) Unwrap() error {
	return e.Err
}

func NewNotFound(message string) *DomainError {
	return &DomainError{Code: "NOT_FOUND", Message: message, Err: ErrNotFound}
}

func NewAlreadyExists(message string) *DomainError {
	return &DomainError{Code: "ALREADY_EXISTS", Message: message, Err: ErrAlreadyExists}
}

func NewUnauthorized(message string) *DomainError {
	return &DomainError{Code: "UNAUTHORIZED", Message: message, Err: ErrUnauthorized}
}

func NewForbidden(message string) *DomainError {
	return &DomainError{Code: "FORBIDDEN", Message: message, Err: ErrForbidden}
}

func NewInvalidInput(message string) *DomainError {
	return &DomainError{Code: "INVALID_INPUT", Message: message, Err: ErrInvalidInput}
}

func NewInternal(message string) *DomainError {
	return &DomainError{Code: "INTERNAL_ERROR", Message: message, Err: ErrInternal}
}
