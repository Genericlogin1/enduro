package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"enduro/internal/ride/entity"
)

type RideRepository struct {
	pool *pgxpool.Pool
}

func NewRideRepository(pool *pgxpool.Pool) *RideRepository {
	return &RideRepository{pool: pool}
}

func (r *RideRepository) Create(ctx context.Context, organizerID uuid.UUID, req *entity.Ride) (*entity.Ride, error) {
	const q = `
INSERT INTO group_rides (organizer_id, title, description, location, ride_date, route_id, max_participants)
VALUES ($1,$2,$3,$4,$5,$6,$7)
RETURNING id, created_at`

	err := r.pool.QueryRow(ctx, q,
		organizerID, req.Title, req.Description, req.Location,
		req.RideDate, req.RouteID, req.MaxParticipants,
	).Scan(&req.ID, &req.CreatedAt)
	if err != nil {
		return nil, err
	}
	req.OrganizerID = organizerID
	req.Status = "upcoming"
	_ = r.pool.QueryRow(ctx, `SELECT name FROM users WHERE id=$1`, organizerID).Scan(&req.OrganizerName)
	return req, nil
}

func (r *RideRepository) List(ctx context.Context, userID *uuid.UUID) ([]*entity.Ride, error) {
	const q = `
SELECT gr.id, gr.organizer_id, u.name, gr.title, gr.description, gr.location,
       gr.ride_date, gr.route_id, gr.max_participants, gr.status, gr.created_at,
       COUNT(DISTINCT p.user_id) as participant_count,
       CASE WHEN $1::uuid IS NOT NULL THEN
         EXISTS(SELECT 1 FROM group_ride_participants WHERE ride_id=gr.id AND user_id=$1)
       ELSE false END as is_joined
FROM group_rides gr
JOIN users u ON u.id = gr.organizer_id
LEFT JOIN group_ride_participants p ON p.ride_id = gr.id
WHERE gr.status != 'done'
GROUP BY gr.id, u.name
ORDER BY gr.ride_date ASC`

	rows, err := r.pool.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rides []*entity.Ride
	for rows.Next() {
		ride := &entity.Ride{}
		if err := rows.Scan(&ride.ID, &ride.OrganizerID, &ride.OrganizerName,
			&ride.Title, &ride.Description, &ride.Location,
			&ride.RideDate, &ride.RouteID, &ride.MaxParticipants,
			&ride.Status, &ride.CreatedAt,
			&ride.ParticipantCount, &ride.IsJoined); err != nil {
			continue
		}
		rides = append(rides, ride)
	}
	return rides, nil
}

func (r *RideRepository) GetByID(ctx context.Context, id uuid.UUID, userID *uuid.UUID) (*entity.Ride, error) {
	const q = `
SELECT gr.id, gr.organizer_id, u.name, gr.title, gr.description, gr.location,
       gr.ride_date, gr.route_id, gr.max_participants, gr.status, gr.created_at,
       COUNT(DISTINCT p.user_id) as participant_count,
       CASE WHEN $2::uuid IS NOT NULL THEN
         EXISTS(SELECT 1 FROM group_ride_participants WHERE ride_id=gr.id AND user_id=$2)
       ELSE false END as is_joined
FROM group_rides gr
JOIN users u ON u.id = gr.organizer_id
LEFT JOIN group_ride_participants p ON p.ride_id = gr.id
WHERE gr.id = $1
GROUP BY gr.id, u.name`

	ride := &entity.Ride{}
	err := r.pool.QueryRow(ctx, q, id, userID).Scan(
		&ride.ID, &ride.OrganizerID, &ride.OrganizerName,
		&ride.Title, &ride.Description, &ride.Location,
		&ride.RideDate, &ride.RouteID, &ride.MaxParticipants,
		&ride.Status, &ride.CreatedAt,
		&ride.ParticipantCount, &ride.IsJoined,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, entity.ErrNotFound
	}
	return ride, err
}

func (r *RideRepository) Join(ctx context.Context, rideID, userID uuid.UUID) error {
	ride, err := r.GetByID(ctx, rideID, &userID)
	if err != nil {
		return err
	}
	if ride.IsJoined {
		return entity.ErrAlreadyJoined
	}
	if ride.MaxParticipants != nil && ride.ParticipantCount >= *ride.MaxParticipants {
		return entity.ErrFull
	}
	_, err = r.pool.Exec(ctx,
		`INSERT INTO group_ride_participants (ride_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
		rideID, userID)
	return err
}

func (r *RideRepository) Leave(ctx context.Context, rideID, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM group_ride_participants WHERE ride_id=$1 AND user_id=$2`,
		rideID, userID)
	return err
}

func (r *RideRepository) Participants(ctx context.Context, rideID uuid.UUID) ([]*entity.Participant, error) {
	const q = `
SELECT p.user_id, u.name, p.joined_at
FROM group_ride_participants p
JOIN users u ON u.id = p.user_id
WHERE p.ride_id = $1
ORDER BY p.joined_at ASC`

	rows, err := r.pool.Query(ctx, q, rideID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var parts []*entity.Participant
	for rows.Next() {
		p := &entity.Participant{}
		if err := rows.Scan(&p.UserID, &p.UserName, &p.JoinedAt); err != nil {
			continue
		}
		parts = append(parts, p)
	}
	return parts, nil
}

func (r *RideRepository) Delete(ctx context.Context, id, organizerID uuid.UUID) error {
	res, err := r.pool.Exec(ctx,
		`DELETE FROM group_rides WHERE id=$1 AND organizer_id=$2`, id, organizerID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return entity.ErrNotFound
	}
	return nil
}
