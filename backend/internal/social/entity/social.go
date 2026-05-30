package entity

import (
	"time"

	"github.com/google/uuid"
)

type Follow struct {
	FollowerID  uuid.UUID
	FollowingID uuid.UUID
	CreatedAt   time.Time
}

type Comment struct {
	ID        uuid.UUID
	PostID    uuid.UUID
	AuthorID  uuid.UUID
	Content   string
	CreatedAt time.Time
	UpdatedAt time.Time
}
