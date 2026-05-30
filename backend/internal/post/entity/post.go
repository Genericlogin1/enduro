package entity

import (
	"time"

	"github.com/google/uuid"
)

type Post struct {
	ID         uuid.UUID
	AuthorID   uuid.UUID
	AuthorName string
	Content    string
	Location   *string
	MediaURLs  []string
	LikesCount int
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type Like struct {
	PostID    uuid.UUID
	UserID    uuid.UUID
	CreatedAt time.Time
}
