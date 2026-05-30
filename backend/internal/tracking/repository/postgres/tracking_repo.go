package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"enduro/internal/tracking/entity"
	trackrepo "enduro/internal/tracking/repository"
	"enduro/pkg/apperrors"
	"enduro/pkg/txmanager"
)

type querier interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type trackingRepository struct {
	pool *pgxpool.Pool
}

func NewTrackingRepository(pool *pgxpool.Pool) trackrepo.TrackingRepository {
	return &trackingRepository{pool: pool}
}

func (r *trackingRepository) q(ctx context.Context) querier {
	if tx := txmanager.ExtractTx(ctx); tx != nil {
		return tx
	}
	return r.pool
}

const sessionCols = `id,user_id,route_id,name,status,share_token,started_at,finished_at,created_at`

func scanSession(row pgx.Row) (*entity.TrackSession, error) {
	s := &entity.TrackSession{}
	err := row.Scan(&s.ID, &s.UserID, &s.RouteID, &s.Name, &s.Status, &s.ShareToken, &s.StartedAt, &s.FinishedAt, &s.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	return s, err
}

func (r *trackingRepository) CreateSession(ctx context.Context, s *entity.TrackSession) error {
	return r.q(ctx).QueryRow(ctx,
		`INSERT INTO track_sessions (id,user_id,route_id,name,status,started_at,created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING share_token`,
		s.ID, s.UserID, s.RouteID, s.Name, s.Status, s.StartedAt, s.CreatedAt,
	).Scan(&s.ShareToken)
}

func (r *trackingRepository) GetSession(ctx context.Context, id uuid.UUID) (*entity.TrackSession, error) {
	return scanSession(r.q(ctx).QueryRow(ctx,
		`SELECT `+sessionCols+` FROM track_sessions WHERE id=$1`, id))
}

func (r *trackingRepository) GetSessionByShareToken(ctx context.Context, token string) (*entity.TrackSession, error) {
	return scanSession(r.q(ctx).QueryRow(ctx,
		`SELECT `+sessionCols+` FROM track_sessions WHERE share_token=$1`, token))
}

func (r *trackingRepository) FinishSession(ctx context.Context, id uuid.UUID, finishedAt interface{}) error {
	t := finishedAt.(time.Time)
	tag, err := r.q(ctx).Exec(ctx,
		`UPDATE track_sessions SET status='finished', finished_at=$1 WHERE id=$2`, t, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *trackingRepository) AddPoint(ctx context.Context, p *entity.TrackPoint) error {
	_, err := r.q(ctx).Exec(ctx,
		`INSERT INTO track_points (id,session_id,lat,lng,altitude,speed,recorded_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		p.ID, p.SessionID, p.Lat, p.Lng, p.Altitude, p.Speed, p.RecordedAt)
	return err
}

func (r *trackingRepository) GetLastPoint(ctx context.Context, sessionID uuid.UUID) (*entity.TrackPoint, error) {
	p := &entity.TrackPoint{}
	err := r.q(ctx).QueryRow(ctx,
		`SELECT id,session_id,lat,lng,altitude,speed,recorded_at FROM track_points
		 WHERE session_id=$1 ORDER BY recorded_at DESC LIMIT 1`, sessionID,
	).Scan(&p.ID, &p.SessionID, &p.Lat, &p.Lng, &p.Altitude, &p.Speed, &p.RecordedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return p, err
}

func (r *trackingRepository) ListSessions(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*entity.TrackSession, error) {
	rows, err := r.q(ctx).Query(ctx,
		`SELECT `+sessionCols+` FROM track_sessions WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var sessions []*entity.TrackSession
	for rows.Next() {
		s := &entity.TrackSession{}
		if err := rows.Scan(&s.ID, &s.UserID, &s.RouteID, &s.Name, &s.Status, &s.ShareToken, &s.StartedAt, &s.FinishedAt, &s.CreatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

func (r *trackingRepository) CountPoints(ctx context.Context, sessionID uuid.UUID) (int, error) {
	var count int
	err := r.q(ctx).QueryRow(ctx, `SELECT COUNT(*) FROM track_points WHERE session_id=$1`, sessionID).Scan(&count)
	return count, err
}

func (r *trackingRepository) ListPoints(ctx context.Context, sessionID uuid.UUID) ([]*entity.TrackPoint, error) {
	rows, err := r.q(ctx).Query(ctx,
		`SELECT id,session_id,lat,lng,altitude,speed,recorded_at FROM track_points WHERE session_id=$1 ORDER BY recorded_at ASC`,
		sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var points []*entity.TrackPoint
	for rows.Next() {
		p := &entity.TrackPoint{}
		if err := rows.Scan(&p.ID, &p.SessionID, &p.Lat, &p.Lng, &p.Altitude, &p.Speed, &p.RecordedAt); err != nil {
			return nil, err
		}
		points = append(points, p)
	}
	return points, rows.Err()
}
