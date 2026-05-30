package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"

	authdto "enduro/internal/auth/dto"
	authentity "enduro/internal/auth/entity"
	"enduro/internal/user/dto"
	"enduro/internal/user/entity"
	userrepo "enduro/internal/user/repository"
	"enduro/pkg/apperrors"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/password"
	"enduro/pkg/validator"
)

type AuthUsecase interface {
	Register(ctx context.Context, req authdto.RegisterRequest) (authdto.AuthResponse, error)
	Login(ctx context.Context, req authdto.LoginRequest) (authdto.AuthResponse, error)
}

type authUsecase struct {
	userRepo   userrepo.UserRepository
	jwtManager *jwtutil.Manager
}

func NewAuthUsecase(userRepo userrepo.UserRepository, jwtManager *jwtutil.Manager) AuthUsecase {
	return &authUsecase{userRepo: userRepo, jwtManager: jwtManager}
}

func (a *authUsecase) Register(ctx context.Context, req authdto.RegisterRequest) (authdto.AuthResponse, error) {
	if err := validator.New().
		Required("email", req.Email).
		Email("email", req.Email).
		Required("password", req.Password).
		MinLen("password", req.Password, 8).
		Required("name", req.Name).
		Validate(); err != nil {
		return authdto.AuthResponse{}, apperrors.New(apperrors.ErrInvalidInput, "INVALID_INPUT", err.Error())
	}

	hash, err := password.Hash(req.Password)
	if err != nil {
		return authdto.AuthResponse{}, apperrors.ErrInternal
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

	if err := a.userRepo.Create(ctx, user); err != nil {
		if apperrors.Is(err, apperrors.ErrAlreadyExists) {
			return authdto.AuthResponse{}, authentity.ErrUserAlreadyExists
		}
		return authdto.AuthResponse{}, err
	}

	token, err := a.jwtManager.Generate(user.ID)
	if err != nil {
		return authdto.AuthResponse{}, apperrors.ErrInternal
	}

	return authdto.AuthResponse{
		AccessToken: token,
		User:        dto.ToUserResponse(user),
	}, nil
}

func (a *authUsecase) Login(ctx context.Context, req authdto.LoginRequest) (authdto.AuthResponse, error) {
	if err := validator.New().
		Required("email", req.Email).
		Required("password", req.Password).
		Validate(); err != nil {
		return authdto.AuthResponse{}, apperrors.New(apperrors.ErrInvalidInput, "INVALID_INPUT", err.Error())
	}

	user, err := a.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return authdto.AuthResponse{}, authentity.ErrInvalidCredentials
	}

	if !password.Compare(user.PasswordHash, req.Password) {
		return authdto.AuthResponse{}, authentity.ErrInvalidCredentials
	}

	token, err := a.jwtManager.Generate(user.ID)
	if err != nil {
		return authdto.AuthResponse{}, apperrors.ErrInternal
	}

	return authdto.AuthResponse{
		AccessToken: token,
		User:        dto.ToUserResponse(user),
	}, nil
}
