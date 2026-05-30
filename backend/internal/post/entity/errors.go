package entity

import "enduro/pkg/apperrors"

var (
	ErrNotFound     = apperrors.New(apperrors.ErrNotFound, "POST_NOT_FOUND", "post not found")
	ErrAlreadyLiked = apperrors.New(apperrors.ErrAlreadyExists, "ALREADY_LIKED", "post already liked")
	ErrNotLiked     = apperrors.New(apperrors.ErrNotFound, "NOT_LIKED", "post not liked")
	ErrForbidden    = apperrors.New(apperrors.ErrForbidden, "FORBIDDEN", "not allowed")
)
