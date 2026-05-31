package entity

import "errors"

var (
	ErrSpotNotFound  = errors.New("spot not found")
	ErrNotSpotOwner  = errors.New("not spot owner")
	ErrInvalidKind   = errors.New("invalid spot kind")
)
