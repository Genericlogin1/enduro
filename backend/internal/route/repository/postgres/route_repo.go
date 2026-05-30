package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"enduro/internal/route/dto"
	"enduro/internal/route/entity"
	routerepo "enduro/internal/route/repository"
	"enduro/pkg/apperrors"
	"enduro/pkg/txmanager"
)

type querier interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type routeRepository struct {
	pool *pgxpool.Pool
}

func NewRouteRepository(pool *pgxpool.Pool) routerepo.RouteRepository {
	return &routeRepository{pool: pool}
}

func (r *routeRepository) q(ctx context.Context) querier {
	if tx := txmanager.ExtractTx(ctx); tx != nil {
		return tx
	}
	return r.pool
}

const selectCols = `id, author_id, name, description, difficulty, country, distance_km, geojson, start_lat, start_lng, created_at, updated_at`

func scanRoute(row pgx.Row) (*entity.Route, error) {
	rt := &entity.Route{}
	err := row.Scan(&rt.ID, &rt.AuthorID, &rt.Name, &rt.Description, &rt.Difficulty,
		&rt.Country, &rt.DistanceKm, &rt.GeoJSON, &rt.StartLat, &rt.StartLng,
		&rt.CreatedAt, &rt.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	return rt, err
}

func (r *routeRepository) Create(ctx context.Context, rt *entity.Route) error {
	q := `INSERT INTO routes (id,author_id,name,description,difficulty,country,distance_km,geojson,start_lat,start_lng,created_at,updated_at)
	      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`
	_, err := r.q(ctx).Exec(ctx, q, rt.ID, rt.AuthorID, rt.Name, rt.Description,
		rt.Difficulty, rt.Country, rt.DistanceKm, rt.GeoJSON,
		rt.StartLat, rt.StartLng, rt.CreatedAt, rt.UpdatedAt)
	return err
}

func (r *routeRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Route, error) {
	q := `SELECT ` + selectCols + ` FROM routes WHERE id=$1`
	return scanRoute(r.q(ctx).QueryRow(ctx, q, id))
}

func (r *routeRepository) List(ctx context.Context, filter dto.ListRoutesFilter) ([]*entity.Route, error) {
	where := []string{}
	args := []any{}
	n := 1

	if filter.Difficulty != nil {
		where = append(where, fmt.Sprintf("difficulty=$%d", n))
		args = append(args, *filter.Difficulty)
		n++
	}
	if filter.Country != nil {
		where = append(where, fmt.Sprintf("country=$%d", n))
		args = append(args, *filter.Country)
		n++
	}
	if filter.AuthorID != nil {
		where = append(where, fmt.Sprintf("author_id=$%d", n))
		args = append(args, *filter.AuthorID)
		n++
	}
	if filter.Search != "" {
		where = append(where, fmt.Sprintf("name ILIKE $%d", n))
		args = append(args, "%"+filter.Search+"%")
		n++
	}

	q := `SELECT ` + selectCols + ` FROM routes`
	if len(where) > 0 {
		q += ` WHERE ` + joinAnd(where)
	}
	q += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, n, n+1)
	args = append(args, filter.Limit, filter.Offset)

	rows, err := r.q(ctx).Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var routes []*entity.Route
	for rows.Next() {
		rt, err := scanRoute(rows)
		if err != nil {
			return nil, err
		}
		routes = append(routes, rt)
	}
	return routes, rows.Err()
}

func (r *routeRepository) Update(ctx context.Context, rt *entity.Route) error {
	q := `UPDATE routes SET name=$1,description=$2,difficulty=$3,country=$4,distance_km=$5,geojson=$6,updated_at=$7 WHERE id=$8`
	tag, err := r.q(ctx).Exec(ctx, q, rt.Name, rt.Description, rt.Difficulty, rt.Country, rt.DistanceKm, rt.GeoJSON, rt.UpdatedAt, rt.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *routeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.q(ctx).Exec(ctx, `DELETE FROM routes WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func joinAnd(parts []string) string {
	result := ""
	for i, p := range parts {
		if i > 0 {
			result += " AND "
		}
		result += p
	}
	return result
}
