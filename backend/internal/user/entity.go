package user

import (
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
	Create(ctx interface{ Deadline() (time.Time, bool) }, user *User) error
	GetByID(ctx interface{ Deadline() (time.Time, bool) }, id uuid.UUID) (*User, error)
	GetByEmail(ctx interface{ Deadline() (time.Time, bool) }, email string) (*User, error)
	List(ctx interface{ Deadline() (time.Time, bool) }, limit, offset int) ([]*User, error)
	Update(ctx interface{ Deadline() (time.Time, bool) }, user *User) error
	Delete(ctx interface{ Deadline() (time.Time, bool) }, id uuid.UUID) error
}
