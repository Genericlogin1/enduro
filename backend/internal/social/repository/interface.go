package repository

import (
	"context"

	"github.com/google/uuid"

	"enduro/internal/social/entity"
)

type SocialRepository interface {
	Follow(ctx context.Context, followerID, followingID uuid.UUID) error
	Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error
	IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error)
	GetFollowers(ctx context.Context, userID uuid.UUID, limit, offset int) ([]uuid.UUID, error)
	GetFollowing(ctx context.Context, userID uuid.UUID, limit, offset int) ([]uuid.UUID, error)
	CreateComment(ctx context.Context, comment *entity.Comment) error
	GetComment(ctx context.Context, id uuid.UUID) (*entity.Comment, error)
	ListComments(ctx context.Context, postID uuid.UUID, limit, offset int) ([]*entity.Comment, error)
	DeleteComment(ctx context.Context, id uuid.UUID) error
}
