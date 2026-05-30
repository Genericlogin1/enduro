package postgres

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"enduro/internal/user/entity"
	userrepo "enduro/internal/user/repository"
	"enduro/pkg/apperrors"
	"enduro/pkg/txmanager"
)

type querier interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type userRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) userrepo.UserRepository {
	return &userRepository{pool: pool}
}

func (r *userRepository) q(ctx context.Context) querier {
	if tx := txmanager.ExtractTx(ctx); tx != nil {
		return tx
	}
	return r.pool
}

func (r *userRepository) Create(ctx context.Context, u *entity.User) error {
	q := `INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
	      VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.q(ctx).Exec(ctx, q, u.ID, u.Email, u.PasswordHash, u.Name, u.CreatedAt, u.UpdatedAt)
	if err != nil {
		if isDuplicateKey(err) {
			return apperrors.ErrAlreadyExists
		}
		return err
	}
	return nil
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	q := `SELECT id, email, password_hash, name, created_at, updated_at FROM users WHERE id = $1`
	u := &entity.User{}
	err := r.q(ctx).QueryRow(ctx, q, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	return u, err
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	q := `SELECT id, email, password_hash, name, created_at, updated_at FROM users WHERE email = $1`
	u := &entity.User{}
	err := r.q(ctx).QueryRow(ctx, q, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	return u, err
}

func (r *userRepository) List(ctx context.Context, limit, offset int) ([]*entity.User, error) {
	q := `SELECT id, email, password_hash, name, created_at, updated_at
	      FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := r.q(ctx).Query(ctx, q, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*entity.User
	for rows.Next() {
		u := &entity.User{}
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *userRepository) Search(ctx context.Context, query string, limit int) ([]*entity.User, error) {
	q := `SELECT id, email, password_hash, name, created_at, updated_at
	      FROM users WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY name LIMIT $2`
	rows, err := r.q(ctx).Query(ctx, q, "%"+query+"%", limit)
	if err != nil { return nil, err }
	defer rows.Close()
	var users []*entity.User
	for rows.Next() {
		u := &entity.User{}
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *userRepository) Update(ctx context.Context, u *entity.User) error {
	q := `UPDATE users SET email=$1, name=$2, updated_at=$3 WHERE id=$4`
	tag, err := r.q(ctx).Exec(ctx, q, u.Email, u.Name, u.UpdatedAt, u.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *userRepository) Delete(ctx context.Context, id uuid.UUID) error {
	q := `DELETE FROM users WHERE id = $1`
	tag, err := r.q(ctx).Exec(ctx, q, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func isDuplicateKey(err error) bool {
	return err != nil && strings.Contains(err.Error(), "23505")
}
