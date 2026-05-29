package post

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/Genericlogin1/enduro/backend/internal/domain"
)

type TxManager interface {
	RunInTx(ctx context.Context, fn func(ctx context.Context) error) error
}

type UseCase struct {
	repo      Repository
	txManager TxManager
}

func NewUseCase(repo Repository, txManager TxManager) *UseCase {
	return &UseCase{repo: repo, txManager: txManager}
}

type CreateInput struct {
	UserID    uuid.UUID
	Content   string
	MediaURL  string
	MediaType string
}

type UpdateInput struct {
	Content   *string
	MediaURL  *string
	MediaType *string
}

func (uc *UseCase) Create(ctx context.Context, input CreateInput) (*Post, error) {
	if input.Content == "" && input.MediaURL == "" {
		return nil, domain.NewInvalidInput("post must have content or media")
	}

	now := time.Now().UTC()
	p := &Post{
		ID:        uuid.New(),
		UserID:    input.UserID,
		Content:   input.Content,
		MediaURL:  input.MediaURL,
		MediaType: input.MediaType,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := uc.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (uc *UseCase) GetByID(ctx context.Context, id uuid.UUID) (*Post, error) {
	return uc.repo.GetByID(ctx, id)
}

func (uc *UseCase) List(ctx context.Context, limit, offset int) ([]*Post, error) {
	if limit <= 0 || limit > 100 { limit = 20 }
	if offset < 0 { offset = 0 }
	return uc.repo.List(ctx, limit, offset)
}

func (uc *UseCase) Update(ctx context.Context, id, userID uuid.UUID, input UpdateInput) (*Post, error) {
	p, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if p.UserID != userID {
		return nil, domain.NewForbidden("not authorized to update this post")
	}
	if input.Content != nil { p.Content = *input.Content }
	if input.MediaURL != nil { p.MediaURL = *input.MediaURL }
	if input.MediaType != nil { p.MediaType = *input.MediaType }
	p.UpdatedAt = time.Now().UTC()
	if err := uc.repo.Update(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (uc *UseCase) Delete(ctx context.Context, id, userID uuid.UUID) error {
	p, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if p.UserID != userID {
		return domain.NewForbidden("not authorized to delete this post")
	}
	return uc.repo.Delete(ctx, id)
}

func (uc *UseCase) Like(ctx context.Context, postID, userID uuid.UUID) error {
	isLiked, err := uc.repo.IsLiked(ctx, postID, userID)
	if err != nil {
		return err
	}
	if isLiked {
		return uc.repo.RemoveLike(ctx, postID, userID)
	}
	return uc.repo.AddLike(ctx, postID, userID)
}
