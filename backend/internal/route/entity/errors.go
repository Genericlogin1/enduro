package entity

import "enduro/pkg/apperrors"

var (
	ErrNotFound        = apperrors.New(apperrors.ErrNotFound, "ROUTE_NOT_FOUND", "route not found")
	ErrInvalidGeoJSON  = apperrors.New(apperrors.ErrInvalidInput, "INVALID_GEOJSON", "invalid geojson")
	ErrForbidden       = apperrors.New(apperrors.ErrForbidden, "FORBIDDEN", "not allowed")
)
