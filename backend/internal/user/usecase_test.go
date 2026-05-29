package user_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/Genericlogin1/enduro/backend/internal/domain"
	"github.com/Genericlogin1/enduro/backend/internal/user"
)

// mockUserRepository mocks user.Repository
type mockUserRepository struct {
	createFunc     func(ctx context.Context, u *user.User) error
	getByIDFunc    func(ctx context.Context, id uuid.UUID) (*user.User, error)
	getByEmailFunc func(ctx context.Context, email string) (*user.User, error)
	listFunc       func(ctx context.Context, limit, offset int) ([]*user.User, error)
	updateFunc     func(ctx context.Context, u *user.User) error
	deleteFunc     func(ctx context.Context, id uuid.UUID) error
}

func (m *mockUserRepository) Create(ctx context.Context, u *user.User) error {
	if m.createFunc != nil { return m.createFunc(ctx, u) }
	return nil
}
func (m *mockUserRepository) GetByID(ctx context.Context, id uuid.UUID) (*user.User, error) {
	if m.getByIDFunc != nil { return m.getByIDFunc(ctx, id) }
	return nil, nil
}
func (m *mockUserRepository) GetByEmail(ctx context.Context, email string) (*user.User, error) {
	if m.getByEmailFunc != nil { return m.getByEmailFunc(ctx, email) }
	return nil, nil
}
func (m *mockUserRepository) List(ctx context.Context, limit, offset int) ([]*user.User, error) {
	if m.listFunc != nil { return m.listFunc(ctx, limit, offset) }
	return nil, nil
}
func (m *mockUserRepository) Update(ctx context.Context, u *user.User) error {
	if m.updateFunc != nil { return m.updateFunc(ctx, u) }
	return nil
}
func (m *mockUserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteFunc != nil { return m.deleteFunc(ctx, id) }
	return nil
}

// mockTxManager mocks user.TxManager
type mockTxManager struct{}
func (m *mockTxManager) RunInTx(ctx context.Context, fn func(ctx context.Context) error) error {
	return fn(ctx)
}

func TestUserUseCase_Create(t *testing.T) {
	tests := []struct {
		name        string
		input       user.CreateInput
		mockCreate  func(ctx context.Context, u *user.User) error
		wantErr     bool
		wantErrType error
	}{
		{
			name:  "success",
			input: user.CreateInput{Email: "user@example.com", Password: "password123", Name: "User Name"},
			wantErr: false,
		},
		{
			name:        "empty email",
			input:       user.CreateInput{Email: "", Password: "password123", Name: "User Name"},
			wantErr:     true,
			wantErrType: domain.ErrInvalidInput,
		},
		{
			name:        "short password",
			input:       user.CreateInput{Email: "user@example.com", Password: "123", Name: "User Name"},
			wantErr:     true,
			wantErrType: domain.ErrInvalidInput,
		},
		{
			name:        "already exists",
			input:       user.CreateInput{Email: "dup@example.com", Password: "password123", Name: "Dup User"},
			mockCreate:  func(ctx context.Context, u *user.User) error {
				return domain.NewAlreadyExists("user already exists")
			},
			wantErr:     true,
			wantErrType: domain.ErrAlreadyExists,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &mockUserRepository{createFunc: tt.mockCreate}
			uc := user.NewUseCase(repo, &mockTxManager{})
			u, err := uc.Create(context.Background(), tt.input)

			if tt.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				if tt.wantErrType != nil && !errors.Is(err, tt.wantErrType) {
					t.Errorf("expected error %v, got %v", tt.wantErrType, err)
				}
			} else {
				if err != nil { t.Fatalf("unexpected error: %v", err) }
				if u == nil { t.Fatal("expected user, got nil") }
				if u.Email != tt.input.Email { t.Errorf("expected email %s, got %s", tt.input.Email, u.Email) }
			}
		})
	}
}

func TestUserUseCase_GetByID(t *testing.T) {
	existingUser := &user.User{
		ID:        uuid.New(),
		Email:     "user@example.com",
		Name:      "Test User",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	tests := []struct {
		name      string
		id        uuid.UUID
		mockUser  *user.User
		mockErr   error
		wantErr   bool
	}{
		{
			name:     "success",
			id:       existingUser.ID,
			mockUser: existingUser,
			wantErr:  false,
		},
		{
			name:    "not found",
			id:      uuid.New(),
			mockErr: domain.NewNotFound("user not found"),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &mockUserRepository{
				getByIDFunc: func(ctx context.Context, id uuid.UUID) (*user.User, error) {
					if tt.mockErr != nil { return nil, tt.mockErr }
					return tt.mockUser, nil
				},
			}
			uc := user.NewUseCase(repo, &mockTxManager{})
			u, err := uc.GetByID(context.Background(), tt.id)

			if tt.wantErr {
				if err == nil { t.Fatal("expected error, got nil") }
			} else {
				if err != nil { t.Fatalf("unexpected error: %v", err) }
				if u.ID != tt.mockUser.ID { t.Errorf("expected user ID %v, got %v", tt.mockUser.ID, u.ID) }
			}
		})
	}
}
