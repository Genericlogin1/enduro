package entity

import "enduro/pkg/apperrors"

var (
	ErrNotFound  = apperrors.New(apperrors.ErrNotFound, "REPORT_NOT_FOUND", "report not found")
	ErrForbidden = apperrors.New(apperrors.ErrForbidden, "REPORT_FORBIDDEN", "not allowed")
)
