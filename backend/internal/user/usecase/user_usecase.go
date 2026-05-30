package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"

	"enduro/internal/user/dto"
	"enduro/internal/user/entity"
	userrepo "enduro/internal/user/repository"
	"enduro/pkg/apperrors"
	"enduro/pkg/password"
	"enduro/pkg/validator"
)

type UserUsecase interface {
	Create(ctx context.Context, req dto.CreateUserRequest) (dto.UserResponse, error)
	GetByID(ctx context.Context, id uuid.UUID) (dto.UserResponse, error)
	List(ctx context.Context, limit, offset int) ([]dto.UserResponse, error)
	Search(ctx context.Context, query string, limit int) ([]dto.UserResponse, error)
	Update(ctx context.Context, id uuid.UUID, req dto.UpdateUserRequest) (dto.UserResponse, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type userUsecase struct {
	repo userrepo.UserRepository
}

func NewUserUsecase(repo userrepo.UserRepository) UserUsecase {
	return &userUsecase{repo: repo}
}

func (u *userUsecase) Create(ctx context.Context, req dto.CreateUserRequest) (dto.UserResponse, error) {
	if err := validator.New().
		Required("email", req.Email).
		Email("email", req.Email).
		Required("password", req.Password).
		MinLen("password", req.Password, 8).
		Required("name", req.Name).
		Validate(); err != nil {
		return dto.UserResponse{}, apperrors.New(apperrors.ErrInvalidInput, "INVALID_INPUT", err.Error())
	}

	hash, err := password.Hash(req.Password)
	if err != nil {
		return dto.UserResponse{}, apperrors.ErrInternal
	}

	now := time.Now().UTC()
	user := &entity.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: hash,
		Name:         req.Name,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := u.repo.Create(ctx, user); err != nil {
		if apperrors.Is(err, apperrors.ErrAlreadyExists) {
			return dto.UserResponse{}, entity.ErrAlreadyExists
		}
		return dto.UserResponse{}, err
	}

	return dto.ToUserResponse(user), nil
}

func (u *userUsecase) GetByID(ctx context.Context, id uuid.UUID) (dto.UserResponse, error) {
	user, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) {
			return dto.UserResponse{}, entity.ErrNotFound
		}
		return dto.UserResponse{}, err
	}
	return dto.ToUserResponse(user), nil
}

func (u *userUsecase) List(ctx context.Context, limit, offset int) ([]dto.UserResponse, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	users, err := u.repo.List(ctx, limit, offset)
	if err != nil {
		return nil, err
	}
	result := make([]dto.UserResponse, len(users))
	for i, user := range users {
		result[i] = dto.ToUserResponse(user)
	}
	return result, nil
}

func (u *userUsecase) Search(ctx context.Context, query string, limit int) ([]dto.UserResponse, error) {
	if limit <= 0 || limit > 50 { limit = 20 }
	users, err := u.repo.Search(ctx, query, limit)
	if err != nil { return nil, err }
	result := make([]dto.UserResponse, len(users))
	for i, user := range users { result[i] = dto.ToUserResponse(user) }
	return result, nil
}

func (u *userUsecase) Update(ctx context.Context, id uuid.UUID, req dto.UpdateUserRequest) (dto.UserResponse, error) {
	user, err := u.repo.GetByID(ctx, id)
	if err != nil {
		if apperrors.Is(err, apperrors.ErrNotFound) {
			return dto.UserResponse{}, entity.ErrNotFound
		}
		return dto.UserResponse{}, err
	}

	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.Email != nil {
		if err := validator.New().Required("email", *req.Email).Email("email", *req.Email).Validate(); err != nil {
			return dto.UserResponse{}, apperrors.New(apperrors.ErrInvalidInput, "INVALID_INPUT", err.Error())
		}
		user.Email = *req.Email
	}
	user.UpdatedAt = time.Now().UTC()

	if err := u.repo.Update(ctx, user); err != nil {
		return dto.UserResponse{}, err
	}
	return dto.ToUserResponse(user), nil
}

func (u *userUsecase) Delete(ctx context.Context, id uuid.UUID) error {
	err := u.repo.Delete(ctx, id)
	if apperrors.Is(err, apperrors.ErrNotFound) {
		return entity.ErrNotFound
	}
	return err
}
