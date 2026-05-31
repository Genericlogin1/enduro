package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"enduro/internal/spot/dto"
	"enduro/internal/spot/entity"
)

type SpotRepository struct {
	db *pgxpool.Pool
}

func NewSpotRepository(db *pgxpool.Pool) *SpotRepository {
	return &SpotRepository{db: db}
}

const spotCols = `s.id, s.author_id, COALESCE(u.name,''), s.title, COALESCE(s.description,''),
    s.kind, s.lat, s.lng, COALESCE(s.country,''), s.upvotes, s.created_at`

func scanSpot(row pgx.Row) (*entity.Spot, error) {
	var sp entity.Spot
	err := row.Scan(
		&sp.ID, &sp.AuthorID, &sp.AuthorName,
		&sp.Title, &sp.Description, &sp.Kind,
		&sp.Lat, &sp.Lng, &sp.Country,
		&sp.Upvotes, &sp.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, entity.ErrSpotNotFound
		}
		return nil, err
	}
	return &sp, nil
}

func (r *SpotRepository) Create(ctx context.Context, sp *entity.Spot) (*entity.Spot, error) {
	q := `INSERT INTO spots (author_id, title, description, kind, lat, lng, country)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          RETURNING id`
	var newID string
	err := r.db.QueryRow(ctx, q, sp.AuthorID, sp.Title, sp.Description, sp.Kind, sp.Lat, sp.Lng, sp.Country).Scan(&newID)
	if err != nil {
		return nil, err
	}
	id, _ := uuid.Parse(newID)
	return r.GetByID(ctx, id)
}

func (r *SpotRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Spot, error) {
	q := fmt.Sprintf(`SELECT %s FROM spots s LEFT JOIN users u ON u.id=s.author_id WHERE s.id=$1`, spotCols)
	return scanSpot(r.db.QueryRow(ctx, q, id))
}

func (r *SpotRepository) List(ctx context.Context, f dto.ListSpotsFilter, limit, offset int) ([]*entity.Spot, error) {
	where := "1=1"
	args := []any{}
	n := 1
	if f.Kind != "" {
		where += fmt.Sprintf(" AND s.kind=$%d", n)
		args = append(args, f.Kind)
		n++
	}
	if f.HasBbox {
		where += fmt.Sprintf(" AND s.lat BETWEEN $%d AND $%d AND s.lng BETWEEN $%d AND $%d", n, n+1, n+2, n+3)
		args = append(args, f.MinLat, f.MaxLat, f.MinLng, f.MaxLng)
		n += 4
	}
	args = append(args, limit, offset)
	q := fmt.Sprintf(`SELECT %s FROM spots s LEFT JOIN users u ON u.id=s.author_id WHERE %s
        ORDER BY s.created_at DESC LIMIT $%d OFFSET $%d`, spotCols, where, n, n+1)

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*entity.Spot
	for rows.Next() {
		var sp entity.Spot
		if err := rows.Scan(
			&sp.ID, &sp.AuthorID, &sp.AuthorName,
			&sp.Title, &sp.Description, &sp.Kind,
			&sp.Lat, &sp.Lng, &sp.Country,
			&sp.Upvotes, &sp.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, &sp)
	}
	return out, nil
}

func (r *SpotRepository) Delete(ctx context.Context, id, authorID uuid.UUID) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM spots WHERE id=$1 AND author_id=$2`, id, authorID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return entity.ErrSpotNotFound
	}
	return nil
}

func (r *SpotRepository) Vote(ctx context.Context, spotID, userID uuid.UUID, value int) (int, error) {
	if value == 0 {
		_, err := r.db.Exec(ctx, `DELETE FROM spot_votes WHERE spot_id=$1 AND user_id=$2`, spotID, userID)
		if err != nil {
			return 0, err
		}
	} else {
		_, err := r.db.Exec(ctx,
			`INSERT INTO spot_votes (spot_id, user_id, value) VALUES ($1,$2,$3)
             ON CONFLICT (spot_id, user_id) DO UPDATE SET value=EXCLUDED.value`,
			spotID, userID, value,
		)
		if err != nil {
			return 0, err
		}
	}
	// Recalculate upvotes
	var total int
	err := r.db.QueryRow(ctx, `SELECT COALESCE(SUM(value),0) FROM spot_votes WHERE spot_id=$1`, spotID).Scan(&total)
	if err != nil {
		return 0, err
	}
	_, err = r.db.Exec(ctx, `UPDATE spots SET upvotes=$1 WHERE id=$2`, total, spotID)
	return total, err
}

func (r *SpotRepository) GetMyVote(ctx context.Context, spotID, userID uuid.UUID) (int, error) {
	var v int
	err := r.db.QueryRow(ctx, `SELECT value FROM spot_votes WHERE spot_id=$1 AND user_id=$2`, spotID, userID).Scan(&v)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, err
	}
	return v, nil
}
