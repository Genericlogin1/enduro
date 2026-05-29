package user

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Genericlogin1/enduro/backend/internal/domain"
	"github.com/Genericlogin1/enduro/backend/internal/infrastructure/postgres"
)

type repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &repository{pool: pool}
}

func (r *repository) getQuerier(ctx context.Context) interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	Exec(ctx context.Context, sql string, args ...any) (interface{ RowsAffected() int64 }, error)
} {
	if tx := postgres.GetTx(ctx); tx != nil {
		return tx
	}
	return r.pool
}

func (r *repository) Create(ctx context.Context, u *User) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO users (id, email, password_hash, name, bio, avatar_url, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		u.ID, u.Email, u.PasswordHash, u.Name, u.Bio, u.AvatarURL, u.CreatedAt, u.UpdatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return domain.NewAlreadyExists("user with this email already exists")
		}
		return fmt.Errorf("create user: %w", err)
	}
	return nil
}

func (r *repository) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	var u User
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, name, bio, avatar_url, created_at, updated_at
		 FROM users WHERE id = $1`, id,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Bio, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.NewNotFound("user not found")
		}
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return &u, nil
}

func (r *repository) GetByEmail(ctx context.Context, email string) (*User, error) {
	var u User
	err := r.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, name, bio, avatar_url, created_at, updated_at
		 FROM users WHERE email = $1`, email,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Bio, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.NewNotFound("user not found")
		}
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return &u, nil
}

func (r *repository) List(ctx context.Context, limit, offset int) ([]*User, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, email, password_hash, name, bio, avatar_url, created_at, updated_at
		 FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()

	var users []*User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Bio, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		users = append(users, &u)
	}
	return users, rows.Err()
}

func (r *repository) Update(ctx context.Context, u *User) error {
	result, err := r.pool.Exec(ctx,
		`UPDATE users SET name=$1, bio=$2, avatar_url=$3, updated_at=$4 WHERE id=$5`,
		u.Name, u.Bio, u.AvatarURL, u.UpdatedAt, u.ID,
	)
	if err != nil {
		return fmt.Errorf("update user: %w", err)
	}
	if result.RowsAffected() == 0 {
		return domain.NewNotFound("user not found")
	}
	return nil
}

func (r *repository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	if result.RowsAffected() == 0 {
		return domain.NewNotFound("user not found")
	}
	return nil
}

func isUniqueViolation(err error) bool {
	return err != nil && (fmt.Sprintf("%v", err) == "ERROR: duplicate key value violates unique constraint" ||
		contains(err.Error(), "23505") || contains(err.Error(), "unique"))
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(s) > 0 && containsStr(s, sub))
}

func containsStr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
