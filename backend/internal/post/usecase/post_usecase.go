package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"

	"enduro/internal/post/dto"
	"enduro/internal/post/entity"
	postrepo "enduro/internal/post/repository"
	"enduro/pkg/apperrors"
)

type PostUsecase interface {
	Create(ctx context.Context, authorID uuid.UUID, req dto.CreatePostRequest) (dto.PostResponse, error)
	GetByID(ctx context.Context, id uuid.UUID, callerID uuid.UUID) (dto.PostResponse, error)
	List(ctx context.Context, limit, offset int, callerID uuid.UUID) ([]dto.PostResponse, error)
	Update(ctx context.Context, id, callerID uuid.UUID, req dto.UpdatePostRequest) (dto.PostResponse, error)
	Delete(ctx context.Context, id, callerID uuid.UUID) error
	ToggleLike(ctx context.Context, postID, userID uuid.UUID) error
}

type postUsecase struct {
	repo postrepo.PostRepository
}

func NewPostUsecase(repo postrepo.PostRepository) PostUsecase {
	return &postUsecase{repo: repo}
}

func (u *postUsecase) Create(ctx context.Context, authorID uuid.UUID, req dto.CreatePostRequest) (dto.PostResponse, error) {
	if req.Content == "" && len(req.MediaURLs) == 0 {
		return dto.PostResponse{}, apperrors.New(apperrors.ErrInvalidInput, "INVALID_INPUT", "post must have content or media")
	}
	now := time.Now().UTC()
	urls := req.MediaURLs
	if urls == nil {
		urls = []string{}
	}
	post := &entity.Post{
		ID:        uuid.New(),
		AuthorID:  authorID,
		Content:   req.Content,
		Location:  req.Location,
		MediaURLs: urls,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := u.repo.Create(ctx, post); err != nil {
		return dto.PostResponse{}, err
	}
	return dto.ToPostResponse(post, false), nil
}

func (u *postUsecase) GetByID(ctx context.Context, id uuid.UUID, callerID uuid.UUID) (dto.PostResponse, error) {
	post, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) {
			return dto.PostResponse{}, entity.ErrNotFound
		}
		return dto.PostResponse{}, err
	}
	liked := false
	if callerID != uuid.Nil {
		liked, _ = u.repo.IsLiked(ctx, id, callerID)
	}
	return dto.ToPostResponse(post, liked), nil
}

func (u *postUsecase) List(ctx context.Context, limit, offset int, callerID uuid.UUID) ([]dto.PostResponse, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	posts, err := u.repo.List(ctx, limit, offset)
	if err != nil {
		return nil, err
	}
	result := make([]dto.PostResponse, len(posts))
	for i, p := range posts {
		liked := false
		if callerID != uuid.Nil {
			liked, _ = u.repo.IsLiked(ctx, p.ID, callerID)
		}
		result[i] = dto.ToPostResponse(p, liked)
	}
	return result, nil
}

func (u *postUsecase) Update(ctx context.Context, id, callerID uuid.UUID, req dto.UpdatePostRequest) (dto.PostResponse, error) {
	post, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) {
			return dto.PostResponse{}, entity.ErrNotFound
		}
		return dto.PostResponse{}, err
	}
	if post.AuthorID != callerID {
		return dto.PostResponse{}, entity.ErrForbidden
	}
	if req.Content != nil {
		post.Content = *req.Content
	}
	if req.Location != nil {
		post.Location = req.Location
	}
	post.UpdatedAt = time.Now().UTC()
	if err := u.repo.Update(ctx, post); err != nil {
		return dto.PostResponse{}, err
	}
	return dto.ToPostResponse(post, false), nil
}

func (u *postUsecase) Delete(ctx context.Context, id, callerID uuid.UUID) error {
	post, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) {
			return entity.ErrNotFound
		}
		return err
	}
	if post.AuthorID != callerID {
		return entity.ErrForbidden
	}
	return u.repo.Delete(ctx, id)
}

func (u *postUsecase) ToggleLike(ctx context.Context, postID, userID uuid.UUID) error {
	if _, err := u.repo.GetByID(ctx, postID); err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) {
			return entity.ErrNotFound
		}
		return err
	}
	liked, err := u.repo.IsLiked(ctx, postID, userID)
	if err != nil {
		return err
	}
	if liked {
		return u.repo.RemoveLike(ctx, postID, userID)
	}
	return u.repo.AddLike(ctx, postID, userID)
}
