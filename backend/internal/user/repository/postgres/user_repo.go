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

const userCols = `id, email, password_hash, name,
	COALESCE(account_type,'personal'), COALESCE(is_business,false), COALESCE(is_verified,false),
	COALESCE(business_name,''), COALESCE(business_type,''),
	COALESCE(telegram,''), COALESCE(whatsapp,''), COALESCE(instagram,''),
	COALESCE(bio,''), COALESCE(avatar_url,''),
	created_at, updated_at`

func scanUser(row pgx.Row) (*entity.User, error) {
	u := &entity.User{}
	err := row.Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Name,
		&u.AccountType, &u.IsBusiness, &u.IsVerified,
		&u.BusinessName, &u.BusinessType,
		&u.Telegram, &u.WhatsApp, &u.Instagram,
		&u.Bio, &u.AvatarURL,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	return u, err
}

func (r *userRepository) Create(ctx context.Context, u *entity.User) error {
	q := `INSERT INTO users (id, email, password_hash, name, account_type, is_business, business_name, business_type, telegram, created_at, updated_at)
	      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`
	isBusiness := u.AccountType == entity.AccountBusiness
	_, err := r.q(ctx).Exec(ctx, q,
		u.ID, u.Email, u.PasswordHash, u.Name,
		u.AccountType, isBusiness, u.BusinessName, u.BusinessType, u.Telegram,
		u.CreatedAt, u.UpdatedAt,
	)
	if err != nil {
		if isDuplicateKey(err) {
			return apperrors.ErrAlreadyExists
		}
		return err
	}
	return nil
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	return scanUser(r.q(ctx).QueryRow(ctx,
		`SELECT `+userCols+` FROM users WHERE id = $1`, id))
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	return scanUser(r.q(ctx).QueryRow(ctx,
		`SELECT `+userCols+` FROM users WHERE email = $1`, email))
}

func (r *userRepository) List(ctx context.Context, limit, offset int) ([]*entity.User, error) {
	rows, err := r.q(ctx).Query(ctx,
		`SELECT `+userCols+` FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanUsers(rows)
}

func (r *userRepository) Search(ctx context.Context, query string, limit int) ([]*entity.User, error) {
	rows, err := r.q(ctx).Query(ctx,
		`SELECT `+userCols+` FROM users WHERE name ILIKE $1 OR email ILIKE $1 OR business_name ILIKE $1 ORDER BY name LIMIT $2`,
		"%"+query+"%", limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanUsers(rows)
}

func (r *userRepository) Update(ctx context.Context, u *entity.User) error {
	q := `UPDATE users SET email=$1, name=$2, account_type=$3, is_business=$4,
		business_name=$5, business_type=$6, telegram=$7, whatsapp=$8, instagram=$9,
		bio=$10, avatar_url=$11, updated_at=$12 WHERE id=$13`
	isBusiness := u.AccountType == entity.AccountBusiness
	tag, err := r.q(ctx).Exec(ctx, q,
		u.Email, u.Name, u.AccountType, isBusiness,
		u.BusinessName, u.BusinessType, u.Telegram, u.WhatsApp, u.Instagram,
		u.Bio, u.AvatarURL, u.UpdatedAt, u.ID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *userRepository) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.q(ctx).Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func scanUsers(rows pgx.Rows) ([]*entity.User, error) {
	var users []*entity.User
	for rows.Next() {
		u := &entity.User{}
		if err := rows.Scan(
			&u.ID, &u.Email, &u.PasswordHash, &u.Name,
			&u.AccountType, &u.IsBusiness, &u.IsVerified,
			&u.BusinessName, &u.BusinessType,
			&u.Telegram, &u.WhatsApp, &u.Instagram,
			&u.Bio, &u.AvatarURL,
			&u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func isDuplicateKey(err error) bool {
	return err != nil && strings.Contains(err.Error(), "23505")
}
