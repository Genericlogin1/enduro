package postgres

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"enduro/internal/post/entity"
	postrepo "enduro/internal/post/repository"
	"enduro/pkg/apperrors"
	"enduro/pkg/txmanager"
)

type querier interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type postRepository struct {
	pool *pgxpool.Pool
}

func NewPostRepository(pool *pgxpool.Pool) postrepo.PostRepository {
	return &postRepository{pool: pool}
}

func (r *postRepository) q(ctx context.Context) querier {
	if tx := txmanager.ExtractTx(ctx); tx != nil {
		return tx
	}
	return r.pool
}

func (r *postRepository) Create(ctx context.Context, p *entity.Post) error {
	q := `INSERT INTO posts (id, author_id, content, location, media_urls, created_at, updated_at)
	      VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.q(ctx).Exec(ctx, q, p.ID, p.AuthorID, p.Content, p.Location, p.MediaURLs, p.CreatedAt, p.UpdatedAt)
	return err
}

func (r *postRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Post, error) {
	q := `SELECT p.id, p.author_id, COALESCE(u.name,'') as author_name, p.content, p.location, p.media_urls, p.likes_count, p.created_at, p.updated_at
	      FROM posts p LEFT JOIN users u ON u.id = p.author_id WHERE p.id = $1`
	p := &entity.Post{}
	err := r.q(ctx).QueryRow(ctx, q, id).Scan(
		&p.ID, &p.AuthorID, &p.AuthorName, &p.Content, &p.Location, &p.MediaURLs, &p.LikesCount, &p.CreatedAt, &p.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	return p, err
}

func (r *postRepository) List(ctx context.Context, limit, offset int) ([]*entity.Post, error) {
	q := `SELECT p.id, p.author_id, COALESCE(u.name,'') as author_name, p.content, p.location, p.media_urls, p.likes_count, p.created_at, p.updated_at
	      FROM posts p LEFT JOIN users u ON u.id = p.author_id ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`
	return r.scanPosts(ctx, q, limit, offset)
}

func (r *postRepository) ListByAuthor(ctx context.Context, authorID uuid.UUID, limit, offset int) ([]*entity.Post, error) {
	q := `SELECT p.id, p.author_id, COALESCE(u.name,'') as author_name, p.content, p.location, p.media_urls, p.likes_count, p.created_at, p.updated_at
	      FROM posts p LEFT JOIN users u ON u.id = p.author_id WHERE p.author_id = $1 ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`
	return r.scanPosts(ctx, q, authorID, limit, offset)
}

func (r *postRepository) scanPosts(ctx context.Context, q string, args ...any) ([]*entity.Post, error) {
	rows, err := r.q(ctx).Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []*entity.Post
	for rows.Next() {
		p := &entity.Post{}
		if err := rows.Scan(&p.ID, &p.AuthorID, &p.AuthorName, &p.Content, &p.Location, &p.MediaURLs, &p.LikesCount, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, rows.Err()
}

func (r *postRepository) ListByFollowing(ctx context.Context, followerID uuid.UUID, limit, offset int) ([]*entity.Post, error) {
	q := `SELECT p.id, p.author_id, COALESCE(u.name,'') as author_name, p.content, p.location, p.media_urls, p.likes_count, p.created_at, p.updated_at
	      FROM posts p LEFT JOIN users u ON u.id = p.author_id
	      WHERE p.author_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
	      ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`
	return r.scanPosts(ctx, q, followerID, limit, offset)
}

func (r *postRepository) Update(ctx context.Context, p *entity.Post) error {
	q := `UPDATE posts SET content=$1, location=$2, updated_at=$3 WHERE id=$4`
	tag, err := r.q(ctx).Exec(ctx, q, p.Content, p.Location, p.UpdatedAt, p.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *postRepository) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.q(ctx).Exec(ctx, `DELETE FROM posts WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *postRepository) AddLike(ctx context.Context, postID, userID uuid.UUID) error {
	_, err := r.q(ctx).Exec(ctx,
		`INSERT INTO likes (post_id, user_id) VALUES ($1, $2)`, postID, userID)
	if err != nil {
		if strings.Contains(err.Error(), "23505") {
			return apperrors.ErrAlreadyExists
		}
		return err
	}
	_, err = r.q(ctx).Exec(ctx, `UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1`, postID)
	return err
}

func (r *postRepository) RemoveLike(ctx context.Context, postID, userID uuid.UUID) error {
	tag, err := r.q(ctx).Exec(ctx,
		`DELETE FROM likes WHERE post_id=$1 AND user_id=$2`, postID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	_, err = r.q(ctx).Exec(ctx, `UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1`, postID)
	return err
}

func (r *postRepository) IsLiked(ctx context.Context, postID, userID uuid.UUID) (bool, error) {
	var exists bool
	err := r.q(ctx).QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM likes WHERE post_id=$1 AND user_id=$2)`, postID, userID,
	).Scan(&exists)
	return exists, err
}
