package tour

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Genericlogin1/enduro/backend/internal/domain"
)

type repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &repository{pool: pool}
}

func (r *repository) Create(ctx context.Context, t *Tour) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO tours (id, organizer_id, title, description, start_date, end_date, location, max_riders, current_count, status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		t.ID, t.OrganizerID, t.Title, t.Description, t.StartDate, t.EndDate,
		t.Location, t.MaxRiders, t.CurrentCount, t.Status, t.CreatedAt, t.UpdatedAt,
	)
	return err
}

func (r *repository) GetByID(ctx context.Context, id uuid.UUID) (*Tour, error) {
	var t Tour
	err := r.pool.QueryRow(ctx,
		`SELECT id, organizer_id, title, description, start_date, end_date, location, max_riders, current_count, status, created_at, updated_at
		 FROM tours WHERE id = $1`, id,
	).Scan(&t.ID, &t.OrganizerID, &t.Title, &t.Description, &t.StartDate, &t.EndDate,
		&t.Location, &t.MaxRiders, &t.CurrentCount, &t.Status, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.NewNotFound("tour not found")
		}
		return nil, fmt.Errorf("get tour by id: %w", err)
	}
	return &t, nil
}

func (r *repository) List(ctx context.Context, limit, offset int) ([]*Tour, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, organizer_id, title, description, start_date, end_date, location, max_riders, current_count, status, created_at, updated_at
		 FROM tours ORDER BY start_date ASC LIMIT $1 OFFSET $2`, limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("list tours: %w", err)
	}
	defer rows.Close()

	var tours []*Tour
	for rows.Next() {
		var t Tour
		if err := rows.Scan(&t.ID, &t.OrganizerID, &t.Title, &t.Description, &t.StartDate, &t.EndDate,
			&t.Location, &t.MaxRiders, &t.CurrentCount, &t.Status, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan tour: %w", err)
		}
		tours = append(tours, &t)
	}
	return tours, rows.Err()
}

func (r *repository) Update(ctx context.Context, t *Tour) error {
	result, err := r.pool.Exec(ctx,
		`UPDATE tours SET title=$1, description=$2, start_date=$3, end_date=$4, location=$5, max_riders=$6, status=$7, updated_at=$8 WHERE id=$9`,
		t.Title, t.Description, t.StartDate, t.EndDate, t.Location, t.MaxRiders, t.Status, t.UpdatedAt, t.ID,
	)
	if err != nil {
		return fmt.Errorf("update tour: %w", err)
	}
	if result.RowsAffected() == 0 {
		return domain.NewNotFound("tour not found")
	}
	return nil
}

func (r *repository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM tours WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete tour: %w", err)
	}
	if result.RowsAffected() == 0 {
		return domain.NewNotFound("tour not found")
	}
	return nil
}
