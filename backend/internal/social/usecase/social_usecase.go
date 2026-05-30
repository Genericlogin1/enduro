package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"

	"enduro/internal/social/dto"
	"enduro/internal/social/entity"
	socialrepo "enduro/internal/social/repository"
	"enduro/pkg/apperrors"
)

type SocialUsecase interface {
	Follow(ctx context.Context, followerID, followingID uuid.UUID) error
	Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error
	IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error)
	GetFollowers(ctx context.Context, userID uuid.UUID, limit, offset int) ([]uuid.UUID, error)
	GetFollowing(ctx context.Context, userID uuid.UUID, limit, offset int) ([]uuid.UUID, error)
	AddComment(ctx context.Context, postID, authorID uuid.UUID, req dto.CreateCommentRequest) (dto.CommentResponse, error)
	DeleteComment(ctx context.Context, commentID, callerID uuid.UUID) error
	ListComments(ctx context.Context, postID uuid.UUID, limit, offset int) ([]dto.CommentResponse, error)
}

type socialUsecase struct {
	repo socialrepo.SocialRepository
}

func NewSocialUsecase(repo socialrepo.SocialRepository) SocialUsecase {
	return &socialUsecase{repo: repo}
}

func (u *socialUsecase) Follow(ctx context.Context, followerID, followingID uuid.UUID) error {
	if followerID == followingID {
		return apperrors.New(apperrors.ErrInvalidInput, "CANNOT_FOLLOW_SELF", "cannot follow yourself")
	}
	err := u.repo.Follow(ctx, followerID, followingID)
	if apperrors.Is(err, apperrors.ErrAlreadyExists) {
		return entity.ErrAlreadyFollowing
	}
	return err
}

func (u *socialUsecase) Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error {
	err := u.repo.Unfollow(ctx, followerID, followingID)
	if apperrors.Is(err, apperrors.ErrNotFound) {
		return entity.ErrNotFollowing
	}
	return err
}

func (u *socialUsecase) IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error) {
	return u.repo.IsFollowing(ctx, followerID, followingID)
}

func (u *socialUsecase) GetFollowers(ctx context.Context, userID uuid.UUID, limit, offset int) ([]uuid.UUID, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	return u.repo.GetFollowers(ctx, userID, limit, offset)
}

func (u *socialUsecase) GetFollowing(ctx context.Context, userID uuid.UUID, limit, offset int) ([]uuid.UUID, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	return u.repo.GetFollowing(ctx, userID, limit, offset)
}

func (u *socialUsecase) AddComment(ctx context.Context, postID, authorID uuid.UUID, req dto.CreateCommentRequest) (dto.CommentResponse, error) {
	if req.Content == "" {
		return dto.CommentResponse{}, apperrors.New(apperrors.ErrInvalidInput, "INVALID_INPUT", "content is required")
	}
	now := time.Now().UTC()
	c := &entity.Comment{
		ID: uuid.New(), PostID: postID, AuthorID: authorID,
		Content: req.Content, CreatedAt: now, UpdatedAt: now,
	}
	if err := u.repo.CreateComment(ctx, c); err != nil {
		return dto.CommentResponse{}, err
	}
	return dto.ToCommentResponse(c), nil
}

func (u *socialUsecase) DeleteComment(ctx context.Context, commentID, callerID uuid.UUID) error {
	c, err := u.repo.GetComment(ctx, commentID)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) {
			return entity.ErrCommentNotFound
		}
		return err
	}
	if c.AuthorID != callerID {
		return entity.ErrForbidden
	}
	return u.repo.DeleteComment(ctx, commentID)
}

func (u *socialUsecase) ListComments(ctx context.Context, postID uuid.UUID, limit, offset int) ([]dto.CommentResponse, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	comments, err := u.repo.ListComments(ctx, postID, limit, offset)
	if err != nil {
		return nil, err
	}
	result := make([]dto.CommentResponse, len(comments))
	for i, c := range comments {
		result[i] = dto.ToCommentResponse(c)
	}
	return result, nil
}
