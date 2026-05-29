package post

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Post is the domain entity for a social media post
type Post struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	Content     string
	MediaURL    string
	MediaType   string // "image", "video", ""
	LikesCount  int
	CommentCount int
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// Repository interface for post persistence
type Repository interface {
	Create(ctx context.Context, p *Post) error
	GetByID(ctx context.Context, id uuid.UUID) (*Post, error)
	List(ctx context.Context, limit, offset int) ([]*Post, error)
	Update(ctx context.Context, p *Post) error
	Delete(ctx context.Context, id uuid.UUID) error
	AddLike(ctx context.Context, postID, userID uuid.UUID) error
	RemoveLike(ctx context.Context, postID, userID uuid.UUID) error
	IsLiked(ctx context.Context, postID, userID uuid.UUID) (bool, error)
}
