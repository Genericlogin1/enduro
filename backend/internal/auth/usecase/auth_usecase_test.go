package usecase_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"

	authdto "enduro/internal/auth/dto"
	authentity "enduro/internal/auth/entity"
	"enduro/internal/auth/usecase"
	"enduro/internal/auth/usecase/mock"
	"enduro/internal/user/entity"
	"enduro/pkg/apperrors"
	jwtutil "enduro/pkg/jwt"
	"enduro/pkg/password"
)

func newJWT() *jwtutil.Manager {
	return jwtutil.NewManager("test-secret-at-least-32-characters!", 24*time.Hour)
}

func TestLogin_Success(t *testing.T) {
	hash, _ := password.Hash("password123")
	user := &entity.User{
		ID:           uuid.New(),
		Email:        "test@example.com",
		PasswordHash: hash,
		Name:         "Test User",
	}

	repo := &mock.UserRepositoryMock{
		GetByEmailFn: func(_ context.Context, email string) (*entity.User, error) {
			if email == user.Email {
				return user, nil
			}
			return nil, apperrors.ErrNotFound
		},
	}

	uc := usecase.NewAuthUsecase(repo, newJWT())
	resp, err := uc.Login(context.Background(), authdto.LoginRequest{
		Email:    "test@example.com",
		Password: "password123",
	})

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if resp.AccessToken == "" {
		t.Error("expected access token, got empty string")
	}
	if resp.User.Email != user.Email {
		t.Errorf("expected email %s, got %s", user.Email, resp.User.Email)
	}
}

func TestLogin_WrongPassword(t *testing.T) {
	hash, _ := password.Hash("correct-password")
	user := &entity.User{
		ID:           uuid.New(),
		Email:        "test@example.com",
		PasswordHash: hash,
		Name:         "Test User",
	}

	repo := &mock.UserRepositoryMock{
		GetByEmailFn: func(_ context.Context, _ string) (*entity.User, error) {
			return user, nil
		},
	}

	uc := usecase.NewAuthUsecase(repo, newJWT())
	_, err := uc.Login(context.Background(), authdto.LoginRequest{
		Email:    "test@example.com",
		Password: "wrong-password",
	})

	if !apperrors.Is(err, apperrors.ErrUnauthorized) {
		t.Errorf("expected ErrUnauthorized, got %v", err)
	}
}

func TestRegister_DuplicateEmail(t *testing.T) {
	repo := &mock.UserRepositoryMock{
		CreateFn: func(_ context.Context, _ *entity.User) error {
			return apperrors.ErrAlreadyExists
		},
	}

	uc := usecase.NewAuthUsecase(repo, newJWT())
	_, err := uc.Register(context.Background(), authdto.RegisterRequest{
		Email:    "exists@example.com",
		Password: "password123",
		Name:     "User",
	})

	if err != authentity.ErrUserAlreadyExists {
		t.Errorf("expected ErrUserAlreadyExists, got %v", err)
	}
}

func TestRegister_InvalidEmail(t *testing.T) {
	repo := &mock.UserRepositoryMock{}
	uc := usecase.NewAuthUsecase(repo, newJWT())

	_, err := uc.Register(context.Background(), authdto.RegisterRequest{
		Email:    "not-an-email",
		Password: "password123",
		Name:     "User",
	})

	if !apperrors.Is(err, apperrors.ErrInvalidInput) {
		t.Errorf("expected ErrInvalidInput, got %v", err)
	}
}
