package post

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

func (r *repository) Create(ctx context.Context, p *Post) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO posts (id, user_id, content, media_url, media_type, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		p.ID, p.UserID, p.Content, p.MediaURL, p.MediaType, p.CreatedAt, p.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("create post: %w", err)
	}
	return nil
}

func (r *repository) GetByID(ctx context.Context, id uuid.UUID) (*Post, error) {
	var p Post
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, content, media_url, media_type, likes_count, comment_count, created_at, updated_at
		 FROM posts WHERE id = $1`, id,
	).Scan(&p.ID, &p.UserID, &p.Content, &p.MediaURL, &p.MediaType, &p.LikesCount, &p.CommentCount, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.NewNotFound("post not found")
		}
		return nil, fmt.Errorf("get post by id: %w", err)
	}
	return &p, nil
}

func (r *repository) List(ctx context.Context, limit, offset int) ([]*Post, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, content, media_url, media_type, likes_count, comment_count, created_at, updated_at
		 FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("list posts: %w", err)
	}
	defer rows.Close()

	var posts []*Post
	for rows.Next() {
		var p Post
		if err := rows.Scan(&p.ID, &p.UserID, &p.Content, &p.MediaURL, &p.MediaType, &p.LikesCount, &p.CommentCount, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan post: %w", err)
		}
		posts = append(posts, &p)
	}
	return posts, rows.Err()
}

func (r *repository) Update(ctx context.Context, p *Post) error {
	result, err := r.pool.Exec(ctx,
		`UPDATE posts SET content=$1, media_url=$2, media_type=$3, updated_at=$4 WHERE id=$5`,
		p.Content, p.MediaURL, p.MediaType, p.UpdatedAt, p.ID,
	)
	if err != nil {
		return fmt.Errorf("update post: %w", err)
	}
	if result.RowsAffected() == 0 {
		return domain.NewNotFound("post not found")
	}
	return nil
}

func (r *repository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM posts WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete post: %w", err)
	}
	if result.RowsAffected() == 0 {
		return domain.NewNotFound("post not found")
	}
	return nil
}

func (r *repository) AddLike(ctx context.Context, postID, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		postID, userID,
	)
	if err != nil {
		return fmt.Errorf("add like: %w", err)
	}
	_, err = r.pool.Exec(ctx, `UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1`, postID)
	return err
}

func (r *repository) RemoveLike(ctx context.Context, postID, userID uuid.UUID) error {
	result, err := r.pool.Exec(ctx,
		`DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`, postID, userID,
	)
	if err != nil {
		return fmt.Errorf("remove like: %w", err)
	}
	if result.RowsAffected() > 0 {
		_, err = r.pool.Exec(ctx, `UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1`, postID)
	}
	return err
}

func (r *repository) IsLiked(ctx context.Context, postID, userID uuid.UUID) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2)`,
		postID, userID,
	).Scan(&exists)
	return exists, err
}
