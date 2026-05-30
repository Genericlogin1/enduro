package entity

import "enduro/pkg/apperrors"

var (
	ErrInvalidCredentials = apperrors.New(apperrors.ErrUnauthorized, "INVALID_CREDENTIALS", "invalid email or password")
	ErrUserAlreadyExists  = apperrors.New(apperrors.ErrAlreadyExists, "USER_ALREADY_EXISTS", "user with this email already exists")
)
