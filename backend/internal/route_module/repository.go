package route_module

import (
	"context"
	"encoding/json"
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

func (r *repository) Create(ctx context.Context, rt *Route) error {
	pointsJSON, err := json.Marshal(rt.Points)
	if err != nil {
		return fmt.Errorf("marshal points: %w", err)
	}
	_, err = r.pool.Exec(ctx,
		`INSERT INTO routes (id, user_id, name, description, points, distance_km, difficulty, country, region, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		rt.ID, rt.UserID, rt.Name, rt.Description, pointsJSON,
		rt.DistanceKm, rt.Difficulty, rt.Country, rt.Region, rt.CreatedAt, rt.UpdatedAt,
	)
	return err
}

func (r *repository) GetByID(ctx context.Context, id uuid.UUID) (*Route, error) {
	var rt Route
	var pointsJSON []byte
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, name, description, points, distance_km, difficulty, country, region, created_at, updated_at
		 FROM routes WHERE id = $1`, id,
	).Scan(&rt.ID, &rt.UserID, &rt.Name, &rt.Description, &pointsJSON,
		&rt.DistanceKm, &rt.Difficulty, &rt.Country, &rt.Region, &rt.CreatedAt, &rt.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.NewNotFound("route not found")
		}
		return nil, fmt.Errorf("get route by id: %w", err)
	}
	if err := json.Unmarshal(pointsJSON, &rt.Points); err != nil {
		return nil, fmt.Errorf("unmarshal points: %w", err)
	}
	return &rt, nil
}

func (r *repository) List(ctx context.Context, limit, offset int, country, difficulty string) ([]*Route, error) {
	query := `SELECT id, user_id, name, description, points, distance_km, difficulty, country, region, created_at, updated_at FROM routes WHERE 1=1`
	args := []any{}
	argIdx := 1

	if country != "" {
		query += fmt.Sprintf(" AND country = $%d", argIdx)
		args = append(args, country)
		argIdx++
	}
	if difficulty != "" {
		query += fmt.Sprintf(" AND difficulty = $%d", argIdx)
		args = append(args, difficulty)
		argIdx++
	}
	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list routes: %w", err)
	}
	defer rows.Close()

	var routes []*Route
	for rows.Next() {
		var rt Route
		var pointsJSON []byte
		if err := rows.Scan(&rt.ID, &rt.UserID, &rt.Name, &rt.Description, &pointsJSON,
			&rt.DistanceKm, &rt.Difficulty, &rt.Country, &rt.Region, &rt.CreatedAt, &rt.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan route: %w", err)
		}
		_ = json.Unmarshal(pointsJSON, &rt.Points)
		routes = append(routes, &rt)
	}
	return routes, rows.Err()
}

func (r *repository) Update(ctx context.Context, rt *Route) error {
	pointsJSON, _ := json.Marshal(rt.Points)
	result, err := r.pool.Exec(ctx,
		`UPDATE routes SET name=$1, description=$2, points=$3, distance_km=$4, difficulty=$5, country=$6, region=$7, updated_at=$8 WHERE id=$9`,
		rt.Name, rt.Description, pointsJSON, rt.DistanceKm, rt.Difficulty, rt.Country, rt.Region, rt.UpdatedAt, rt.ID,
	)
	if err != nil {
		return fmt.Errorf("update route: %w", err)
	}
	if result.RowsAffected() == 0 {
		return domain.NewNotFound("route not found")
	}
	return nil
}

func (r *repository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM routes WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete route: %w", err)
	}
	if result.RowsAffected() == 0 {
		return domain.NewNotFound("route not found")
	}
	return nil
}
