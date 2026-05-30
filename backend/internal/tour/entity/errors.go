package entity

import "enduro/pkg/apperrors"

var (
	ErrNotFound  = apperrors.New(apperrors.ErrNotFound, "TOUR_NOT_FOUND", "tour not found")
	ErrForbidden = apperrors.New(apperrors.ErrForbidden, "TOUR_FORBIDDEN", "not allowed")
)
