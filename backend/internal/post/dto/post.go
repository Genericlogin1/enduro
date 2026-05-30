package dto

import (
	"time"

	"github.com/google/uuid"

	"enduro/internal/post/entity"
)

type CreatePostRequest struct {
	Content   string   `json:"content"`
	Location  *string  `json:"location"`
	MediaURLs []string `json:"media_urls"`
}

type UpdatePostRequest struct {
	Content  *string `json:"content"`
	Location *string `json:"location"`
}

type PostResponse struct {
	ID         uuid.UUID `json:"id"`
	AuthorID   uuid.UUID `json:"author_id"`
	AuthorName string    `json:"author_name"`
	Content    string    `json:"content"`
	Location   *string   `json:"location"`
	MediaURLs  []string  `json:"media_urls"`
	LikesCount int       `json:"likes_count"`
	LikedByMe  bool      `json:"liked_by_me"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func ToPostResponse(p *entity.Post, likedByMe bool) PostResponse {
	urls := p.MediaURLs
	if urls == nil {
		urls = []string{}
	}
	return PostResponse{
		ID:         p.ID,
		AuthorID:   p.AuthorID,
		AuthorName: p.AuthorName,
		Content:    p.Content,
		Location:   p.Location,
		MediaURLs:  urls,
		LikesCount: p.LikesCount,
		LikedByMe:  likedByMe,
		CreatedAt:  p.CreatedAt,
		UpdatedAt:  p.UpdatedAt,
	}
}
