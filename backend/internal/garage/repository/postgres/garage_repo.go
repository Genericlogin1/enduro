package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"enduro/internal/garage/entity"
	garagerepo "enduro/internal/garage/repository"
	"enduro/pkg/apperrors"
	"enduro/pkg/txmanager"
)

type querier interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type garageRepository struct {
	pool *pgxpool.Pool
}

func NewGarageRepository(pool *pgxpool.Pool) garagerepo.GarageRepository {
	return &garageRepository{pool: pool}
}

func (r *garageRepository) q(ctx context.Context) querier {
	if tx := txmanager.ExtractTx(ctx); tx != nil {
		return tx
	}
	return r.pool
}

func (r *garageRepository) AddBike(ctx context.Context, b *entity.Bike) error {
	_, err := r.q(ctx).Exec(ctx,
		`INSERT INTO bikes (id,user_id,make,model,year,engine_cc,notes,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		b.ID, b.UserID, b.Make, b.Model, b.Year, b.EngineCC, b.Notes, b.CreatedAt)
	return err
}

func (r *garageRepository) ListBikes(ctx context.Context, userID uuid.UUID) ([]*entity.Bike, error) {
	rows, err := r.q(ctx).Query(ctx,
		`SELECT id,user_id,make,model,year,engine_cc,notes,created_at FROM bikes WHERE user_id=$1 ORDER BY created_at DESC`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var bikes []*entity.Bike
	for rows.Next() {
		b := &entity.Bike{}
		if err := rows.Scan(&b.ID, &b.UserID, &b.Make, &b.Model, &b.Year, &b.EngineCC, &b.Notes, &b.CreatedAt); err != nil {
			return nil, err
		}
		bikes = append(bikes, b)
	}
	return bikes, rows.Err()
}

func (r *garageRepository) DeleteBike(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.q(ctx).Exec(ctx,
		`DELETE FROM bikes WHERE id=$1 AND user_id=$2`, id, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

var _ = errors.New // silence unused import
