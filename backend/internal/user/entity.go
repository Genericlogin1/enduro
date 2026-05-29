package user

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// User is the domain entity
type User struct {
	ID           uuid.UUID
	Email        string
	PasswordHash string
	Name         string
	Bio          string
	AvatarURL    string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// Repository interface - belongs to the domain layer
type Repository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	List(ctx context.Context, limit, offset int) ([]*User, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id uuid.UUID) error
}
