package entity

import "enduro/pkg/apperrors"

var (
	ErrNotFound      = apperrors.New(apperrors.ErrNotFound, "USER_NOT_FOUND", "user not found")
	ErrAlreadyExists = apperrors.New(apperrors.ErrAlreadyExists, "USER_ALREADY_EXISTS", "user with this email already exists")
)
