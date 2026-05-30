package postgres

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"enduro/internal/report/entity"
	repo "enduro/internal/report/repository"
	"enduro/pkg/apperrors"
)

type querier interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type reportRepository struct{ pool *pgxpool.Pool }

func NewReportRepository(pool *pgxpool.Pool) repo.ReportRepository {
	return &reportRepository{pool: pool}
}

const selectCols = `
	r.id, r.author_id, COALESCE(u.name,'') AS author_name,
	r.title, r.body, r.cover_url, r.photo_urls,
	r.track_id, r.bike_id,
	COALESCE(TRIM(CONCAT(b.make, ' ', b.model)),'') AS bike_name,
	r.region, r.riding_date, r.difficulty,
	r.distance_km, r.duration_min,
	r.likes_count, r.views_count, r.created_at, r.updated_at`

const fromJoins = `
	FROM reports r
	LEFT JOIN users u ON u.id = r.author_id
	LEFT JOIN bikes b ON b.id = r.bike_id`

func scan(row pgx.Row) (*entity.Report, error) {
	r := &entity.Report{}
	err := row.Scan(
		&r.ID, &r.AuthorID, &r.AuthorName,
		&r.Title, &r.Body, &r.CoverURL, &r.PhotoURLs,
		&r.TrackID, &r.BikeID, &r.BikeName,
		&r.Region, &r.RidingDate, &r.Difficulty,
		&r.DistanceKm, &r.DurationMin,
		&r.LikesCount, &r.ViewsCount, &r.CreatedAt, &r.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	return r, err
}

func (r *reportRepository) Create(ctx context.Context, rep *entity.Report) error {
	q := `INSERT INTO reports
		(id,author_id,title,body,cover_url,photo_urls,track_id,bike_id,region,riding_date,difficulty,distance_km,duration_min,created_at,updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`
	_, err := r.pool.Exec(ctx, q,
		rep.ID, rep.AuthorID, rep.Title, rep.Body, rep.CoverURL, rep.PhotoURLs,
		rep.TrackID, rep.BikeID, rep.Region, rep.RidingDate, rep.Difficulty,
		rep.DistanceKm, rep.DurationMin, rep.CreatedAt, rep.UpdatedAt,
	)
	return err
}

func (r *reportRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Report, error) {
	q := `SELECT ` + selectCols + fromJoins + ` WHERE r.id=$1`
	return scan(r.pool.QueryRow(ctx, q, id))
}

func (r *reportRepository) List(ctx context.Context, limit, offset int) ([]*entity.Report, error) {
	q := `SELECT ` + selectCols + fromJoins + ` ORDER BY r.created_at DESC LIMIT $1 OFFSET $2`
	return r.scanMany(ctx, q, limit, offset)
}

func (r *reportRepository) ListByAuthor(ctx context.Context, authorID uuid.UUID, limit, offset int) ([]*entity.Report, error) {
	q := `SELECT ` + selectCols + fromJoins + ` WHERE r.author_id=$1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`
	return r.scanMany(ctx, q, authorID, limit, offset)
}

func (r *reportRepository) scanMany(ctx context.Context, q string, args ...any) ([]*entity.Report, error) {
	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*entity.Report
	for rows.Next() {
		rep, err := scan(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, rep)
	}
	return list, rows.Err()
}

func (r *reportRepository) Update(ctx context.Context, rep *entity.Report) error {
	q := `UPDATE reports SET title=$1,body=$2,cover_url=$3,photo_urls=$4,region=$5,
		riding_date=$6,difficulty=$7,distance_km=$8,duration_min=$9,updated_at=$10 WHERE id=$11`
	tag, err := r.pool.Exec(ctx, q,
		rep.Title, rep.Body, rep.CoverURL, rep.PhotoURLs, rep.Region,
		rep.RidingDate, rep.Difficulty, rep.DistanceKm, rep.DurationMin, rep.UpdatedAt, rep.ID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *reportRepository) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM reports WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *reportRepository) IncrementViews(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `UPDATE reports SET views_count=views_count+1 WHERE id=$1`, id)
	return err
}

func (r *reportRepository) AddLike(ctx context.Context, reportID, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO report_likes(report_id,user_id) VALUES($1,$2)`, reportID, userID)
	if err != nil {
		if strings.Contains(err.Error(), "23505") {
			return apperrors.ErrAlreadyExists
		}
		return err
	}
	_, err = r.pool.Exec(ctx, `UPDATE reports SET likes_count=likes_count+1 WHERE id=$1`, reportID)
	return err
}

func (r *reportRepository) RemoveLike(ctx context.Context, reportID, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM report_likes WHERE report_id=$1 AND user_id=$2`, reportID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	_, err = r.pool.Exec(ctx,
		`UPDATE reports SET likes_count=GREATEST(0,likes_count-1) WHERE id=$1`, reportID)
	return err
}

func (r *reportRepository) IsLiked(ctx context.Context, reportID, userID uuid.UUID) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM report_likes WHERE report_id=$1 AND user_id=$2)`,
		reportID, userID).Scan(&exists)
	return exists, err
}
