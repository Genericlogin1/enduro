package postgres

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"enduro/internal/tour/entity"
	repo "enduro/internal/tour/repository"
	"enduro/pkg/apperrors"
)

type tourRepository struct{ pool *pgxpool.Pool }

func NewTourRepository(pool *pgxpool.Pool) repo.TourRepository {
	return &tourRepository{pool: pool}
}

const cols = `t.id, t.organizer_id,
	COALESCE(u.name,'') AS organizer_name,
	COALESCE(u.is_verified,false) AS is_verified,
	COALESCE(NULLIF(u.business_name,''),'') AS business_name,
	t.title, t.description, t.cover_url,
	t.region, t.country, t.start_date, t.end_date,
	t.price_usd, t.currency, t.spots_total, t.spots_left,
	t.difficulty, t.route_id,
	t.contact_email, t.contact_phone, t.website_url,
	t.status, t.created_at, t.updated_at`

const joins = ` FROM tours t LEFT JOIN users u ON u.id = t.organizer_id`

func scanTour(row pgx.Row) (*entity.Tour, error) {
	t := &entity.Tour{}
	err := row.Scan(
		&t.ID, &t.OrganizerID,
		&t.OrganizerName, &t.IsVerified, &t.BusinessName,
		&t.Title, &t.Description, &t.CoverURL,
		&t.Region, &t.Country, &t.StartDate, &t.EndDate,
		&t.PriceUSD, &t.Currency, &t.SpotsTotal, &t.SpotsLeft,
		&t.Difficulty, &t.RouteID,
		&t.ContactEmail, &t.ContactPhone, &t.WebsiteURL,
		&t.Status, &t.CreatedAt, &t.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	return t, err
}

func (r *tourRepository) Create(ctx context.Context, t *entity.Tour) error {
	q := `INSERT INTO tours (id,organizer_id,title,description,cover_url,region,country,
		start_date,end_date,price_usd,currency,spots_total,spots_left,difficulty,route_id,
		contact_email,contact_phone,website_url,status,created_at,updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,$13,$14,$15,$16,$17,$18,$19,$20)`
	_, err := r.pool.Exec(ctx, q,
		t.ID, t.OrganizerID, t.Title, t.Description, t.CoverURL, t.Region, t.Country,
		t.StartDate, t.EndDate, t.PriceUSD, t.Currency, t.SpotsTotal,
		t.Difficulty, t.RouteID, t.ContactEmail, t.ContactPhone, t.WebsiteURL,
		t.Status, t.CreatedAt, t.UpdatedAt,
	)
	return err
}

func (r *tourRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Tour, error) {
	q := `SELECT ` + cols + joins + ` WHERE t.id=$1`
	return scanTour(r.pool.QueryRow(ctx, q, id))
}

func (r *tourRepository) List(ctx context.Context, limit, offset int) ([]*entity.Tour, error) {
	q := `SELECT ` + cols + joins + ` WHERE t.status='published' ORDER BY t.start_date ASC NULLS LAST, t.created_at DESC LIMIT $1 OFFSET $2`
	return r.scanMany(ctx, q, limit, offset)
}

func (r *tourRepository) ListByOrganizer(ctx context.Context, organizerID uuid.UUID, limit, offset int) ([]*entity.Tour, error) {
	q := `SELECT ` + cols + joins + ` WHERE t.organizer_id=$1 ORDER BY t.created_at DESC LIMIT $2 OFFSET $3`
	return r.scanMany(ctx, q, organizerID, limit, offset)
}

func (r *tourRepository) scanMany(ctx context.Context, q string, args ...any) ([]*entity.Tour, error) {
	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil { return nil, err }
	defer rows.Close()
	var list []*entity.Tour
	for rows.Next() {
		t, err := scanTour(rows)
		if err != nil { return nil, err }
		list = append(list, t)
	}
	return list, rows.Err()
}

func (r *tourRepository) Update(ctx context.Context, t *entity.Tour) error {
	q := `UPDATE tours SET title=$1,description=$2,cover_url=$3,region=$4,country=$5,
		start_date=$6,end_date=$7,price_usd=$8,spots_total=$9,spots_left=$10,
		difficulty=$11,contact_email=$12,contact_phone=$13,website_url=$14,
		status=$15,updated_at=$16 WHERE id=$17`
	tag, err := r.pool.Exec(ctx, q,
		t.Title, t.Description, t.CoverURL, t.Region, t.Country,
		t.StartDate, t.EndDate, t.PriceUSD, t.SpotsTotal, t.SpotsLeft,
		t.Difficulty, t.ContactEmail, t.ContactPhone, t.WebsiteURL,
		t.Status, t.UpdatedAt, t.ID,
	)
	if err != nil { return err }
	if tag.RowsAffected() == 0 { return apperrors.ErrNotFound }
	return nil
}

func (r *tourRepository) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM tours WHERE id=$1`, id)
	if err != nil { return err }
	if tag.RowsAffected() == 0 { return apperrors.ErrNotFound }
	return nil
}

func (r *tourRepository) Register(ctx context.Context, tourID, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO tour_registrations(tour_id,user_id) VALUES($1,$2)`, tourID, userID)
	if err != nil && strings.Contains(err.Error(), "23505") { return apperrors.ErrAlreadyExists }
	if err != nil { return err }
	_, _ = r.pool.Exec(ctx, `UPDATE tours SET spots_left=GREATEST(0,spots_left-1) WHERE id=$1 AND spots_left IS NOT NULL`, tourID)
	return nil
}

func (r *tourRepository) Unregister(ctx context.Context, tourID, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM tour_registrations WHERE tour_id=$1 AND user_id=$2`, tourID, userID)
	if err != nil { return err }
	if tag.RowsAffected() > 0 {
		_, _ = r.pool.Exec(ctx, `UPDATE tours SET spots_left=spots_left+1 WHERE id=$1 AND spots_left IS NOT NULL`, tourID)
	}
	return nil
}

func (r *tourRepository) IsRegistered(ctx context.Context, tourID, userID uuid.UUID) (bool, error) {
	var ok bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM tour_registrations WHERE tour_id=$1 AND user_id=$2)`,
		tourID, userID).Scan(&ok)
	return ok, err
}

func (r *tourRepository) RegsCount(ctx context.Context, tourID uuid.UUID) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM tour_registrations WHERE tour_id=$1`, tourID).Scan(&n)
	return n, err
}
