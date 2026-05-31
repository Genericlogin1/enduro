package entity

import "errors"

var (
	ErrNotFound    = errors.New("ride not found")
	ErrAlreadyJoined = errors.New("already joined")
	ErrNotJoined   = errors.New("not joined")
	ErrFull        = errors.New("ride is full")
)
