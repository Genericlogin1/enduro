package entity

import "enduro/pkg/apperrors"

var (
	ErrSessionNotFound      = apperrors.New(apperrors.ErrNotFound, "SESSION_NOT_FOUND", "tracking session not found")
	ErrSessionAlreadyFinished = apperrors.New(apperrors.ErrInvalidInput, "SESSION_ALREADY_FINISHED", "session is already finished")
	ErrNotOwner             = apperrors.New(apperrors.ErrForbidden, "FORBIDDEN", "not allowed")
)
