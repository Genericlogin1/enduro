package auth_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/Genericlogin1/enduro/backend/internal/auth"
	"github.com/Genericlogin1/enduro/backend/internal/domain"
	"github.com/Genericlogin1/enduro/backend/internal/user"
)

// mockUserRepo is a mock for UserRepository
type mockUserRepo struct {
	createFunc     func(ctx context.Context, u *user.User) error
	getByEmailFunc func(ctx context.Context, email string) (*user.User, error)
}

func (m *mockUserRepo) Create(ctx context.Context, u *user.User) error {
	return m.createFunc(ctx, u)
}

func (m *mockUserRepo) GetByEmail(ctx context.Context, email string) (*user.User, error) {
	return m.getByEmailFunc(ctx, email)
}

func TestAuthUseCase_Register(t *testing.T) {
	tests := []struct {
		name        string
		input       auth.RegisterInput
		mockCreate  func(ctx context.Context, u *user.User) error
		wantErr     bool
		wantErrType error
	}{
		{
			name:  "success",
			input: auth.RegisterInput{Email: "test@example.com", Password: "password123", Name: "Test User"},
			mockCreate: func(ctx context.Context, u *user.User) error { return nil },
			wantErr: false,
		},
		{
			name:        "empty email",
			input:       auth.RegisterInput{Email: "", Password: "password123", Name: "Test User"},
			mockCreate:  func(ctx context.Context, u *user.User) error { return nil },
			wantErr:     true,
			wantErrType: domain.ErrInvalidInput,
		},
		{
			name:        "short password",
			input:       auth.RegisterInput{Email: "test@example.com", Password: "short", Name: "Test User"},
			mockCreate:  func(ctx context.Context, u *user.User) error { return nil },
			wantErr:     true,
			wantErrType: domain.ErrInvalidInput,
		},
		{
			name:        "email already exists",
			input:       auth.RegisterInput{Email: "exists@example.com", Password: "password123", Name: "Test User"},
			mockCreate:  func(ctx context.Context, u *user.User) error { return domain.NewAlreadyExists("user already exists") },
			wantErr:     true,
			wantErrType: domain.ErrAlreadyExists,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mock := &mockUserRepo{
				createFunc: tt.mockCreate,
				getByEmailFunc: func(ctx context.Context, email string) (*user.User, error) {
					return nil, nil
				},
			}
			uc := auth.NewUseCase(mock, "test-secret-32-chars-minimum-len", 15*time.Minute)
			result, err := uc.Register(context.Background(), tt.input)

			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				if tt.wantErrType != nil && !errors.Is(err, tt.wantErrType) {
					t.Errorf("expected error type %v, got %v", tt.wantErrType, err)
				}
			} else {
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if result == nil {
					t.Fatal("expected result, got nil")
				}
				if result.AccessToken == "" {
					t.Error("expected access token, got empty string")
				}
				if result.User == nil {
					t.Error("expected user in result")
				}
			}
		})
	}
}

func TestAuthUseCase_Login(t *testing.T) {
	hashedUser := &user.User{
		ID:           uuid.New(),
		Email:        "test@example.com",
		PasswordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", // "password123"
		Name:         "Test User",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	tests := []struct {
		name        string
		input       auth.LoginInput
		mockUser    *user.User
		mockErr     error
		wantErr     bool
		wantErrType error
	}{
		{
			name:    "success",
			input:   auth.LoginInput{Email: "test@example.com", Password: "secret"},
			mockUser: hashedUser,
			wantErr: false,
		},
		{
			name:        "user not found",
			input:       auth.LoginInput{Email: "notfound@example.com", Password: "password123"},
			mockUser:    nil,
			mockErr:     domain.NewNotFound("user not found"),
			wantErr:     true,
			wantErrType: domain.ErrUnauthorized,
		},
		{
			name:        "empty credentials",
			input:       auth.LoginInput{Email: "", Password: ""},
			wantErr:     true,
			wantErrType: domain.ErrInvalidInput,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mock := &mockUserRepo{
				createFunc: func(ctx context.Context, u *user.User) error { return nil },
				getByEmailFunc: func(ctx context.Context, email string) (*user.User, error) {
					if tt.mockErr != nil {
						return nil, tt.mockErr
					}
					return tt.mockUser, nil
				},
			}
			uc := auth.NewUseCase(mock, "test-secret-32-chars-minimum-len", 15*time.Minute)
			_, err := uc.Login(context.Background(), tt.input)

			if tt.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				if tt.wantErrType != nil && !errors.Is(err, tt.wantErrType) {
					t.Errorf("expected error type %v, got %v", tt.wantErrType, err)
				}
			} else {
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
			}
		})
	}
}
