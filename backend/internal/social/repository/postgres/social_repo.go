package postgres

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"enduro/internal/social/entity"
	socialrepo "enduro/internal/social/repository"
	"enduro/pkg/apperrors"
	"enduro/pkg/txmanager"
)

type querier interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type socialRepository struct {
	pool *pgxpool.Pool
}

func NewSocialRepository(pool *pgxpool.Pool) socialrepo.SocialRepository {
	return &socialRepository{pool: pool}
}

func (r *socialRepository) q(ctx context.Context) querier {
	if tx := txmanager.ExtractTx(ctx); tx != nil {
		return tx
	}
	return r.pool
}

func (r *socialRepository) Follow(ctx context.Context, followerID, followingID uuid.UUID) error {
	_, err := r.q(ctx).Exec(ctx,
		`INSERT INTO follows (follower_id, following_id) VALUES ($1,$2)`, followerID, followingID)
	if err != nil {
		if strings.Contains(err.Error(), "23505") {
			return apperrors.ErrAlreadyExists
		}
		return err
	}
	return nil
}

func (r *socialRepository) Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error {
	tag, err := r.q(ctx).Exec(ctx,
		`DELETE FROM follows WHERE follower_id=$1 AND following_id=$2`, followerID, followingID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *socialRepository) IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error) {
	var exists bool
	err := r.q(ctx).QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=$2)`,
		followerID, followingID,
	).Scan(&exists)
	return exists, err
}

func (r *socialRepository) GetFollowers(ctx context.Context, userID uuid.UUID, limit, offset int) ([]uuid.UUID, error) {
	rows, err := r.q(ctx).Query(ctx,
		`SELECT follower_id FROM follows WHERE following_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanUUIDs(rows)
}

func (r *socialRepository) GetFollowing(ctx context.Context, userID uuid.UUID, limit, offset int) ([]uuid.UUID, error) {
	rows, err := r.q(ctx).Query(ctx,
		`SELECT following_id FROM follows WHERE follower_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanUUIDs(rows)
}

func scanUUIDs(rows pgx.Rows) ([]uuid.UUID, error) {
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *socialRepository) CreateComment(ctx context.Context, c *entity.Comment) error {
	_, err := r.q(ctx).Exec(ctx,
		`INSERT INTO comments (id,post_id,author_id,content,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6)`,
		c.ID, c.PostID, c.AuthorID, c.Content, c.CreatedAt, c.UpdatedAt)
	return err
}

func (r *socialRepository) GetComment(ctx context.Context, id uuid.UUID) (*entity.Comment, error) {
	c := &entity.Comment{}
	err := r.q(ctx).QueryRow(ctx,
		`SELECT id,post_id,author_id,content,created_at,updated_at FROM comments WHERE id=$1`, id,
	).Scan(&c.ID, &c.PostID, &c.AuthorID, &c.Content, &c.CreatedAt, &c.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	return c, err
}

func (r *socialRepository) ListComments(ctx context.Context, postID uuid.UUID, limit, offset int) ([]*entity.Comment, error) {
	rows, err := r.q(ctx).Query(ctx,
		`SELECT id,post_id,author_id,content,created_at,updated_at FROM comments WHERE post_id=$1 ORDER BY created_at ASC LIMIT $2 OFFSET $3`,
		postID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []*entity.Comment
	for rows.Next() {
		c := &entity.Comment{}
		if err := rows.Scan(&c.ID, &c.PostID, &c.AuthorID, &c.Content, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}
	return comments, rows.Err()
}

func (r *socialRepository) DeleteComment(ctx context.Context, id uuid.UUID) error {
	tag, err := r.q(ctx).Exec(ctx, `DELETE FROM comments WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}
