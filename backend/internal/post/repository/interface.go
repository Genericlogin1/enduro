package repository

import (
	"context"

	"github.com/google/uuid"

	"enduro/internal/post/entity"
)

type PostRepository interface {
	Create(ctx context.Context, post *entity.Post) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Post, error)
	List(ctx context.Context, limit, offset int) ([]*entity.Post, error)
	ListByAuthor(ctx context.Context, authorID uuid.UUID, limit, offset int) ([]*entity.Post, error)
	Update(ctx context.Context, post *entity.Post) error
	Delete(ctx context.Context, id uuid.UUID) error
	AddLike(ctx context.Context, postID, userID uuid.UUID) error
	RemoveLike(ctx context.Context, postID, userID uuid.UUID) error
	IsLiked(ctx context.Context, postID, userID uuid.UUID) (bool, error)
}
