package user

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/Genericlogin1/enduro/backend/internal/domain"
)

// TxManager interface for transaction management
type TxManager interface {
	RunInTx(ctx context.Context, fn func(ctx context.Context) error) error
}

// UseCase handles user business logic
type UseCase struct {
	repo      Repository
	txManager TxManager
}

func NewUseCase(repo Repository, txManager TxManager) *UseCase {
	return &UseCase{repo: repo, txManager: txManager}
}

// CreateInput for creating a new user
type CreateInput struct {
	Email    string
	Password string
	Name     string
}

// UpdateInput for updating a user
type UpdateInput struct {
	Name      *string
	Bio       *string
	AvatarURL *string
}

func (uc *UseCase) Create(ctx context.Context, input CreateInput) (*User, error) {
	if input.Email == "" {
		return nil, domain.NewInvalidInput("email is required")
	}
	if len(input.Password) < 8 {
		return nil, domain.NewInvalidInput("password must be at least 8 characters")
	}
	if input.Name == "" {
		return nil, domain.NewInvalidInput("name is required")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	now := time.Now().UTC()
	u := &User{
		ID:           uuid.New(),
		Email:        input.Email,
		PasswordHash: string(hash),
		Name:         input.Name,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := uc.repo.Create(ctx, u); err != nil {
		return nil, err
	}

	return u, nil
}

func (uc *UseCase) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	return uc.repo.GetByID(ctx, id)
}

func (uc *UseCase) List(ctx context.Context, limit, offset int) ([]*User, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	return uc.repo.List(ctx, limit, offset)
}

func (uc *UseCase) Update(ctx context.Context, id uuid.UUID, input UpdateInput) (*User, error) {
	u, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if input.Name != nil {
		if *input.Name == "" {
			return nil, domain.NewInvalidInput("name cannot be empty")
		}
		u.Name = *input.Name
	}
	if input.Bio != nil {
		u.Bio = *input.Bio
	}
	if input.AvatarURL != nil {
		u.AvatarURL = *input.AvatarURL
	}

	u.UpdatedAt = time.Now().UTC()

	if err := uc.repo.Update(ctx, u); err != nil {
		return nil, err
	}

	return u, nil
}

func (uc *UseCase) Delete(ctx context.Context, id uuid.UUID) error {
	return uc.repo.Delete(ctx, id)
}
